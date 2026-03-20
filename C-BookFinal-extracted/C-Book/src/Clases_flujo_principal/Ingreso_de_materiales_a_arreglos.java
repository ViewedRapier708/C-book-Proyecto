package Clases_flujo_principal;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;

public class Ingreso_de_materiales_a_arreglos {

    public static ArrayList<Computadoras> computadora = new ArrayList();
    public static ArrayList<restiradores> restiradores = new ArrayList();
    public static ArrayList<guardarropas> guardarropa = new ArrayList();

    public static void ingreso_computadoras() {
        computadora.clear();
        try (Connection con = DriverManager.getConnection(Conexion_BD.url, Conexion_BD.user, Conexion_BD.pws)) {
            String sql = "SELECT * FROM biblioteca.computadora";
            PreparedStatement pst = con.prepareStatement(sql);
            ResultSet rs = pst.executeQuery();
            while (rs.next()) {
                boolean funcionando = rs.getBoolean("Estado_com");
                if (funcionando) {
                    int numero_computadora = rs.getInt("Num_com");
                    boolean ocupado = false;

                    Computadoras com = new Computadoras(numero_computadora, ocupado);
                    computadora.add(com);

                }

            }
            con.close();
            pst.close();
            rs.close();
        } catch (Exception e) {
           
        }

    }

    public static void ingreso_restiradores() {
        restiradores.clear();
        try (Connection con = DriverManager.getConnection(Conexion_BD.url, Conexion_BD.user, Conexion_BD.pws)) {
            String sql = "SELECT * FROM biblioteca.restirador";
            PreparedStatement pst = con.prepareStatement(sql);
            ResultSet rs = pst.executeQuery();
            while (rs.next()) {
                boolean funcionando = rs.getBoolean("Estado_res");
                if (funcionando) {
                    boolean ocupado = false;
                    int numero_restirador = rs.getInt("Num_res");
                    restiradores res = new restiradores(numero_restirador, ocupado);
                    
                    restiradores.add(res);

                }

            }
            con.close();
            pst.close();
            rs.close();
        } catch (Exception e) {
         
        }
    }

    public static void ingreso_guardarropa() {
        guardarropa.clear();
        int i = 0;
        try (Connection con = DriverManager.getConnection(Conexion_BD.url, Conexion_BD.user, Conexion_BD.pws)) {
            String sql = "SELECT * FROM biblioteca.guardarropa";
            PreparedStatement pst = con.prepareStatement(sql);
            ResultSet rs = pst.executeQuery();
            while (rs.next()) {
                int numero_restirador = rs.getInt("Num_guardarropa");
                boolean ocupado = false;
                boolean funcionando = rs.getBoolean("Estado_guardarropa");
                if (funcionando) {
                    guardarropas guar = new guardarropas(numero_restirador, ocupado);
                    guardarropa.add(guar);
                  
                    i = i + 1;
                }
            }
            con.close();
            pst.close();
            rs.close();
        } catch (Exception e) {
     
        }
    }
}
