package Clases_adm;

import c.book.SceneManager;

public class selecion_operacion_adm {
    // Navigation is now handled by SceneManager in the JavaFX version.
    // This class is kept for backward compatibility.

    public void selecion_op(String operacion) {
        switch (operacion) {
            case "LIBROS" -> SceneManager.showLibrosAdmin();
            case "COMPUTADORAS" -> SceneManager.showComputadorasAdmin();
            case "RESTIRADORES" -> SceneManager.showRestiradoresAdmin();
            case "GUARDARROPA" -> SceneManager.showGuardarropaAdmin();
            case "VISUALISAR REGISTROS DE ALUMNOS" -> SceneManager.showRegistrosAdmin();
        }
    }
}
