package Interfazes;

import c.book.SceneManager;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Parent;
import javafx.scene.control.*;
import javafx.scene.layout.*;

public class Mensaje_salida {

    private VBox root;

    public Mensaje_salida() {
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

        // Farewell card
        VBox card = new VBox(16);
        card.getStyleClass().add("card-pink");
        card.setAlignment(Pos.CENTER);
        card.setMaxWidth(500);
        card.setPadding(new Insets(40));

        Label goodbye = new Label("HASTA LUEGO");
        goodbye.setStyle("-fx-font-size: 36px; -fx-font-weight: bold; -fx-text-fill: #6B1942;");

        Label thanks = new Label("Gracias por su visita");
        thanks.setStyle("-fx-font-size: 18px; -fx-text-fill: #555;");

        card.getChildren().addAll(goodbye, thanks);

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
