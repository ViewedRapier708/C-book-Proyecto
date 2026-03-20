package Admin_interfaz;

import c.book.SceneManager;
import Clases_flujo_principal.Conexion_BD;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.stage.Stage;
import java.sql.*;

public class agregar_libros {

    private Stage dialog;
    private Libros_admin parent;
    private TextField fieldId, fieldTitulo, fieldTomo, fieldAutor, fieldEditorial, fieldSemestre, fieldCarrera;

    public agregar_libros(Libros_admin parent) {
        this.parent = parent;
        buildUI();
    }

    private void buildUI() {
        VBox root = new VBox(20);
        root.getStyleClass().add("main-bg");
        root.setAlignment(Pos.CENTER);
        root.setPadding(new Insets(30));

        VBox card = new VBox(16);
        card.getStyleClass().add("card");
        card.setAlignment(Pos.CENTER);
        card.setPadding(new Insets(28));
        card.setMaxWidth(500);

        Label title = new Label("AGREGAR NUEVO LIBRO");
        title.setStyle("-fx-font-size: 22px; -fx-font-weight: bold; -fx-text-fill: #6B1942;");

        fieldId = createField("ID del libro");
        fieldTitulo = createField("Título");
        fieldTomo = createField("Tomo");
        fieldAutor = createField("Autor");
        fieldEditorial = createField("Editorial");
        fieldSemestre = createField("Semestre");
        fieldCarrera = createField("Carrera");

        HBox buttons = new HBox(16);
        buttons.setAlignment(Pos.CENTER);

        Button cancelBtn = new Button("CANCELAR");
        cancelBtn.getStyleClass().add("btn-secondary");
        cancelBtn.setStyle(cancelBtn.getStyle() + "-fx-text-fill: #c0392b; -fx-border-color: #c0392b;");
        cancelBtn.setPrefWidth(140);
        cancelBtn.setOnAction(e -> dialog.close());

        Button addBtn = new Button("AGREGAR");
        addBtn.getStyleClass().add("btn-primary");
        addBtn.setPrefWidth(160);
        addBtn.setOnAction(e -> agregarLibro());

        buttons.getChildren().addAll(cancelBtn, addBtn);

        card.getChildren().addAll(title,
            createRow("ID:", fieldId),
            createRow("TÍTULO:", fieldTitulo),
            createRow("TOMO:", fieldTomo),
            createRow("AUTOR:", fieldAutor),
            createRow("EDITORIAL:", fieldEditorial),
            createRow("SEMESTRE:", fieldSemestre),
            createRow("CARRERA:", fieldCarrera),
            buttons
        );

        root.getChildren().add(card);
        dialog = SceneManager.createDialog(root, "Agregar Libro", 550, 620);
    }

    private TextField createField(String prompt) {
        TextField tf = new TextField();
        tf.getStyleClass().add("text-field-modern");
        tf.setPromptText(prompt);
        tf.setPrefWidth(300);
        return tf;
    }

    private HBox createRow(String label, TextField field) {
        HBox row = new HBox(12);
        row.setAlignment(Pos.CENTER_LEFT);
        Label lbl = new Label(label);
        lbl.setMinWidth(100);
        lbl.getStyleClass().add("label-text");
        row.getChildren().addAll(lbl, field);
        return row;
    }

    private void agregarLibro() {
        String id = fieldId.getText().trim();
        String titulo = fieldTitulo.getText().trim();
        String tomo = fieldTomo.getText().trim();
        String autor = fieldAutor.getText().trim();
        String editorial = fieldEditorial.getText().trim();
        String semestre = fieldSemestre.getText().trim();
        String carrera = fieldCarrera.getText().trim();

        if (id.isEmpty() || titulo.isEmpty()) {
            Alert a = new Alert(Alert.AlertType.WARNING);
            a.setHeaderText(null);
            a.setContentText("Los campos ID y Título son obligatorios.");
            a.showAndWait();
            return;
        }

        try (Connection con = DriverManager.getConnection(Conexion_BD.url, Conexion_BD.user, Conexion_BD.pws)) {
            String sql = "INSERT INTO biblioteca.libro (ID_libro, Titulo_libro, Tomo_libro, Autor_libro, Editorial_libro, Semestre, Carrera) VALUES (?,?,?,?,?,?,?)";
            PreparedStatement ps = con.prepareStatement(sql);
            ps.setString(1, id);
            ps.setString(2, titulo);
            ps.setString(3, tomo);
            ps.setString(4, autor);
            ps.setString(5, editorial);
            ps.setString(6, semestre);
            ps.setString(7, carrera);
            ps.executeUpdate();
            ps.close();

            Alert a = new Alert(Alert.AlertType.INFORMATION);
            a.setHeaderText(null);
            a.setContentText("Libro agregado exitosamente.");
            a.showAndWait();

            parent.cargarDatos();
            dialog.close();
        } catch (Exception e) {
            Alert a = new Alert(Alert.AlertType.ERROR);
            a.setHeaderText(null);
            a.setContentText("Error: " + e.getMessage());
            a.showAndWait();
        }
    }

    public void show() {
        dialog.showAndWait();
    }
}
