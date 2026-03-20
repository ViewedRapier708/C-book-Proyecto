package Clases_flujo_principal;

import java.sql.*;

public class Busqueda_alumno {

    private int bolet;
    private String nombre;
    private String Apellido_P;
    private String Apellido_M;
    private String Turno;
    private String Carrera;
    private boolean encontrado;
    private String Grupo;

    public Busqueda_alumno() {
        encontrado = false;
    }

    public void busqueda(String boleta) {
        encontrado = false;
        try (Connection conect = DriverManager.getConnection(Conexion_BD.url, Conexion_BD.user, Conexion_BD.pws)) {
            String sql = "select * from biblioteca.alumno where idalumno=?";
            PreparedStatement ps = conect.prepareStatement(sql);
            ps.setInt(1, Integer.parseInt(boleta));
            ResultSet resultado = ps.executeQuery();

            if (resultado.next()) {
                encontrado = true;
                bolet = resultado.getInt("idalumno");
                nombre = resultado.getString("Nombre_al");
                Apellido_P = resultado.getString("Apellido_p");
                Apellido_M = resultado.getString("Apellido_m");
                Turno = resultado.getString("Turno");
                Carrera = resultado.getString("Carrera");
                Grupo = resultado.getString("Grupo");
            }

            resultado.close();
            ps.close();
        } catch (Exception e) {
            System.out.println(e.getMessage());
            encontrado = false;
        }
    }

    public int getBolet() { return bolet; }
    public boolean isEncontrado() { return encontrado; }
    public String getNombre() { return nombre; }
    public String getApellido_P() { return Apellido_P; }
    public String getApellido_M() { return Apellido_M; }
    public String getTurno() { return Turno; }
    public String getCarrera() { return Carrera; }
    public String getGrupo() { return Grupo; }
    public void setGrupo(String Grupo) { this.Grupo = Grupo; }
}
