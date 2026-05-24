from __future__ import annotations

import importlib.util
import json
import re
import sys
import time
from datetime import datetime
from pathlib import Path

import openpyxl
from playwright.sync_api import TimeoutError as PlaywrightTimeoutError


BASE_DIR = Path(__file__).resolve().parent
BASE_MODULE_PATH = BASE_DIR / "run_deployed_tests.py"
SPEC = importlib.util.spec_from_file_location("deployed_runner_base", BASE_MODULE_PATH)
BASE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = BASE
SPEC.loader.exec_module(BASE)


STUDENT_CASES = ["WEB-LOG-001", "WEB-CUE-001", "WEB-BIB-001", "WEB-BIB-002", "WEB-SOL-001", "WEB-SOL-002", "WEB-SOL-003", "WEB-SOL-004", "WEB-CUE-002"]
ADMIN_CASES = ["WEB-LOG-002", "WEB-LIB-001", "WEB-LIB-002", "WEB-LIB-003", "WEB-ALU-001", "WEB-ALU-002", "WEB-ALU-003", "WEB-ALU-004", "WEB-DOC-001", "WEB-DOC-002", "WEB-GES-001", "WEB-GES-002", "WEB-GES-003", "WEB-PRE-001", "WEB-PRE-002", "WEB-ANA-001", "WEB-ANA-002"]


class TargetedRerun(BASE.TestRunner):
    def __init__(self) -> None:
        super().__init__()
        stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        self.artifact_dir = Path(".codex-test-artifacts") / f"login-blocked-rerun-{stamp}"
        self.artifact_dir.mkdir(parents=True, exist_ok=True)
        self.created_book = None
        self.created_boleta = None
        self.student_email = None
        self.student_temp_password = "Cambio7!"
        self.pending_candidates: list[dict] = []
        self.request_for_approve = None
        self.request_for_reject = None
        self.request_for_cancel = None
        self.loan_title = None
        token = datetime.now().strftime("%H%M%S%f")
        self.book_payload = {
            "titulo": f"QA Libro {token[-6:]}",
            "autor": "Codex QA",
            "clasificacion": f"QA-{token[-4:]}",
            "isbn": f"9786{token[-9:]}",
            "tipo_material": "Texto",
            "codigo_barras": f"QA{token[-8:]}",
            "numero_ejemplar": "1",
            "anio": "2024",
            "estatus_item": "Nuevo",
            "coleccion": "QA",
            "disponible": True,
        }
        self.book_payload_duplicate = {
            **self.book_payload,
            "titulo": f"QA Libro Duplicado {token[-5:]}",
            "codigo_barras": f"QB{token[-8:]}",
        }
        self.boleta_payload = {
            "boleta": f"8{token[-9:]}",
            "nombre": f"QA ALUMNO {token[-4:]}",
            "Grupo": "6CM1",
        }
        self.bulk_xlsx_path = self.artifact_dir / "alumnos-preview.xlsx"
        self.bulk_pdf_path = self.artifact_dir / "archivo-no-soportado.pdf"

    def login_student(self, browser):
        context, page = self.new_page(browser)
        self.fill_login(page, *BASE.STUDENT_CREDS)
        return context, page

    def login_admin(self, browser):
        context, page = self.new_page(browser)
        self.fill_login(page, *BASE.ADMIN_CREDS)
        return context, page

    def body_text(self, page) -> str:
        try:
            return page.locator("body").inner_text(timeout=5000)
        except Exception:
            return ""

    def wait_for_text(self, page, needle: str, timeout_ms: int = 10000) -> bool:
        end = time.time() + (timeout_ms / 1000)
        needle_norm = self.compact_text(needle)
        while time.time() < end:
            try:
                body = self.compact_text(self.body_text(page))
            except Exception:
                body = ""
            if needle_norm in body:
                return True
            page.wait_for_timeout(250)
        return False

    def fetch_json(self, page, endpoint: str, method: str = "GET", body: dict | None = None):
        payload = page.evaluate(
            """async ({ endpoint, method, body }) => {
                const options = { method, credentials: 'include', headers: {} };
                if (body !== null) {
                    options.headers['Content-Type'] = 'application/json';
                    options.body = JSON.stringify(body);
                }
                const response = await fetch(endpoint, options);
                const text = await response.text();
                let data;
                try { data = JSON.parse(text); } catch { data = text; }
                return { status: response.status, data };
            }""",
            {"endpoint": endpoint, "method": method, "body": body},
        )
        return payload

    def extract_list(self, payload):
        data = payload.get("data")
        if isinstance(data, dict):
            if isinstance(data.get("data"), list):
                return data["data"]
            if isinstance(data.get("solicitudes"), list):
                return data["solicitudes"]
        if isinstance(data, list):
            return data
        return []

    def get_student_session(self, page):
        return self.fetch_json(page, "/auth/session").get("data", {})

    def get_student_requests(self, page):
        return self.extract_list(self.fetch_json(page, "/auth/recursos/usuario"))

    def get_admin_requests(self, page):
        return self.extract_list(self.fetch_json(page, "/auth/admin/solicitudes/libros"))

    def get_admin_loans(self, page):
        return self.extract_list(self.fetch_json(page, "/auth/admin/prestamos/libros"))

    def get_admin_users(self, page):
        return self.extract_list(self.fetch_json(page, "/auth/admin/usuarios"))

    def get_admin_boletas(self, page):
        return self.extract_list(self.fetch_json(page, "/auth/admin/boletas"))

    def get_books_catalog(self, page):
        return self.extract_list(self.fetch_json(page, "/auth/recursos?tipo=libro"))

    def pending_requests(self, items: list[dict]) -> list[dict]:
        result = []
        for item in items:
            estado = item.get("estado_solicitud_id", item.get("estado_asistencia_id"))
            if item.get("tipo_solicitud") == "libro" and estado == 1:
                result.append(item)
        return result

    def click_button_in_card(self, page, card_text: str, button_name: str) -> bool:
        cards = page.locator(".resource-card")
        count = cards.count()
        for idx in range(count):
            card = cards.nth(idx)
            try:
                text = card.inner_text(timeout=2000)
            except Exception:
                continue
            if self.compact_text(card_text) not in self.compact_text(text):
                continue
            button = card.get_by_role("button", name=button_name)
            if button.count() == 0:
                continue
            try:
                if not button.first.is_enabled():
                    continue
                button.first.click(timeout=4000)
                return True
            except Exception:
                continue
        return False

    def close_modal_if_visible(self, page) -> None:
        for name in ["Cerrar", "Cancelar"]:
            button = page.get_by_role("button", name=name)
            if button.count() and button.first.is_visible():
                try:
                    button.first.click()
                    page.wait_for_timeout(300)
                    return
                except Exception:
                    pass

    def create_preview_files(self) -> None:
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.append(["Nombres", "Boleta", "Grupos"])
        ws.append([self.boleta_payload["nombre"], self.boleta_payload["boleta"], self.boleta_payload["Grupo"]])
        ws.append(["DUPLICADO QA", self.boleta_payload["boleta"], "6CM1"])
        ws.append(["INVALIDO QA", "12345", ""])
        wb.save(self.bulk_xlsx_path)
        self.bulk_pdf_path.write_bytes(b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF")

    def create_request_via_ui(self, page, expected_title: str | None = None):
        before = self.pending_requests(self.get_student_requests(page))
        before_ids = {item["id"] for item in before if "id" in item}
        self.goto(page, "/user/libros")
        page.wait_for_timeout(1000)

        candidates = self.get_books_catalog(page)
        selected = None
        for item in candidates:
            title = item.get("libros", {}).get("titulo") or item.get("titulo") or ""
            available = item.get("Disponible", item.get("disponible"))
            if not available:
                continue
            if expected_title and self.compact_text(expected_title) not in self.compact_text(title):
                continue
            selected = {"id": item.get("id"), "title": title}

            search_input = page.get_by_placeholder("Buscar por título, autor, ISBN...")
            if search_input.count():
                search_input.fill(selected["title"])
                page.wait_for_timeout(600)

            if self.click_button_in_card(page, selected["title"], "Solicitar"):
                break
            selected = None
            if search_input.count():
                search_input.fill("")
                page.wait_for_timeout(250)
        if not selected:
            return None
        page.wait_for_timeout(500)
        confirm = page.get_by_role("button", name="Confirmar")
        if confirm.count() == 0:
            return None
        confirm.first.click()
        page.wait_for_timeout(1500)
        try:
            page.wait_for_load_state("networkidle", timeout=5000)
        except PlaywrightTimeoutError:
            pass

        after = self.pending_requests(self.get_student_requests(page))
        created = [item for item in after if item.get("id") not in before_ids]
        if created:
            return created[0]
        for item in after:
            if self.compact_text(item.get("titulo", "")) == self.compact_text(selected["title"]):
                return item
        return None

    def verify_limit_banner(self, page) -> bool:
        self.goto(page, "/user/libros")
        page.wait_for_timeout(1000)
        body = self.body_text(page)
        return (
            "Ya tienes 3 solicitudes de libros activas" in body
            or page.get_by_role("button", name="Límite alcanzado").count() > 0
        )

    def cancel_request_via_ui(self, page, request_item: dict) -> bool:
        self.goto(page, "/user/mis-solicitudes-libros")
        page.wait_for_timeout(1200)
        search = page.get_by_placeholder("Buscar por título...")
        title = request_item.get("titulo") or request_item.get("ejemplares", {}).get("libros", {}).get("titulo") or ""
        if search.count() and title:
            search.fill(title)
            page.wait_for_timeout(600)
        if not self.click_button_in_card(page, title or f"#{request_item.get('id')}", "Cancelar"):
            return False
        confirm = page.get_by_role("button", name=re.compile("Sí, cancelar", re.I))
        if confirm.count() == 0:
            return False
        confirm.first.click()
        page.wait_for_timeout(1400)
        updated = self.get_student_requests(page)
        target = next((item for item in updated if item.get("id") == request_item.get("id")), None)
        if not target:
            return True
        return target.get("estado_solicitud_id", target.get("estado_asistencia_id")) == 4

    def approve_request_via_ui(self, page, request_item: dict) -> bool:
        title = request_item.get("titulo") or request_item.get("ejemplares", {}).get("libros", {}).get("titulo") or ""
        self.goto(page, "/admin/solicitudes-libros")
        page.wait_for_timeout(1200)
        search = page.get_by_placeholder("Buscar por título, boleta...")
        if search.count() and title:
            search.fill(title)
            page.wait_for_timeout(600)
        if not self.click_button_in_card(page, title or f"#{request_item.get('id')}", "Aprobar"):
            return False
        confirm = page.get_by_role("button", name="Confirmar")
        if confirm.count() == 0:
            return False
        confirm.first.click()
        page.wait_for_timeout(1600)
        updated = self.get_admin_requests(page)
        target = next((item for item in updated if item.get("id") == request_item.get("id")), None)
        if not target:
            return False
        return target.get("estado_solicitud_id", target.get("estado_asistencia_id")) == 2

    def reject_request_via_ui(self, page, request_item: dict) -> tuple[bool, bool, Path | None]:
        title = request_item.get("titulo") or request_item.get("ejemplares", {}).get("libros", {}).get("titulo") or ""
        self.goto(page, "/admin/solicitudes-libros")
        page.wait_for_timeout(1200)
        search = page.get_by_placeholder("Buscar por título, boleta...")
        if search.count() and title:
            search.fill(title)
            page.wait_for_timeout(600)
        if not self.click_button_in_card(page, title or f"#{request_item.get('id')}", "Rechazar"):
            return False, False, None
        page.wait_for_timeout(500)
        body = self.body_text(page)
        has_reason_field = page.locator("textarea").count() > 0 or "Motivo" in body
        shot = None
        if not has_reason_field:
            shot = self.screenshot(page, "WEB-GES-002")
        confirm = page.get_by_role("button", name="Confirmar")
        if confirm.count():
            confirm.first.click()
            page.wait_for_timeout(1600)
        updated = self.get_admin_requests(page)
        target = next((item for item in updated if item.get("id") == request_item.get("id")), None)
        rejected = bool(target and target.get("estado_solicitud_id", target.get("estado_asistencia_id")) == 3)
        return has_reason_field, rejected, shot

    def deliver_request_via_ui(self, page, request_item: dict) -> bool:
        title = request_item.get("titulo") or request_item.get("ejemplares", {}).get("libros", {}).get("titulo") or ""
        self.goto(page, "/admin/solicitudes-libros")
        page.wait_for_timeout(1200)
        search = page.get_by_placeholder("Buscar por título, boleta...")
        if search.count() and title:
            search.fill(title)
            page.wait_for_timeout(600)
        if not self.click_button_in_card(page, title or f"#{request_item.get('id')}", "Registrar Entrega"):
            return False
        confirm = page.get_by_role("button", name="Confirmar")
        if confirm.count() == 0:
            return False
        confirm.first.click()
        page.wait_for_timeout(1800)
        loans = self.get_admin_loans(page)
        loan = next((item for item in loans if self.compact_text(item.get("solicitudes_libros", {}).get("ejemplares", {}).get("libros", {}).get("titulo", "")) == self.compact_text(title)), None)
        if loan:
            self.loan_title = title
            return True
        return False

    def mark_return_via_ui(self, page, title: str) -> bool:
        self.goto(page, "/admin/prestamos-libros")
        page.wait_for_timeout(1200)
        search = page.get_by_placeholder("Buscar por título, boleta...")
        if search.count():
            search.fill(title)
            page.wait_for_timeout(600)
        if not self.click_button_in_card(page, title, "Marcar Devuelto"):
            return False
        confirm = page.get_by_role("button", name="Confirmar")
        if confirm.count() == 0:
            return False
        confirm.first.click()
        page.wait_for_timeout(1800)
        loans = self.get_admin_loans(page)
        loan = next((item for item in loans if self.compact_text(item.get("solicitudes_libros", {}).get("ejemplares", {}).get("libros", {}).get("titulo", "")) == self.compact_text(title)), None)
        return bool(loan and loan.get("estado_prestamo_id") == 3)

    def create_book_via_ui(self, page, payload: dict) -> bool:
        self.goto(page, "/admin/libros")
        page.wait_for_timeout(1000)
        page.get_by_role("button", name="Nuevo Libro").click()
        page.wait_for_timeout(400)
        inputs = page.locator("#form-libro input")
        values = [
            payload["titulo"],
            payload["autor"],
            payload["clasificacion"],
            payload["isbn"],
            payload["tipo_material"],
            payload["codigo_barras"],
            payload["numero_ejemplar"],
            payload["anio"],
            payload["estatus_item"],
            payload["coleccion"],
        ]
        for idx, value in enumerate(values):
            inputs.nth(idx).fill(str(value))
        page.get_by_role("button", name="Guardar").click()
        page.wait_for_timeout(1800)
        body = self.body_text(page)
        if "Libro creado" in body or page.locator(".resource-card").filter(has_text=payload["titulo"]).count() > 0:
            self.created_book = payload["titulo"]
            return True
        return False

    def delete_book_via_ui(self, page, title: str) -> bool:
        self.goto(page, "/admin/libros")
        page.wait_for_timeout(1000)
        search = page.get_by_placeholder("Buscar por título, autor, ISBN...")
        if search.count():
            search.fill(title)
            page.wait_for_timeout(600)
        if not self.click_button_in_card(page, title, ""):
            trash = page.locator(".resource-card").filter(has_text=title).locator("button.btn-danger")
            if trash.count() == 0:
                return False
            trash.first.click()
        else:
            page.locator(".resource-card").filter(has_text=title).locator("button.btn-danger").first.click()
        page.wait_for_timeout(300)
        confirm = page.get_by_role("button", name="Eliminar")
        if confirm.count() == 0:
            return False
        confirm.first.click()
        page.wait_for_timeout(1400)
        return page.locator(".resource-card").filter(has_text=title).count() == 0

    def create_boleta_via_ui(self, page) -> bool:
        self.goto(page, "/admin/alumnos")
        page.wait_for_timeout(1000)
        page.get_by_role("button", name="Nuevo alumno").click()
        page.wait_for_timeout(400)
        inputs = page.locator("#form-alumno input")
        inputs.nth(0).fill(self.boleta_payload["boleta"])
        inputs.nth(1).fill(self.boleta_payload["nombre"])
        inputs.nth(2).fill(self.boleta_payload["Grupo"])
        page.get_by_role("button", name="Guardar").click()
        page.wait_for_timeout(1600)
        self.created_boleta = self.boleta_payload["boleta"]
        self.goto(page, "/admin/alumnos")
        page.wait_for_timeout(800)
        search = page.get_by_placeholder("Buscar boleta, nombre o grupo...")
        if search.count():
            search.fill(self.boleta_payload["boleta"])
            page.wait_for_timeout(500)
        return page.locator(".resource-card").filter(has_text=self.boleta_payload["boleta"]).count() > 0

    def delete_boleta_via_ui(self, page, boleta: str) -> bool:
        self.goto(page, "/admin/alumnos")
        page.wait_for_timeout(1000)
        search = page.get_by_placeholder("Buscar boleta, nombre o grupo...")
        if search.count():
            search.fill(boleta)
            page.wait_for_timeout(500)
        card = page.locator(".resource-card").filter(has_text=boleta)
        if card.count() == 0:
            return False
        trash = card.locator("button.btn-danger")
        if trash.count() == 0:
            return False
        trash.first.click()
        page.wait_for_timeout(300)
        confirm = page.get_by_role("button", name="Eliminar")
        if confirm.count() == 0:
            return False
        confirm.first.click()
        page.wait_for_timeout(1500)
        self.goto(page, "/admin/alumnos")
        page.wait_for_timeout(600)
        if search.count():
            search.fill(boleta)
            page.wait_for_timeout(500)
        return page.locator(".resource-card").filter(has_text=boleta).count() == 0

    def change_student_password(self, browser, current_password: str, new_password: str) -> bool:
        context, page = self.login_student(browser) if current_password == BASE.STUDENT_CREDS[1] else self.new_page(browser)
        if current_password != BASE.STUDENT_CREDS[1]:
            self.fill_login(page, BASE.STUDENT_CREDS[0], current_password)
        if not self.login_success(page, "/user"):
            context.close()
            return False
        self.goto(page, "/user/cuenta")
        page.wait_for_timeout(800)
        if not self.student_email:
            session = self.get_student_session(page)
            self.student_email = session.get("user", {}).get("email") or session.get("user", {}).get("correo")
        inputs = page.locator("input")
        if inputs.count() < 4:
            context.close()
            return False
        inputs.nth(0).fill(self.student_email or "")
        inputs.nth(1).fill(current_password)
        inputs.nth(2).fill(new_password)
        inputs.nth(3).fill(new_password)
        page.get_by_role("button", name=re.compile("Actualizar contrase", re.I)).click()
        page.wait_for_timeout(2500)
        success = "Contraseña actualizada correctamente" in self.body_text(page)
        context.close()
        if not success:
            return False
        verify_context, verify_page = self.new_page(browser)
        self.fill_login(verify_page, BASE.STUDENT_CREDS[0], new_password)
        verified = self.login_success(verify_page, "/user")
        verify_context.close()
        return verified

    def run(self) -> None:
        self.create_preview_files()
        play = None
        browser = None
        student_context = None
        admin_context = None
        try:
            play = BASE.sync_playwright().start()
            browser = play.chromium.launch(headless=True)

            # Student login and read-only student coverage
            student_context, student_page = self.login_student(browser)
            if self.login_success(student_page, "/user"):
                self.record("WEB-LOG-001", "PASS", "El alumno autentico correctamente y entro a /user con la password corregida.")
                session = self.get_student_session(student_page)
                self.student_email = session.get("user", {}).get("email") or session.get("user", {}).get("correo")

                self.goto(student_page, "/user/perfil")
                student_page.wait_for_timeout(1000)
                body = self.body_text(student_page)
                if "Mi Perfil" in body and str(BASE.STUDENT_CREDS[0]) in body:
                    self.record("WEB-CUE-001", "PASS", "La vista /user/perfil cargo datos del alumno y el resumen de solicitudes.")
                else:
                    self.record("WEB-CUE-001", "FAIL", "La vista /user/perfil no mostro la informacion esperada del alumno.", self.screenshot(student_page, "WEB-CUE-001"))

                self.goto(student_page, "/user/libros")
                student_page.wait_for_timeout(1200)
                body = self.body_text(student_page)
                cards = student_page.locator(".resource-card").count()
                if "Error al cargar libros" not in body and (cards > 0 or "No se encontraron libros" in body):
                    self.record("WEB-BIB-001", "PASS", "La biblioteca cargo el catalogo de libros o el estado vacio sin error.")
                else:
                    self.record("WEB-BIB-001", "FAIL", "La biblioteca no mostro catalogo ni estado vacio valido.", self.screenshot(student_page, "WEB-BIB-001"))

                error_context, error_page = self.new_page(browser)
                error_page.route("**/auth/recursos?tipo=libro*", lambda route: route.fulfill(status=500, content_type="application/json", body=json.dumps({"error": "Fallo simulado"})))
                self.fill_login(error_page, *BASE.STUDENT_CREDS)
                if self.login_success(error_page, "/user"):
                    self.goto(error_page, "/user/libros")
                    error_page.wait_for_timeout(1600)
                    if self.wait_for_text(error_page, "Error al cargar libros", 5000):
                        self.record("WEB-BIB-002", "PASS", "Al fallar la API, la vista mostro el mensaje de error al cargar libros.")
                    else:
                        self.record("WEB-BIB-002", "FAIL", "No se mostro el mensaje esperado cuando fallo la API de libros.", self.screenshot(error_page, "WEB-BIB-002"))
                else:
                    self.record("WEB-BIB-002", "FAIL", "No se pudo abrir una sesion de alumno para simular el fallo de carga.", self.screenshot(error_page, "WEB-BIB-002"))
                error_context.close()

                current_pending = self.pending_requests(self.get_student_requests(student_page))
                created_first = self.create_request_via_ui(student_page)
                if created_first:
                    self.record("WEB-SOL-001", "PASS", f"Se creo una solicitud de libro para '{created_first.get('titulo', 'recurso')}' y se actualizo la disponibilidad visual.")
                else:
                    self.record("WEB-SOL-001", "FAIL", "No fue posible crear una nueva solicitud de libro con la cuenta de alumno actual.", self.screenshot(student_page, "WEB-SOL-001"))

                # Reach limit of 3 pending requests if possible.
                attempts = 0
                while len(self.pending_requests(self.get_student_requests(student_page))) < 3 and attempts < 4:
                    attempts += 1
                    created = self.create_request_via_ui(student_page)
                    if not created:
                        break

                pending_now = self.pending_requests(self.get_student_requests(student_page))
                self.pending_candidates = pending_now
                if len(pending_now) >= 3 and self.verify_limit_banner(student_page):
                    self.record("WEB-SOL-003", "PASS", "Con 3 solicitudes pendientes, la UI mostro el limite alcanzado y bloqueo nuevas solicitudes.")
                else:
                    self.record("WEB-SOL-003", "FAIL", "No se logro validar el limite de 3 solicitudes pendientes con la cuenta actual.", self.screenshot(student_page, "WEB-SOL-003"))

                if session.get("user", {}).get("tiene_documentos") is False:
                    self.record("WEB-SOL-002", "PASS", "La cuenta de alumno tenia_documentos=false y el flujo quedo bloqueado como se esperaba.")
                    self.record("WEB-DOC-002", "PASS", "La solicitud de un alumno sin documentos quedo bloqueada por el backend.")
                else:
                    shot = self.screenshot(student_page, "WEB-SOL-002")
                    self.record("WEB-SOL-002", "FAIL", "No fue posible validar el bloqueo por documentacion porque la cuenta proporcionada tiene_documentos=true.", shot)
                    self.record("WEB-DOC-002", "FAIL", "No fue posible validar el bloqueo backend por falta de documentos porque no se proporciono una cuenta con tiene_documentos=false.", shot)
            else:
                shot = self.screenshot(student_page, "student-login-rerun-fail")
                for case_id in STUDENT_CASES:
                    self.record(case_id, "FAIL", "No se pudo autenticar la cuenta de alumno con la password corregida.", shot)
            # Keep student session for cancel flow later.

            # Admin login and admin coverage
            admin_context, admin_page = self.login_admin(browser)
            if self.login_success(admin_page, "/admin"):
                self.record("WEB-LOG-002", "PASS", "El administrador autentico correctamente y entro a /admin con la boleta corregida.")

                if self.create_book_via_ui(admin_page, self.book_payload):
                    self.record("WEB-LIB-001", "PASS", f"Se creo el libro temporal '{self.book_payload['titulo']}' desde /admin/libros.")
                else:
                    self.record("WEB-LIB-001", "FAIL", "No fue posible crear el libro temporal en /admin/libros.", self.screenshot(admin_page, "WEB-LIB-001"))

                self.goto(admin_page, "/admin/libros")
                admin_page.wait_for_timeout(1000)
                admin_page.get_by_role("button", name="Nuevo Libro").click()
                admin_page.wait_for_timeout(400)
                inputs = admin_page.locator("#form-libro input")
                dup_values = [
                    self.book_payload_duplicate["titulo"],
                    self.book_payload_duplicate["autor"],
                    self.book_payload_duplicate["clasificacion"],
                    self.book_payload_duplicate["isbn"],
                    self.book_payload_duplicate["tipo_material"],
                    self.book_payload_duplicate["codigo_barras"],
                    self.book_payload_duplicate["numero_ejemplar"],
                    self.book_payload_duplicate["anio"],
                    self.book_payload_duplicate["estatus_item"],
                    self.book_payload_duplicate["coleccion"],
                ]
                for idx, value in enumerate(dup_values):
                    inputs.nth(idx).fill(str(value))
                admin_page.get_by_role("button", name="Guardar").click()
                admin_page.wait_for_timeout(1500)
                body = self.body_text(admin_page)
                if "duplic" in self.compact_text(body) or "isbn" in self.compact_text(body):
                    self.record("WEB-LIB-002", "PASS", "La UI mostro conflicto por ISBN duplicado al intentar guardar el segundo libro.")
                else:
                    self.record("WEB-LIB-002", "FAIL", "No se detecto conflicto visible por ISBN duplicado.", self.screenshot(admin_page, "WEB-LIB-002"))
                self.close_modal_if_visible(admin_page)

                self.goto(admin_page, "/admin/libros")
                admin_page.wait_for_timeout(1000)
                admin_page.get_by_role("button", name="Nuevo Libro").click()
                admin_page.wait_for_timeout(400)
                inputs = admin_page.locator("#form-libro input")
                bad_year_values = [
                    f"{self.book_payload['titulo']} BADYEAR",
                    self.book_payload["autor"],
                    self.book_payload["clasificacion"],
                    f"9787{datetime.now().strftime('%H%M%S%f')[-9:]}",
                    self.book_payload["tipo_material"],
                    f"QC{datetime.now().strftime('%H%M%S%f')[-8:]}",
                    "2",
                    "999",
                    self.book_payload["estatus_item"],
                    self.book_payload["coleccion"],
                ]
                for idx, value in enumerate(bad_year_values):
                    inputs.nth(idx).fill(str(value))
                year_input = inputs.nth(7)
                admin_page.get_by_role("button", name="Guardar").click()
                admin_page.wait_for_timeout(600)
                is_invalid = year_input.evaluate("(el) => !el.checkValidity()")
                if is_invalid:
                    self.record("WEB-LIB-003", "PASS", "La validacion del formulario bloqueo el año 999 fuera del rango permitido.")
                else:
                    self.record("WEB-LIB-003", "FAIL", "El formulario no bloqueo un año fuera de rango.", self.screenshot(admin_page, "WEB-LIB-003"))
                self.close_modal_if_visible(admin_page)

                if self.create_boleta_via_ui(admin_page):
                    self.record("WEB-ALU-001", "PASS", f"Se creo la boleta temporal {self.boleta_payload['boleta']} en el catalogo.")
                else:
                    self.record("WEB-ALU-001", "FAIL", "No fue posible crear la boleta temporal en /admin/alumnos.", self.screenshot(admin_page, "WEB-ALU-001"))

                self.goto(admin_page, "/admin/alumnos")
                admin_page.wait_for_timeout(1000)
                search = admin_page.get_by_placeholder("Buscar boleta, nombre o grupo...")
                search.fill("1000000001")
                admin_page.wait_for_timeout(600)
                protected_card = admin_page.locator(".resource-card").filter(has_text="1000000001")
                if protected_card.count() > 0:
                    edit_button = protected_card.locator("button").filter(has_text="Editar")
                    is_disabled = edit_button.first.is_disabled()
                    if is_disabled:
                        self.record("WEB-ALU-002", "PASS", "La boleta real del administrador aparecio protegida y no permitio editarse.")
                    else:
                        self.record("WEB-ALU-002", "FAIL", "La boleta real del administrador no quedo protegida en la UI; el boton Editar siguio habilitado.", self.screenshot(admin_page, "WEB-ALU-002"))
                else:
                    search.fill("10000000001")
                    admin_page.wait_for_timeout(600)
                    old_card = admin_page.locator(".resource-card").filter(has_text="10000000001")
                    if old_card.count() > 0 and old_card.locator("button").filter(has_text="Editar").first.is_disabled():
                        self.record("WEB-ALU-002", "FAIL", "La proteccion sigue apuntando a la boleta antigua de 11 digitos, no a la credencial admin vigente de 10 digitos.", self.screenshot(admin_page, "WEB-ALU-002"))
                    else:
                        self.record("WEB-ALU-002", "FAIL", "No se encontro una boleta protegida coherente con la credencial admin vigente.", self.screenshot(admin_page, "WEB-ALU-002"))

                self.goto(admin_page, "/admin/alumnos")
                admin_page.wait_for_timeout(1000)
                admin_page.get_by_role("button", name="Carga masiva").click()
                admin_page.wait_for_timeout(500)
                file_input = admin_page.locator("input[type='file']")
                file_input.set_input_files(str(self.bulk_xlsx_path))
                admin_page.wait_for_timeout(1800)
                body = self.body_text(admin_page)
                if all(text in body for text in ["válidas", "duplicadas", "con error"]):
                    self.record("WEB-ALU-003", "PASS", "La carga masiva mostro el resumen de filas validas, duplicadas e invalidas.")
                else:
                    self.record("WEB-ALU-003", "FAIL", "La vista previa de carga masiva no mostro el resumen esperado.", self.screenshot(admin_page, "WEB-ALU-003"))
                self.close_modal_if_visible(admin_page)

                self.goto(admin_page, "/admin/alumnos")
                admin_page.wait_for_timeout(1000)
                admin_page.get_by_role("button", name="Carga masiva").click()
                admin_page.wait_for_timeout(500)
                file_input = admin_page.locator("input[type='file']")
                file_input.set_input_files(str(self.bulk_pdf_path))
                admin_page.wait_for_timeout(1200)
                body = self.body_text(admin_page)
                if "soport" in self.compact_text(body) or "csv" in self.compact_text(body) or "xlsx" in self.compact_text(body):
                    self.record("WEB-ALU-004", "PASS", "La UI rechazo el archivo no soportado para la carga masiva.")
                else:
                    self.record("WEB-ALU-004", "FAIL", "No se mostro un rechazo visible para el archivo no soportado.", self.screenshot(admin_page, "WEB-ALU-004"))
                self.close_modal_if_visible(admin_page)

                users_before = self.get_admin_users(admin_page)
                no_docs_user = next((u for u in users_before if not u.get("tiene_documentos")), None)
                self.goto(admin_page, "/admin/documentos")
                admin_page.wait_for_timeout(1000)
                if no_docs_user:
                    search = admin_page.get_by_placeholder("Buscar por boleta o correo...")
                    if search.count():
                        search.fill(str(no_docs_user.get("boleta") or no_docs_user.get("correo") or ""))
                        admin_page.wait_for_timeout(500)
                    if self.click_button_in_card(admin_page, str(no_docs_user.get("boleta") or no_docs_user.get("correo") or ""), "Habilitar"):
                        admin_page.wait_for_timeout(1600)
                        users_after = self.get_admin_users(admin_page)
                        updated = next((u for u in users_after if u.get("id") == no_docs_user.get("id")), None)
                        if updated and updated.get("tiene_documentos"):
                            self.record("WEB-DOC-001", "PASS", f"Se habilito la documentacion para el usuario {updated.get('boleta')}.")
                        else:
                            self.record("WEB-DOC-001", "FAIL", "La UI permitio pulsar Habilitar, pero el usuario no quedo con documentacion aprobada.", self.screenshot(admin_page, "WEB-DOC-001"))
                    else:
                        self.record("WEB-DOC-001", "FAIL", "No se encontro el boton Habilitar para un usuario pendiente de documentacion.", self.screenshot(admin_page, "WEB-DOC-001"))
                else:
                    self.record("WEB-DOC-001", "FAIL", "No habia usuarios pendientes de documentacion para ejecutar el caso.", self.screenshot(admin_page, "WEB-DOC-001"))

                # Request management: pick pending requests from the student account.
                current_pending = self.pending_requests(self.get_student_requests(student_page))
                if current_pending:
                    self.request_for_approve = current_pending[0]
                if len(current_pending) > 1:
                    self.request_for_reject = current_pending[1]
                if len(current_pending) > 2:
                    self.request_for_cancel = current_pending[2]

                if self.request_for_approve and self.approve_request_via_ui(admin_page, self.request_for_approve):
                    self.record("WEB-GES-001", "PASS", "La solicitud seleccionada fue aprobada desde /admin/solicitudes-libros.")
                else:
                    self.record("WEB-GES-001", "FAIL", "No fue posible aprobar una solicitud pendiente desde la UI de admin.", self.screenshot(admin_page, "WEB-GES-001"))

                if self.request_for_reject:
                    has_reason_field, rejected, shot = self.reject_request_via_ui(admin_page, self.request_for_reject)
                    if has_reason_field and rejected:
                        self.record("WEB-GES-002", "PASS", "La UI permitio rechazar la solicitud mostrando un campo de motivo.")
                    elif rejected:
                        self.record("WEB-GES-002", "FAIL", "La solicitud fue rechazada, pero la UI no solicito ni mostro un motivo de rechazo.", shot or self.screenshot(admin_page, "WEB-GES-002"))
                    else:
                        self.record("WEB-GES-002", "FAIL", "No fue posible completar el rechazo de una solicitud pendiente.", shot or self.screenshot(admin_page, "WEB-GES-002"))
                else:
                    self.record("WEB-GES-002", "FAIL", "No hubo una segunda solicitud pendiente disponible para probar el rechazo.", self.screenshot(admin_page, "WEB-GES-002"))

                if self.request_for_approve and self.deliver_request_via_ui(admin_page, self.request_for_approve):
                    self.record("WEB-GES-003", "PASS", "La solicitud aprobada genero un prestamo activo al registrar la entrega.")
                else:
                    self.record("WEB-GES-003", "FAIL", "No fue posible registrar la entrega de la solicitud aprobada.", self.screenshot(admin_page, "WEB-GES-003"))

                self.goto(admin_page, "/admin/prestamos-libros")
                admin_page.wait_for_timeout(1200)
                loans_body = self.body_text(admin_page)
                if self.loan_title and self.compact_text(self.loan_title) in self.compact_text(loans_body):
                    self.record("WEB-PRE-001", "PASS", "La vista de prestamos mostro el prestamo activo generado durante la prueba.")
                elif self.loan_title:
                    self.record("WEB-PRE-001", "FAIL", "La vista de prestamos no mostro el prestamo generado para la prueba.", self.screenshot(admin_page, "WEB-PRE-001"))
                else:
                    cards = admin_page.locator(".resource-card").count()
                    if cards > 0 or "No hay préstamos registrados" in loans_body:
                        self.record("WEB-PRE-001", "PASS", "La vista de prestamos cargo correctamente y mostro listado o estado vacio.")
                    else:
                        self.record("WEB-PRE-001", "FAIL", "La vista de prestamos no cargo un listado valido.", self.screenshot(admin_page, "WEB-PRE-001"))

                if self.loan_title and self.mark_return_via_ui(admin_page, self.loan_title):
                    self.record("WEB-PRE-002", "PASS", "El prestamo de prueba pudo marcarse como devuelto desde la UI.")
                else:
                    self.record("WEB-PRE-002", "FAIL", "No fue posible marcar como devuelto el prestamo usado para la prueba.", self.screenshot(admin_page, "WEB-PRE-002"))

                self.goto(admin_page, "/admin/analytics")
                admin_page.wait_for_timeout(1800)
                analytics_body = self.body_text(admin_page)
                if "Total Usuarios" in analytics_body and "Solicitudes por Estado" in analytics_body:
                    self.record("WEB-ANA-001", "PASS", "La vista de analytics mostro totales y graficos principales.")
                else:
                    self.record("WEB-ANA-001", "FAIL", "La vista de analytics no mostro los bloques esperados de estadisticas.", self.screenshot(admin_page, "WEB-ANA-001"))

                self.goto(admin_page, "/admin/reportes")
                admin_page.wait_for_timeout(1200)
                try:
                    with admin_page.expect_download(timeout=10000) as download_info:
                        admin_page.get_by_role("button", name="Exportar Excel").first.click()
                    download = download_info.value
                    target = self.artifact_dir / download.suggested_filename
                    download.save_as(str(target))
                    self.record("WEB-ANA-002", "PASS", f"El modulo de reportes genero una descarga Excel ({target.name}).")
                except Exception:
                    self.record("WEB-ANA-002", "FAIL", "No se detecto una descarga al exportar el reporte en Excel.", self.screenshot(admin_page, "WEB-ANA-002"))

                # Cleanup temporary admin data where possible.
                if self.created_book:
                    try:
                        self.delete_book_via_ui(admin_page, self.created_book)
                    except Exception:
                        pass
                if self.created_boleta:
                    try:
                        self.delete_boleta_via_ui(admin_page, self.created_boleta)
                    except Exception:
                        pass
            else:
                shot = self.screenshot(admin_page, "admin-login-rerun-fail")
                for case_id in ADMIN_CASES:
                    self.record(case_id, "FAIL", "No se pudo autenticar la cuenta admin con la boleta corregida.", shot)

            # Student cancel case after admin operations
            if self.login_success(student_page, "/user") and self.request_for_cancel:
                if self.cancel_request_via_ui(student_page, self.request_for_cancel):
                    self.record("WEB-SOL-004", "PASS", "El alumno pudo cancelar una solicitud pendiente desde /user/mis-solicitudes-libros.")
                else:
                    self.record("WEB-SOL-004", "FAIL", "No fue posible cancelar una solicitud pendiente del alumno.", self.screenshot(student_page, "WEB-SOL-004"))
            elif "WEB-SOL-004" not in self.results:
                self.record("WEB-SOL-004", "FAIL", "No hubo una solicitud pendiente disponible para probar la cancelacion desde la cuenta de alumno.", self.screenshot(student_page, "WEB-SOL-004"))

            # Password change at the end, restoring the original credential immediately.
            try:
                if self.change_student_password(browser, BASE.STUDENT_CREDS[1], self.student_temp_password) and self.change_student_password(browser, self.student_temp_password, BASE.STUDENT_CREDS[1]):
                    self.record("WEB-CUE-002", "PASS", "La cuenta del alumno pudo cambiar la contraseña y restaurarla correctamente en la misma corrida.")
                else:
                    self.record("WEB-CUE-002", "FAIL", "No fue posible completar y restaurar de forma segura el cambio de contraseña del alumno.", self.screenshot(student_page, "WEB-CUE-002"))
            except Exception:
                self.record("WEB-CUE-002", "FAIL", "El flujo de cambio de contraseña no pudo completarse y restaurarse de forma segura.", self.screenshot(student_page, "WEB-CUE-002"))
        finally:
            try:
                if student_context:
                    student_context.close()
            except Exception:
                pass
            try:
                if admin_context:
                    admin_context.close()
            except Exception:
                pass
            try:
                if browser:
                    browser.close()
            except Exception:
                pass
            try:
                if play:
                    play.stop()
            except Exception:
                pass
            self.save_results_json()
            self.update_workbooks()


if __name__ == "__main__":
    runner = TargetedRerun()
    runner.run()
