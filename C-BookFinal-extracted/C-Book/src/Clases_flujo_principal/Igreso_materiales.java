package Clases_flujo_principal;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;

public class Igreso_materiales {

    public static ArrayList<Computadoras> computadora = new ArrayList();
    public static ArrayList<restiradores> restiradores = new ArrayList();
    public static ArrayList<guardarropas> guardarropa = new ArrayList();
  
    public static void ingreso_computadoras() {
        int i = 0;
        try (Connection con = DriverManager.getConnection(Conexion_BD.url, Conexion_BD.user, Conexion_BD.pws)) {
            String sql = "SELECT * FROM biblioteca.computadora";
            PreparedStatement pst = con.prepareStatement(sql);
            ResultSet rs = pst.executeQuery();
            while (rs.next()) {
                int numero_computadora = rs.getInt("Num_com");
                boolean ocupado = false;
                boolean funcionando = rs.getBoolean("Estado_com");
                if (funcionando) {
                    Computadoras com = new Computadoras(numero_computadora, ocupado);
                    computadora.add(com);

                }

            }
            con.close();
        } catch (Exception e) {
            e.printStackTrace();
        }

    }

    public static void ingreso_restiradores() {
        int i = 0;
        try (Connection con = DriverManager.getConnection(Conexion_BD.url, Conexion_BD.user, Conexion_BD.pws)) {
            String sql = "SELECT * FROM biblioteca.restirador";
            PreparedStatement pst = con.prepareStatement(sql);
            ResultSet rs = pst.executeQuery();
            while (rs.next()) {
                int numero_restirador = rs.getInt("Num_res");
                boolean ocupado = false;
                boolean funcionando = rs.getBoolean("Estado_res");
                if (funcionando) {
                    restiradores res = new restiradores(numero_restirador, ocupado);
                    restiradores.add(res);
                    System.out.println(restiradores.get(i).getNum());
                    i = i + 1;
                }

            }
            con.close();
        } catch (Exception e) {
            e.printStackTrace(); // <-- Imprime el error para poder ver qué pasó
        }
    }

    public static void ingreso_guardarropa() {
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
                    System.out.println(guardarropa.get(i).getNum());
                    i = i + 1;
                }
            }
            con.close();
        } catch (Exception e) {
            e.printStackTrace(); // <-- Imprime el error para poder ver qué pasó
        }
    }
}
