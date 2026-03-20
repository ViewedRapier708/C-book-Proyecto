package Admin_interfaz;

import c.book.SceneManager;
import Interfazes.Pantalla_principal;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Parent;
import javafx.scene.control.*;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.layout.*;

public class Opciones_adm {

    private VBox root;

    public Opciones_adm() {
        buildUI();
    }

    private void buildUI() {
        root = new VBox(0);
        root.getStyleClass().add("main-bg");
        root.setAlignment(Pos.TOP_CENTER);

        // Header
        root.getChildren().add(Pantalla_principal.createHeader());

        // Content
        VBox content = new VBox(28);
        content.setAlignment(Pos.CENTER);
        content.setPadding(new Insets(40));
        VBox.setVgrow(content, Priority.ALWAYS);

        // Options card
        VBox optionsCard = new VBox(24);
        optionsCard.getStyleClass().add("card");
        optionsCard.setAlignment(Pos.CENTER);
        optionsCard.setMaxWidth(500);
        optionsCard.setPadding(new Insets(36));

        Label titleLabel = new Label("PANEL DE ADMINISTRACIÓN");
        titleLabel.setStyle("-fx-font-size: 24px; -fx-font-weight: bold; -fx-text-fill: #6B1942;");

        Label selectLabel = new Label("Seleccione la operación a realizar:");
        selectLabel.setStyle("-fx-font-size: 14px; -fx-text-fill: #888;");

        ComboBox<String> operationCombo = new ComboBox<>();
        operationCombo.getStyleClass().add("combo-modern");
        operationCombo.getItems().addAll(
            "LIBROS",
            "COMPUTADORAS",
            "RESTIRADORES",
            "GUARDARROPA",
            "VISUALISAR REGISTROS DE ALUMNOS"
        );
        operationCombo.setPromptText("-- Seleccione una opción --");
        operationCombo.setPrefWidth(360);

        HBox buttons = new HBox(16);
        buttons.setAlignment(Pos.CENTER);

        Button volverBtn = new Button("CERRAR SESIÓN");
        volverBtn.getStyleClass().add("btn-secondary");
        volverBtn.setStyle(volverBtn.getStyle() + "-fx-text-fill: #c0392b; -fx-border-color: #c0392b;");
        volverBtn.setPrefWidth(160);
        volverBtn.setOnAction(e -> SceneManager.showPantallaPrincipal());

        Button continuarBtn = new Button("CONTINUAR");
        continuarBtn.getStyleClass().add("btn-primary");
        continuarBtn.setPrefWidth(160);
        continuarBtn.setOnAction(e -> {
            String op = operationCombo.getValue();
            if (op == null) {
                Alert alert = new Alert(Alert.AlertType.WARNING);
                alert.setTitle("Aviso");
                alert.setHeaderText(null);
                alert.setContentText("Seleccione una operación.");
                alert.showAndWait();
                return;
            }
            switch (op) {
                case "LIBROS" -> SceneManager.showLibrosAdmin();
                case "COMPUTADORAS" -> SceneManager.showComputadorasAdmin();
                case "RESTIRADORES" -> SceneManager.showRestiradoresAdmin();
                case "GUARDARROPA" -> SceneManager.showGuardarropaAdmin();
                case "VISUALISAR REGISTROS DE ALUMNOS" -> SceneManager.showRegistrosAdmin();
            }
        });

        buttons.getChildren().addAll(volverBtn, continuarBtn);
        optionsCard.getChildren().addAll(titleLabel, selectLabel, operationCombo, buttons);
        content.getChildren().add(optionsCard);
        root.getChildren().add(content);
    }

    public Parent getRoot() {
        return root;
    }
}
