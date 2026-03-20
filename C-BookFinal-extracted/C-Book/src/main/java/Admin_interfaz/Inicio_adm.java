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

public class Inicio_adm {

    private VBox root;
    private PasswordField fieldPassword;

    public Inicio_adm() {
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

        // Admin icon
        try {
            ImageView adminIcon = new ImageView(new Image(getClass().getResourceAsStream("/Img/admin (1).png")));
            adminIcon.setFitHeight(100);
            adminIcon.setFitWidth(100);
            adminIcon.setPreserveRatio(true);
            content.getChildren().add(adminIcon);
        } catch (Exception ignored) {}

        // Login card
        VBox loginCard = new VBox(20);
        loginCard.getStyleClass().add("card");
        loginCard.setAlignment(Pos.CENTER);
        loginCard.setMaxWidth(450);
        loginCard.setPadding(new Insets(36));

        Label titleLabel = new Label("BIENVENID@ ADMINISTRADOR");
        titleLabel.setStyle("-fx-font-size: 22px; -fx-font-weight: bold; -fx-text-fill: #6B1942;");

        Label pwdLabel = new Label("INGRESE LA CONTRASEÑA");
        pwdLabel.setStyle("-fx-font-size: 14px; -fx-text-fill: #888;");

        fieldPassword = new PasswordField();
        fieldPassword.getStyleClass().add("password-field-modern");
        fieldPassword.setMaxWidth(320);
        fieldPassword.setPromptText("Contraseña...");
        fieldPassword.setOnAction(e -> ingresoAdmin());

        HBox buttons = new HBox(16);
        buttons.setAlignment(Pos.CENTER);

        Button volverBtn = new Button("VOLVER");
        volverBtn.getStyleClass().add("btn-secondary");
        volverBtn.setStyle(volverBtn.getStyle() + "-fx-text-fill: #6B1942; -fx-border-color: #6B1942;");
        volverBtn.setPrefWidth(140);
        volverBtn.setOnAction(e -> SceneManager.showPantallaPrincipal());

        Button entrarBtn = new Button("CONTINUAR");
        entrarBtn.getStyleClass().add("btn-primary");
        entrarBtn.setPrefWidth(160);
        entrarBtn.setOnAction(e -> ingresoAdmin());

        buttons.getChildren().addAll(volverBtn, entrarBtn);

        loginCard.getChildren().addAll(titleLabel, pwdLabel, fieldPassword, buttons);

        content.getChildren().add(loginCard);
        root.getChildren().add(content);
    }

    private void ingresoAdmin() {
        String password = fieldPassword.getText();
        if (password.equalsIgnoreCase("n0m3l0")) {
            SceneManager.showOpcionesAdmin();
        } else {
            Alert alert = new Alert(Alert.AlertType.ERROR);
            alert.setTitle("Aviso");
            alert.setHeaderText(null);
            alert.setContentText("CONTRASEÑA INCORRECTA");
            alert.showAndWait();
            fieldPassword.setText("");
        }
    }

    public Parent getRoot() {
        return root;
    }
}
