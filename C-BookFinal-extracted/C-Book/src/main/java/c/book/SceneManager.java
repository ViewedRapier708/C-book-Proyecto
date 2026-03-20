package c.book;

import Interfazes.*;
import Admin_interfaz.*;
import javafx.scene.Scene;
import javafx.stage.Modality;
import javafx.stage.Stage;
import javafx.stage.StageStyle;

public class SceneManager {

    private static Stage primaryStage;
    private static final double WIDTH = 1100;
    private static final double HEIGHT = 700;

    public static void setPrimaryStage(Stage stage) {
        primaryStage = stage;
    }

    public static Stage getPrimaryStage() {
        return primaryStage;
    }

    private static Scene createScene(javafx.scene.Parent root) {
        Scene scene = new Scene(root, WIDTH, HEIGHT);
        scene.getStylesheets().add(SceneManager.class.getResource("/styles/cbook.css").toExternalForm());
        return scene;
    }

    private static Scene createScene(javafx.scene.Parent root, double w, double h) {
        Scene scene = new Scene(root, w, h);
        scene.getStylesheets().add(SceneManager.class.getResource("/styles/cbook.css").toExternalForm());
        return scene;
    }

    // ========== STUDENT FLOW ==========

    public static void showPantallaPrincipal() {
        Pantalla_principal view = new Pantalla_principal();
        primaryStage.setScene(createScene(view.getRoot()));
        primaryStage.setTitle("C-Book - Inicio");
        primaryStage.centerOnScreen();
    }

    public static void showMostrarDE(String boleta, String nombre, String apP, String apM,
                                      String turno, String carrera, String grupo) {
        Mostrar_D_E view = new Mostrar_D_E(boleta, nombre, apP, apM, turno, carrera, grupo);
        primaryStage.setScene(createScene(view.getRoot()));
        primaryStage.setTitle("C-Book - Menu de Opciones");
    }

    public static void showConsultaLibros() {
        Consulta_libros view = new Consulta_libros();
        primaryStage.setScene(createScene(view.getRoot()));
        primaryStage.setTitle("C-Book - Consulta de Libros");
    }

    public static void showMensajeEntrada(String actividad, String numero, String numeroG) {
        Mensaje_entrada view = new Mensaje_entrada(actividad, numero, numeroG);
        primaryStage.setScene(createScene(view.getRoot(), 800, 550));
        primaryStage.setTitle("C-Book - Bienvenido");
        primaryStage.centerOnScreen();
    }

    public static void showMensajeSalida() {
        Mensaje_salida view = new Mensaje_salida();
        primaryStage.setScene(createScene(view.getRoot(), 800, 500));
        primaryStage.setTitle("C-Book - Hasta Luego");
        primaryStage.centerOnScreen();
    }

    public static void showAlumnoNoEncontrado() {
        Alumno_no_encontrado view = new Alumno_no_encontrado();
        primaryStage.setScene(createScene(view.getRoot(), 700, 400));
        primaryStage.setTitle("C-Book - Alumno No Encontrado");
        primaryStage.centerOnScreen();
    }

    public static void showNoHayDisponibles() {
        No_hay_disponibles view = new No_hay_disponibles();
        primaryStage.setScene(createScene(view.getRoot(), 700, 400));
        primaryStage.setTitle("C-Book - Sin Disponibilidad");
        primaryStage.centerOnScreen();
    }

    // ========== ADMIN FLOW ==========

    public static void showInicioAdmin() {
        Inicio_adm view = new Inicio_adm();
        primaryStage.setScene(createScene(view.getRoot(), 900, 600));
        primaryStage.setTitle("C-Book - Administrador");
        primaryStage.centerOnScreen();
    }

    public static void showOpcionesAdmin() {
        Opciones_adm view = new Opciones_adm();
        primaryStage.setScene(createScene(view.getRoot(), 900, 600));
        primaryStage.setTitle("C-Book - Opciones de Administrador");
        primaryStage.centerOnScreen();
    }

    public static void showLibrosAdmin() {
        Libros_admin view = new Libros_admin();
        primaryStage.setScene(createScene(view.getRoot()));
        primaryStage.setTitle("C-Book - Gestión de Libros");
        primaryStage.centerOnScreen();
    }

    public static void showComputadorasAdmin() {
        Computadoras_admin view = new Computadoras_admin();
        primaryStage.setScene(createScene(view.getRoot()));
        primaryStage.setTitle("C-Book - Gestión de Computadoras");
        primaryStage.centerOnScreen();
    }

    public static void showRestiradoresAdmin() {
        Restiradores_admin view = new Restiradores_admin();
        primaryStage.setScene(createScene(view.getRoot()));
        primaryStage.setTitle("C-Book - Gestión de Restiradores");
        primaryStage.centerOnScreen();
    }

    public static void showGuardarropaAdmin() {
        Guardarropa_admin view = new Guardarropa_admin();
        primaryStage.setScene(createScene(view.getRoot()));
        primaryStage.setTitle("C-Book - Gestión de Guardarropa");
        primaryStage.centerOnScreen();
    }

    public static void showRegistrosAdmin() {
        Registros_admin view = new Registros_admin();
        primaryStage.setScene(createScene(view.getRoot()));
        primaryStage.setTitle("C-Book - Registros de Alumnos");
        primaryStage.centerOnScreen();
    }

    public static Stage createDialog(javafx.scene.Parent root, String title, double w, double h) {
        Stage dialog = new Stage();
        dialog.initModality(Modality.APPLICATION_MODAL);
        dialog.initOwner(primaryStage);
        dialog.setTitle(title);
        dialog.setResizable(false);
        Scene scene = new Scene(root, w, h);
        scene.getStylesheets().add(SceneManager.class.getResource("/styles/cbook.css").toExternalForm());
        dialog.setScene(scene);
        dialog.centerOnScreen();
        return dialog;
    }
}
