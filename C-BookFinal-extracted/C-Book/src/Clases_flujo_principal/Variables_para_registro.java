/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package Clases_flujo_principal;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;

/**
 *
 * @author Roberto
 */
public class Variables_para_registro {

    private int boleta_g;
    private String actividad;
    private int No_asignado;
    private final int Numero_guardarropa;
    private LocalDateTime  hora_entrada;
    private LocalDateTime  hora_salida;
 public static ArrayList<Variables_para_registro> registro = new ArrayList();
    public Variables_para_registro(int boleta_g, String actividad, int No_asignado, LocalDateTime  hora_entrada, LocalDateTime  hora_salida, int Numero_guardarropa) {
        this.Numero_guardarropa = Numero_guardarropa;
        this.boleta_g = boleta_g;
        this.actividad = actividad;
        this.No_asignado = No_asignado;
        this.hora_entrada = hora_entrada;
        this.hora_salida = hora_salida;
    }

    public int getNumero_guardarropa() {
        return Numero_guardarropa;
    }

    public int getBoleta_g() {
        return boleta_g;
    }

    public void setBoleta_g(int boleta_g) {
        this.boleta_g = boleta_g;
    }

    public String getActividad() {
        return actividad;
    }

    public void setActividad(String actividad) {
        this.actividad = actividad;
    }

    public int getNo_asignado() {
        return No_asignado;
    }

    public void setNo_asignado(int No_asignado) {
        this.No_asignado = No_asignado;
    }

    public LocalDateTime  getHora_entrada() {
        return hora_entrada;
    }

    public void setHora_entrada(LocalDateTime  hora_entrada) {
        this.hora_entrada = hora_entrada;
    }

    public LocalDateTime  getHora_salida() {
        return hora_salida;
    }

    public void setHora_salida(LocalDateTime  hora_salida) {
        this.hora_salida = hora_salida;
    }

}
