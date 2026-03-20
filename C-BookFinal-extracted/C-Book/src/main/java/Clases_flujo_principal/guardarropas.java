/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package Clases_flujo_principal;

/**
 *
 * @author Roberto
 */
public class guardarropas {
    private int num;
    private boolean ocupado;

    public guardarropas(int num, boolean ocupado) {
        this.num = num;
        this.ocupado = ocupado;
    }

    public int getNum() {
        return num;
    }

    public void setNum(int num) {
        this.num = num;
    }

    public boolean isOcupado() {
        return ocupado;
    }

    public void setOcupado(boolean ocupado) {
        this.ocupado = ocupado;
    }
}
