package Admin_interfaz;

import Clases_flujo_principal.Conexion_BD;
import javafx.scene.control.*;
import javafx.stage.Stage;
import java.sql.*;

public class Activacion_Desactivacion_Materiales {

    private boolean activo = false;

    public boolean getActivo() { return activo; }
    public void activo_true() { activo = true; }
    public void activo_false() { activo = false; }

    public void setVisible(boolean visible) {
        // No longer needed in JavaFX version - state is handled by admin CRUD screens
    }
}
