package c.book;

import Clases_flujo_principal.Ingreso_de_materiales_a_arreglos;
import javafx.application.Application;
import javafx.stage.Stage;

public class CBookApp extends Application {

    private static Stage primaryStage;

    @Override
    public void start(Stage stage) {
        primaryStage = stage;
        primaryStage.setTitle("C-Book - Sistema de Biblioteca");
        primaryStage.setResizable(false);

        // Load materials from database
        Ingreso_de_materiales_a_arreglos.ingreso_computadoras();
        Ingreso_de_materiales_a_arreglos.ingreso_restiradores();
        Ingreso_de_materiales_a_arreglos.ingreso_guardarropa();

        // Show main screen
        SceneManager.setPrimaryStage(primaryStage);
        SceneManager.showPantallaPrincipal();

        primaryStage.show();
    }

    public static Stage getPrimaryStage() {
        return primaryStage;
    }

    public static void main(String[] args) {
        launch(args);
    }
}
