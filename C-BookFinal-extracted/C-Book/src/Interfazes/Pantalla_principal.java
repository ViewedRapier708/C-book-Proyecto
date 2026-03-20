package Interfazes;

import c.book.SceneManager;
import Clases_flujo_principal.*;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Parent;
import javafx.scene.control.*;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.layout.*;
import java.sql.*;
import java.time.LocalDateTime;

public class Pantalla_principal {

    private BorderPane root;
    private TextField ingresoBol;
    private static Busqueda_alumno alumno = new Busqueda_alumno();
    private static int boleta;

    public Pantalla_principal() {
        buildUI();
    }

    private void buildUI() {
        root = new BorderPane();
        root.getStyleClass().add("main-bg");

        // === HEADER ===
        root.setTop(createHeader());

        // === CENTER CONTENT ===
        VBox center = new VBox(30);
        center.setAlignment(Pos.CENTER);
        center.setPadding(new Insets(40));

        // Logo
        try {
            ImageView logo = new ImageView(new Image(getClass().getResourceAsStream("/Img/cbook img.jpg")));
            logo.setFitHeight(120);
            logo.setFitWidth(120);
            logo.setPreserveRatio(true);
            logo.setStyle("-fx-effect: dropshadow(gaussian, rgba(0,0,0,0.3), 15, 0, 0, 4);");
            center.getChildren().add(logo);
        } catch (Exception ignored) {}

        // QR instruction
        Label qrLabel = new Label("INGRESE EL QR DE SU CREDENCIAL EN EL LECTOR");
        qrLabel.setStyle("-fx-font-size: 14px; -fx-text-fill: rgba(255,255,255,0.8); -fx-font-weight: bold;");

        // Input card
        VBox inputCard = new VBox(18);
        inputCard.getStyleClass().add("card");
        inputCard.setAlignment(Pos.CENTER);
        inputCard.setMaxWidth(480);
        inputCard.setPadding(new Insets(36, 40, 36, 40));

        Label inputLabel = new Label("INGRESE SU BOLETA");
        inputLabel.setStyle("-fx-font-size: 22px; -fx-font-weight: bold; -fx-text-fill: #6B1942;");

        ingresoBol = new TextField();
        ingresoBol.getStyleClass().add("text-field-dark");
        ingresoBol.setPromptText("Número de boleta...");
        ingresoBol.setMaxWidth(380);
        ingresoBol.setOnAction(e -> procesarIngreso());

        Button ingresarBtn = new Button("INGRESAR");
        ingresarBtn.getStyleClass().add("btn-primary");
        ingresarBtn.setPrefWidth(200);
        ingresarBtn.setOnAction(e -> procesarIngreso());

        inputCard.getChildren().addAll(inputLabel, ingresoBol, ingresarBtn);
        center.getChildren().addAll(qrLabel, inputCard);

        // === FOOTER ===
        HBox footer = new HBox();
        footer.setAlignment(Pos.BOTTOM_LEFT);
        footer.setPadding(new Insets(10, 20, 20, 20));

        Button adminBtn = new Button("ADMINISTRADOR");
        adminBtn.getStyleClass().add("btn-secondary");
        try {
            ImageView adminIcon = new ImageView(new Image(getClass().getResourceAsStream("/Img/admin (1)_1.png")));
            adminIcon.setFitHeight(24);
            adminIcon.setFitWidth(24);
            adminIcon.setPreserveRatio(true);
            adminBtn.setGraphic(adminIcon);
        } catch (Exception ignored) {}
        adminBtn.setOnAction(e -> SceneManager.showInicioAdmin());

        footer.getChildren().add(adminBtn);

        root.setCenter(center);
        root.setBottom(footer);
    }

    public static HBox createHeader() {
        HBox header = new HBox();
        header.getStyleClass().add("header-bar");
        header.setAlignment(Pos.CENTER);
        header.setSpacing(20);

        try {
            ImageView ipnLogo = new ImageView(new Image(Pantalla_principal.class.getResourceAsStream("/Img/ipn 140.png")));
            ipnLogo.setFitHeight(60);
            ipnLogo.setPreserveRatio(true);
            header.getChildren().add(ipnLogo);
        } catch (Exception ignored) {}

        Region spacer1 = new Region();
        HBox.setHgrow(spacer1, Priority.ALWAYS);
        header.getChildren().add(spacer1);

        VBox titleBox = new VBox(2);
        titleBox.setAlignment(Pos.CENTER);
        Label title = new Label("INSTITUTO POLITÉCNICO NACIONAL");
        title.setStyle("-fx-font-size: 22px; -fx-font-weight: bold; -fx-text-fill: #6B1942;");
        Label subtitle = new Label("CECyT 9 \"Juan de Dios Bátiz\" - Sistema de Biblioteca");
        subtitle.setStyle("-fx-font-size: 13px; -fx-text-fill: #888888;");
        titleBox.getChildren().addAll(title, subtitle);
        header.getChildren().add(titleBox);

        Region spacer2 = new Region();
        HBox.setHgrow(spacer2, Priority.ALWAYS);
        header.getChildren().add(spacer2);

        try {
            ImageView batizLogo = new ImageView(new Image(Pantalla_principal.class.getResourceAsStream("/Img/batiz.jpeg")));
            batizLogo.setFitHeight(60);
            batizLogo.setPreserveRatio(true);
            header.getChildren().add(batizLogo);
        } catch (Exception ignored) {}

        return header;
    }

    private void procesarIngreso() {
        String boletaText = ingresoBol.getText().trim();
        if (boletaText.isEmpty()) return;

        // Try exit first
        if (registroSalida(boletaText)) {
            ingresoBol.setText("");
            return;
        }

        // Try entry
        procesoMuestraDeDatos(boletaText);
        ingresoBol.setText("");
    }

    private boolean registroSalida(String boletaText) {
        try {
            int bol = Integer.parseInt(boletaText);
            for (int i = 0; i < Variables_para_registro.registro.size(); i++) {
                if (Variables_para_registro.registro.get(i).getBoleta_g() == bol) {
                    Variables_para_registro reg = Variables_para_registro.registro.get(i);
                    reg.setHora_salida(LocalDateTime.now());

                    Registro_actividad restablecer = new Registro_actividad();
                    restablecer.restablecer_numeros_salida(reg.getActividad(), reg.getNo_asignado(), reg.getNumero_guardarropa());

                    try (Connection con = DriverManager.getConnection(Conexion_BD.url, Conexion_BD.user, Conexion_BD.pws)) {
                        String sql = "INSERT INTO biblioteca.registro (boleta, actividad, num_com, num_restirador, num_guardarropa, hora_entrada, hora_salida) VALUES (?,?,?,?,?,?,?)";
                        PreparedStatement ps = con.prepareStatement(sql);
                        ps.setInt(1, reg.getBoleta_g());
                        ps.setString(2, reg.getActividad());
                        if (reg.getActividad().equals("COMPUTADORAS")) {
                            ps.setInt(3, reg.getNo_asignado());
                            ps.setInt(4, 0);
                        } else if (reg.getActividad().equals("RESTIRADORES")) {
                            ps.setInt(3, 0);
                            ps.setInt(4, reg.getNo_asignado());
                        } else {
                            ps.setInt(3, 0);
                            ps.setInt(4, 0);
                        }
                        ps.setInt(5, reg.getNumero_guardarropa());
                        ps.setTimestamp(6, Timestamp.valueOf(reg.getHora_entrada()));
                        ps.setTimestamp(7, Timestamp.valueOf(reg.getHora_salida()));
                        ps.executeUpdate();
                        ps.close();
                    }
                    Variables_para_registro.registro.remove(i);
                    SceneManager.showMensajeSalida();
                    return true;
                }
            }
        } catch (Exception e) {
            System.out.println(e.getMessage());
        }
        return false;
    }

    private void procesoMuestraDeDatos(String boletaText) {
        alumno = new Busqueda_alumno();
        alumno.busqueda(boletaText);

        if (alumno.isEncontrado()) {
            boleta = alumno.getBolet();
            SceneManager.showMostrarDE(
                String.valueOf(alumno.getBolet()),
                alumno.getNombre(),
                alumno.getApellido_P(),
                alumno.getApellido_M(),
                alumno.getTurno(),
                alumno.getCarrera(),
                alumno.getGrupo()
            );
        }
    }

    public static int getBoleta() {
        return boleta;
    }

    public Parent getRoot() {
        return root;
    }
}
