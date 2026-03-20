package Clases_flujo_principal;

import c.book.SceneManager;
import javafx.scene.control.Alert;
import javafx.scene.control.ButtonType;
import java.util.Optional;

public class Registro_actividad {

    private int numero_asignado;
    private int numero_asignado_g;
    private static boolean asignado;

    public void seleccion_actividad(String act, int opc) {
        if (opc == 0) {
            asignado = false;
            for (int i = 0; i < Ingreso_de_materiales_a_arreglos.guardarropa.size(); i++) {
                if (!Ingreso_de_materiales_a_arreglos.guardarropa.get(i).isOcupado()) {
                    numero_asignado_g = Ingreso_de_materiales_a_arreglos.guardarropa.get(i).getNum();
                    Ingreso_de_materiales_a_arreglos.guardarropa.get(i).setOcupado(true);
                    asignado = true;
                    break;
                }
            }
            if (!asignado) {
                Alert alert = new Alert(Alert.AlertType.CONFIRMATION);
                alert.setTitle("Guardarropas Insuficientes");
                alert.setHeaderText(null);
                alert.setContentText("NO HAY GUARDARROPAS DISPONIBLES. ¿DESEA CONTINUAR?");
                Optional<ButtonType> result = alert.showAndWait();
                asignado = result.isPresent() && result.get() == ButtonType.OK;
            }
        }

        switch (act) {
            case "COMPUTADORAS" -> {
                asignado = false;
                for (int i = 0; i < Ingreso_de_materiales_a_arreglos.computadora.size(); i++) {
                    if (!Ingreso_de_materiales_a_arreglos.computadora.get(i).isOcupado()) {
                        numero_asignado = Ingreso_de_materiales_a_arreglos.computadora.get(i).getNum();
                        Ingreso_de_materiales_a_arreglos.computadora.get(i).setOcupado(true);
                        asignado = true;
                        break;
                    }
                }
                if (!asignado) {
                    SceneManager.showNoHayDisponibles();
                }
            }
            case "RESTIRADORES" -> {
                asignado = false;
                for (int i = 0; i < Ingreso_de_materiales_a_arreglos.restiradores.size(); i++) {
                    if (!Ingreso_de_materiales_a_arreglos.restiradores.get(i).isOcupado()) {
                        numero_asignado = Ingreso_de_materiales_a_arreglos.restiradores.get(i).getNum();
                        Ingreso_de_materiales_a_arreglos.restiradores.get(i).setOcupado(true);
                        asignado = true;
                        break;
                    }
                }
                if (!asignado) {
                    SceneManager.showNoHayDisponibles();
                }
            }
            case "SISTEMA DE CONSULTA DE LIBROS" -> {
                asignado = true;
            }
            case "AREA DE CONSULTA (MESAS)" -> {
                asignado = true;
            }
        }
    }

    public void restablecer_numeros_salida(String act, int numero, int numero_g) {
        if (null != act) switch (act) {
            case "COMPUTADORAS" -> {
                for (int i = 0; i < Ingreso_de_materiales_a_arreglos.computadora.size(); i++) {
                    if (Ingreso_de_materiales_a_arreglos.computadora.get(i).getNum() == numero) {
                        Ingreso_de_materiales_a_arreglos.computadora.get(i).setOcupado(false);
                    }
                }
            }
            case "RESTIRADORES" -> {
                for (int i = 0; i < Ingreso_de_materiales_a_arreglos.restiradores.size(); i++) {
                    if (Ingreso_de_materiales_a_arreglos.restiradores.get(i).getNum() == numero) {
                        Ingreso_de_materiales_a_arreglos.restiradores.get(i).setOcupado(false);
                    }
                }
            }
        }
        for (int i = 0; i < Ingreso_de_materiales_a_arreglos.guardarropa.size(); i++) {
            if (Ingreso_de_materiales_a_arreglos.guardarropa.get(i).getNum() == numero_g) {
                Ingreso_de_materiales_a_arreglos.guardarropa.get(i).setOcupado(false);
            }
        }
    }

    public int getNumero_asignado() { return numero_asignado; }
    public int getNumero_asignado_g() { return numero_asignado_g; }
    public boolean getAsignado() { return asignado; }
}
