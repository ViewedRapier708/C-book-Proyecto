package Admin_interfaz;

import c.book.SceneManager;
import Clases_flujo_principal.Conexion_BD;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.stage.Stage;
import java.sql.*;

public class Modificar_libros {

    private Stage dialog;
    private Libros_admin parent;
    private boolean encontrado = false;
    private TextField fieldTitulo, fieldTomo, fieldAutor, fieldEditorial, fieldSemestre, fieldCarrera;
    private String libroId;

    // Old values
    private String oldTitulo, oldTomo, oldAutor, oldEditorial, oldSemestre, oldCarrera;

    public Modificar_libros(Libros_admin parent, String id) {
        this.parent = parent;
        this.libroId = id;
        buscarLibro(id);
        if (encontrado) {
            buildUI();
        }
    }

    private void buscarLibro(String id) {
        try (Connection con = DriverManager.getConnection(Conexion_BD.url, Conexion_BD.user, Conexion_BD.pws)) {
            PreparedStatement ps = con.prepareStatement("SELECT * FROM biblioteca.libro WHERE ID_libro = ?");
            ps.setString(1, id);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                encontrado = true;
                oldTitulo = rs.getString("Titulo_libro");
                oldTomo = rs.getString("Tomo_libro");
                oldAutor = rs.getString("Autor_libro");
                oldEditorial = rs.getString("Editorial_libro");
                oldSemestre = rs.getString("Semestre");
                oldCarrera = rs.getString("Carrera");
            }
            rs.close(); ps.close();
        } catch (Exception e) {
            System.out.println(e.getMessage());
        }
    }

    private void buildUI() {
        VBox root = new VBox(20);
        root.getStyleClass().add("main-bg");
        root.setAlignment(Pos.CENTER);
        root.setPadding(new Insets(30));

        VBox card = new VBox(14);
        card.getStyleClass().add("card");
        card.setAlignment(Pos.CENTER);
        card.setPadding(new Insets(28));
        card.setMaxWidth(600);

        Label title = new Label("MODIFICAR LIBRO (ID: " + libroId + ")");
        title.setStyle("-fx-font-size: 20px; -fx-font-weight: bold; -fx-text-fill: #6B1942;");

        fieldTitulo = createField("Nuevo título", oldTitulo);
        fieldTomo = createField("Nuevo tomo", oldTomo);
        fieldAutor = createField("Nuevo autor", oldAutor);
        fieldEditorial = createField("Nueva editorial", oldEditorial);
        fieldSemestre = createField("Nuevo semestre", oldSemestre);
        fieldCarrera = createField("Nueva carrera", oldCarrera);

        HBox buttons = new HBox(16);
        buttons.setAlignment(Pos.CENTER);

        Button cancelBtn = new Button("CANCELAR");
        cancelBtn.getStyleClass().add("btn-secondary");
        cancelBtn.setStyle(cancelBtn.getStyle() + "-fx-text-fill: #c0392b; -fx-border-color: #c0392b;");
        cancelBtn.setPrefWidth(140);
        cancelBtn.setOnAction(e -> dialog.close());

        Button saveBtn = new Button("GUARDAR");
        saveBtn.getStyleClass().add("btn-primary");
        saveBtn.setPrefWidth(160);
        saveBtn.setOnAction(e -> guardarCambios());

        buttons.getChildren().addAll(cancelBtn, saveBtn);

        card.getChildren().addAll(title,
            createRow("TÍTULO:", oldTitulo, fieldTitulo),
            createRow("TOMO:", oldTomo, fieldTomo),
            createRow("AUTOR:", oldAutor, fieldAutor),
            createRow("EDITORIAL:", oldEditorial, fieldEditorial),
            createRow("SEMESTRE:", oldSemestre, fieldSemestre),
            createRow("CARRERA:", oldCarrera, fieldCarrera),
            buttons
        );

        root.getChildren().add(card);
        dialog = SceneManager.createDialog(root, "Modificar Libro", 650, 620);
    }

    private TextField createField(String prompt, String currentVal) {
        TextField tf = new TextField(currentVal != null ? currentVal : "");
        tf.getStyleClass().add("text-field-modern");
        tf.setPromptText(prompt);
        tf.setPrefWidth(250);
        return tf;
    }

    private HBox createRow(String label, String oldVal, TextField newField) {
        HBox row = new HBox(12);
        row.setAlignment(Pos.CENTER_LEFT);

        Label lbl = new Label(label);
        lbl.setMinWidth(90);
        lbl.getStyleClass().add("label-text");

        Label old = new Label(oldVal != null ? oldVal : "");
        old.setMinWidth(150);
        old.setStyle("-fx-text-fill: #999; -fx-font-style: italic;");

        Label arrow = new Label("->");
        arrow.setStyle("-fx-text-fill: #6B1942; -fx-font-weight: bold;");

        row.getChildren().addAll(lbl, old, arrow, newField);
        return row;
    }

    private void guardarCambios() {
        try (Connection con = DriverManager.getConnection(Conexion_BD.url, Conexion_BD.user, Conexion_BD.pws)) {
            String sql = "UPDATE biblioteca.libro SET Titulo_libro=?, Tomo_libro=?, Autor_libro=?, Editorial_libro=?, Semestre=?, Carrera=? WHERE ID_libro=?";
            PreparedStatement ps = con.prepareStatement(sql);
            ps.setString(1, fieldTitulo.getText().trim());
            ps.setString(2, fieldTomo.getText().trim());
            ps.setString(3, fieldAutor.getText().trim());
            ps.setString(4, fieldEditorial.getText().trim());
            ps.setString(5, fieldSemestre.getText().trim());
            ps.setString(6, fieldCarrera.getText().trim());
            ps.setString(7, libroId);
            int rows = ps.executeUpdate();
            ps.close();

            if (rows > 0) {
                Alert a = new Alert(Alert.AlertType.INFORMATION);
                a.setHeaderText(null);
                a.setContentText("Libro modificado exitosamente.");
                a.showAndWait();
                parent.cargarDatos();
                dialog.close();
            }
        } catch (Exception e) {
            Alert a = new Alert(Alert.AlertType.ERROR);
            a.setHeaderText(null);
            a.setContentText("Error: " + e.getMessage());
            a.showAndWait();
        }
    }

    public boolean isEncontrado() { return encontrado; }

    public void show() {
        if (dialog != null) dialog.showAndWait();
    }
}
