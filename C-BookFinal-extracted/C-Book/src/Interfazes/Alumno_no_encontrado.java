package Interfazes;

import c.book.SceneManager;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Parent;
import javafx.scene.control.*;
import javafx.scene.layout.*;

public class Alumno_no_encontrado {

    private VBox root;

    public Alumno_no_encontrado() {
        buildUI();
    }

    private void buildUI() {
        root = new VBox(0);
        root.getStyleClass().add("main-bg");
        root.setAlignment(Pos.TOP_CENTER);

        // Header
        root.getChildren().add(Pantalla_principal.createHeader());

        // Content
        VBox content = new VBox(30);
        content.setAlignment(Pos.CENTER);
        content.setPadding(new Insets(40));
        VBox.setVgrow(content, Priority.ALWAYS);

        VBox card = new VBox(16);
        card.getStyleClass().add("card-pink");
        card.setAlignment(Pos.CENTER);
        card.setMaxWidth(500);
        card.setPadding(new Insets(40));

        Label icon = new Label("!");
        icon.setStyle("-fx-font-size: 48px; -fx-font-weight: bold; -fx-text-fill: #c0392b; " +
                      "-fx-background-color: rgba(192,57,43,0.1); -fx-background-radius: 50; " +
                      "-fx-min-width: 80; -fx-min-height: 80; -fx-alignment: center;");

        Label msg = new Label("ALUMNO NO ENCONTRADO");
        msg.setStyle("-fx-font-size: 26px; -fx-font-weight: bold; -fx-text-fill: #6B1942;");

        Label sub = new Label("Verifique su número de boleta e intente de nuevo");
        sub.setStyle("-fx-font-size: 14px; -fx-text-fill: #666;");

        card.getChildren().addAll(icon, msg, sub);

        Button okBtn = new Button("ACEPTAR");
        okBtn.getStyleClass().add("btn-primary");
        okBtn.setPrefWidth(180);
        okBtn.setOnAction(e -> SceneManager.showPantallaPrincipal());

        content.getChildren().addAll(card, okBtn);
        root.getChildren().add(content);
    }

    public Parent getRoot() {
        return root;
    }
}
