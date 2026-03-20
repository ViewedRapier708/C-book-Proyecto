package Interfazes;

import c.book.SceneManager;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Parent;
import javafx.scene.control.*;
import javafx.scene.layout.*;

public class No_hay_disponibles {

    private VBox root;

    public No_hay_disponibles() {
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
        card.setMaxWidth(550);
        card.setPadding(new Insets(40));

        Label icon = new Label("X");
        icon.setStyle("-fx-font-size: 42px; -fx-font-weight: bold; -fx-text-fill: #e67e22; " +
                      "-fx-background-color: rgba(230,126,34,0.1); -fx-background-radius: 50; " +
                      "-fx-min-width: 80; -fx-min-height: 80; -fx-alignment: center;");

        Label msg = new Label("NO HAY MATERIALES DISPONIBLES");
        msg.setStyle("-fx-font-size: 24px; -fx-font-weight: bold; -fx-text-fill: #6B1942;");

        Label sub = new Label("EN ESTE MOMENTO, REGRESE MÁS TARDE");
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
