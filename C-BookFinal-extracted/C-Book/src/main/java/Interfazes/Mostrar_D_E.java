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
import java.time.LocalDateTime;
import java.util.Optional;

public class Mostrar_D_E {

    private BorderPane root;
    private int indice;
    private String boletaVal, nombreVal, apPVal, apMVal, turnoVal, carreraVal, grupoVal;

    public Mostrar_D_E(String boleta, String nombre, String apP, String apM,
                        String turno, String carrera, String grupo) {
        this.boletaVal = boleta;
        this.nombreVal = nombre;
        this.apPVal = apP;
        this.apMVal = apM;
        this.turnoVal = turno;
        this.carreraVal = carrera;
        this.grupoVal = grupo;
        buildUI();
    }

    private void buildUI() {
        root = new BorderPane();
        root.getStyleClass().add("main-bg");

        // Header
        root.setTop(Pantalla_principal.createHeader());

        // Center content
        HBox content = new HBox(30);
        content.setAlignment(Pos.CENTER);
        content.setPadding(new Insets(30));

        // === LEFT: Student data card ===
        VBox dataCard = new VBox(16);
        dataCard.getStyleClass().add("card");
        dataCard.setPrefWidth(480);
        dataCard.setPadding(new Insets(28));

        Label dataTitle = new Label("DATOS DEL ALUMNO");
        dataTitle.setStyle("-fx-font-size: 20px; -fx-font-weight: bold; -fx-text-fill: #6B1942;");

        Region sep = new Region();
        sep.getStyleClass().add("separator-line");
        sep.setPrefWidth(Double.MAX_VALUE);

        dataCard.getChildren().addAll(dataTitle, sep);
        dataCard.getChildren().add(createDataRow("BOLETA:", boletaVal));
        dataCard.getChildren().add(createDataRow("NOMBRE(S):", nombreVal));
        dataCard.getChildren().add(createDataRow("APELLIDO PATERNO:", apPVal));
        dataCard.getChildren().add(createDataRow("APELLIDO MATERNO:", apMVal));
        dataCard.getChildren().add(createDataRow("TURNO:", turnoVal));
        dataCard.getChildren().add(createDataRow("CARRERA:", carreraVal));
        dataCard.getChildren().add(createDataRow("GRUPO:", grupoVal));

        // === RIGHT: Activity selection ===
        VBox activityCard = new VBox(22);
        activityCard.getStyleClass().add("card-pink");
        activityCard.setPrefWidth(420);
        activityCard.setAlignment(Pos.CENTER);
        activityCard.setPadding(new Insets(30));

        Label welcomeLabel = new Label("BIENVENID@");
        welcomeLabel.setStyle("-fx-font-size: 28px; -fx-font-weight: bold; -fx-text-fill: #6B1942;");

        Label selectLabel = new Label("Seleccione su actividad:");
        selectLabel.setStyle("-fx-font-size: 16px; -fx-text-fill: #333;");

        ComboBox<String> activityCombo = new ComboBox<>();
        activityCombo.getStyleClass().add("combo-modern");
        activityCombo.getItems().addAll(
            "COMPUTADORAS",
            "RESTIRADORES",
            "SISTEMA DE CONSULTA DE LIBROS",
            "AREA DE CONSULTA (MESAS)"
        );
        activityCombo.setPromptText("-- Seleccione una opción --");
        activityCombo.setPrefWidth(320);

        HBox buttons = new HBox(16);
        buttons.setAlignment(Pos.CENTER);

        Button cancelBtn = new Button("CANCELAR");
        cancelBtn.getStyleClass().add("btn-secondary");
        cancelBtn.setStyle(cancelBtn.getStyle() + "-fx-text-fill: #6B1942; -fx-border-color: #6B1942;");
        cancelBtn.setPrefWidth(140);
        cancelBtn.setOnAction(e -> SceneManager.showPantallaPrincipal());

        Button continueBtn = new Button("CONTINUAR");
        continueBtn.getStyleClass().add("btn-primary");
        continueBtn.setPrefWidth(160);
        continueBtn.setOnAction(e -> procesarActividad(activityCombo.getValue()));

        buttons.getChildren().addAll(cancelBtn, continueBtn);

        activityCard.getChildren().addAll(welcomeLabel, selectLabel, activityCombo, buttons);

        content.getChildren().addAll(dataCard, activityCard);
        root.setCenter(content);
    }

    private HBox createDataRow(String label, String value) {
        HBox row = new HBox(12);
        row.setAlignment(Pos.CENTER_LEFT);

        Label lbl = new Label(label);
        lbl.getStyleClass().add("label-text");
        lbl.setMinWidth(160);

        Label val = new Label(value != null ? value : "");
        val.getStyleClass().add("value-text");

        row.getChildren().addAll(lbl, val);
        return row;
    }

    private void procesarActividad(String actividad) {
        if (actividad == null || actividad.isEmpty()) {
            Alert alert = new Alert(Alert.AlertType.WARNING);
            alert.setTitle("Aviso");
            alert.setHeaderText(null);
            alert.setContentText("Seleccione una actividad para continuar.");
            alert.showAndWait();
            return;
        }

        // Ask for wardrobe
        int opcGuardarropa = 1; // Default: no wardrobe
        if (actividad.equals("COMPUTADORAS") || actividad.equals("RESTIRADORES")) {
            Alert wardrobeAlert = new Alert(Alert.AlertType.CONFIRMATION);
            wardrobeAlert.setTitle("Guardarropa");
            wardrobeAlert.setHeaderText(null);
            wardrobeAlert.setContentText("¿Desea usar el servicio de guardarropa?");
            ButtonType btnSi = new ButtonType("SÍ");
            ButtonType btnNo = new ButtonType("NO");
            wardrobeAlert.getButtonTypes().setAll(btnSi, btnNo);
            Optional<ButtonType> result = wardrobeAlert.showAndWait();
            if (result.isPresent() && result.get() == btnSi) {
                opcGuardarropa = 0;
            }
        }

        Registro_actividad registro = new Registro_actividad();
        registro.seleccion_actividad(actividad, opcGuardarropa);

        if (!registro.getAsignado()) {
            return; // No materials available, dialog already shown
        }

        int numAsignado = registro.getNumero_asignado();
        int numGuardarropa = registro.getNumero_asignado_g();

        Variables_para_registro var = new Variables_para_registro(
            Pantalla_principal.getBoleta(),
            actividad,
            numAsignado,
            LocalDateTime.now(),
            null,
            numGuardarropa
        );
        Variables_para_registro.registro.add(var);
        indice = Variables_para_registro.registro.size() - 1;

        if (actividad.equals("SISTEMA DE CONSULTA DE LIBROS")) {
            Consulta_libros.setIndice(indice);
            SceneManager.showConsultaLibros();
        } else {
            SceneManager.showMensajeEntrada(
                actividad,
                String.valueOf(numAsignado),
                String.valueOf(numGuardarropa)
            );
        }
    }

    public int indice() {
        return indice;
    }

    public Parent getRoot() {
        return root;
    }
}
