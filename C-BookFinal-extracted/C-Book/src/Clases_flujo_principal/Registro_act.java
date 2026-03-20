package Clases_flujo_principal;

public class Registro_act {

    private int numero_asignado;
    private int numero_asignado_g;
    public void actividad(String act, int opc) {
        String actividad;
        boolean asignado = false;
        if (act.equals("COMPUTADORAS")) {
            actividad = "COMPUTADORAS";
            asignado = false;
            for (int i = 0; i < Igreso_materiales.computadora.size(); i++) {
                if (Igreso_materiales.computadora.get(i).isOcupado() == false) {
                    numero_asignado = (Igreso_materiales.computadora.get(i).getNum());
                    Igreso_materiales.computadora.get(i).setOcupado(true);
                    asignado = true;
                    break;
                }

            }
            if (!asignado) {
                System.out.println("No hay computadoras disponibles.");
            }
        } else if (act .equals("RESTIRADORES") ) {
            actividad = "RESTIRADORES";
            asignado = false;

            for (int i = 0; i < Igreso_materiales.restiradores.size(); i++) {
                if (Igreso_materiales.restiradores.get(i).isOcupado() == false) {
                    numero_asignado = (Igreso_materiales.restiradores.get(i).getNum());
                    Igreso_materiales.restiradores.get(i).setOcupado(true);
                    asignado = true;
                    break;
                }
            }
            if (!asignado) {
                System.out.println("No hay computadoras disponibles.");
            }

        } else if (act.equals("CONSULTA DE LIBROS")) {//Interfaz de los libros
            actividad = "CONSULTA DE LIBROS";
            
            
            
        }
        if (opc == 0) {
            asignado = false;
            for (int i = 0; i < Igreso_materiales.guardarropa.size(); i++) {
                if (Igreso_materiales.guardarropa.get(i).isOcupado() == false) {
                    numero_asignado_g = (Igreso_materiales.guardarropa.get(i).getNum());
                    Igreso_materiales.guardarropa.get(i).setOcupado(true);
                    asignado = true;
                    break;
                }
            }
            if (!asignado) {
                System.out.println("No hay computadoras disponibles.");
            }
        } else {
            System.out.println("no pibe");
        }

        //Pregunta del guardarropa
    }

    public void restablecer_num(String act, int numero,int numero_g) {

        if (act == ("COMPUTADORAS")) {
            for (int i = 0; i < Igreso_materiales.computadora.size(); i++) {
                if (Igreso_materiales.computadora.get(i).getNum() == numero) {
                    Igreso_materiales.computadora.get(i).setOcupado(false);
                    System.out.println("entre");
                }
            }
        } else if (act == "RESTIRADORES") {
            for (int i = 0; i < Igreso_materiales.restiradores.size(); i++) {
                if (Igreso_materiales.restiradores.get(i).getNum() == numero) {
                    Igreso_materiales.restiradores.get(i).setOcupado(false);
                }
            }
        } else if (act == "CONSULTA DE LIBROS") {//Interfaz de los libros

        }
        for (int i = 0; i < Igreso_materiales.guardarropa.size(); i++) {
             if (Igreso_materiales.guardarropa.get(i).getNum() == numero_g) {
                    Igreso_materiales.guardarropa.get(i).setOcupado(false);
                }
        }
                

    }

    public int getNumero_asignado() {
        return numero_asignado;
    }

   

    public int getNumero_asignado_g() {
        return numero_asignado_g;
    }

}
