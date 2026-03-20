
package Clases_flujo_principal;


public class restiradores {
    private int num;
    private boolean ocupado;

    public restiradores(int num, boolean ocupado) {
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
