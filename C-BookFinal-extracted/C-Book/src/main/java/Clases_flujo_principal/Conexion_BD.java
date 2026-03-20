package Clases_flujo_principal;

import java.sql.*;

public class Conexion_BD {
    public static String url = "jdbc:mysql://localhost:3306/biblioteca";
    public static String user = "root";
    public static String pws = "patata";

    public static void conect() {
        try {
            Connection conexion = DriverManager.getConnection(url, user, pws);
            conexion.close();
        } catch (Exception e) {
            System.out.println("Error de conexión a la base de datos: " + e.getMessage());
        }
    }
}
