package Interfazes;

import c.book.SceneManager;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Parent;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.scene.paint.Color;
import javafx.scene.text.Font;
import javafx.scene.text.FontWeight;

public class Mensaje_entrada {

    private VBox root;

    public Mensaje_entrada(String actividad, String numero, String numeroG) {
        buildUI(actividad, numero, numeroG);
    }

    private void buildUI(String actividad, String numero, String numeroG) {
        root = new VBox(0);
        root.getStyleClass().add("main-bg");
        root.setAlignment(Pos.TOP_CENTER);

        // Header
        root.getChildren().add(Pantalla_principal.createHeader());

        // Content
        VBox content = new VBox(24);
        content.setAlignment(Pos.CENTER);
        content.setPadding(new Insets(30));
        VBox.setVgrow(content, Priority.ALWAYS);

        // Welcome card
        VBox welcomeCard = new VBox(12);
        welcomeCard.getStyleClass().add("card-pink");
        welcomeCard.setAlignment(Pos.CENTER);
        welcomeCard.setMaxWidth(600);
        welcomeCard.setPadding(new Insets(24));

        Label welcomeLabel = new Label("BIENVENIDO");
        welcomeLabel.setStyle("-fx-font-size: 28px; -fx-font-weight: bold; -fx-text-fill: #6B1942;");

        Label reminderLabel = new Label("NO OLVIDE REGISTRAR SU SALIDA");
        reminderLabel.setStyle("-fx-font-size: 15px; -fx-text-fill: #555;");

        welcomeCard.getChildren().addAll(welcomeLabel, reminderLabel);

        // Info cards row
        HBox infoRow = new HBox(20);
        infoRow.setAlignment(Pos.CENTER);
        infoRow.setMaxWidth(600);

        // Activity card
        VBox activityCard = new VBox(8);
        activityCard.getStyleClass().add("card-dark");
        activityCard.setAlignment(Pos.CENTER);
        activityCard.setPrefWidth(280);
        activityCard.setPadding(new Insets(20));

        Label actLabel = new Label("ACTIVIDAD");
        actLabel.setStyle("-fx-font-size: 12px; -fx-text-fill: rgba(255,255,255,0.7); -fx-font-weight: bold;");

        Label actValue = new Label(actividad);
        actValue.setStyle("-fx-font-size: 16px; -fx-text-fill: white; -fx-font-weight: bold;");

        Label numLabel = new Label("No:");
        numLabel.setStyle("-fx-font-size: 12px; -fx-text-fill: rgba(255,255,255,0.7);");

        Label numValue = new Label(numero);
        numValue.getStyleClass().add("big-number");

        activityCard.getChildren().addAll(actLabel, actValue, numLabel, numValue);

        // Wardrobe card
        VBox wardrobeCard = new VBox(8);
        wardrobeCard.getStyleClass().add("card-dark");
        wardrobeCard.setAlignment(Pos.CENTER);
        wardrobeCard.setPrefWidth(280);
        wardrobeCard.setPadding(new Insets(20));

        Label wardLabel = new Label("GUARDARROPA ASIGNADO");
        wardLabel.setStyle("-fx-font-size: 12px; -fx-text-fill: rgba(255,255,255,0.7); -fx-font-weight: bold;");

        Label wardValue = new Label(numeroG);
        wardValue.getStyleClass().add("big-number");

        wardrobeCard.getChildren().addAll(wardLabel, wardValue);

        infoRow.getChildren().addAll(activityCard, wardrobeCard);

        // OK button
        Button okBtn = new Button("ACEPTAR");
        okBtn.getStyleClass().add("btn-primary");
        okBtn.setPrefWidth(180);
        okBtn.setOnAction(e -> SceneManager.showPantallaPrincipal());

        content.getChildren().addAll(welcomeCard, infoRow, okBtn);
        root.getChildren().add(content);
    }

    public Parent getRoot() {
        return root;
    }
}
