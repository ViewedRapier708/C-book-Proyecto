package Admin_interfaz;

import c.book.SceneManager;
import Clases_flujo_principal.Conexion_BD;
import Interfazes.Pantalla_principal;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Parent;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import java.sql.*;

public class Libros_admin {

    private BorderPane root;
    private TableView<String[]> tablaLibros;
    private ObservableList<String[]> librosData = FXCollections.observableArrayList();

    public Libros_admin() {
        buildUI();
        cargarDatos();
    }

    @SuppressWarnings("unchecked")
    private void buildUI() {
        root = new BorderPane();
        root.getStyleClass().add("main-bg");

        root.setTop(Pantalla_principal.createHeader());

        VBox center = new VBox(16);
        center.setPadding(new Insets(20));

        // Title bar
        HBox titleBar = new HBox(20);
        titleBar.setAlignment(Pos.CENTER_LEFT);
        titleBar.setPadding(new Insets(10, 0, 10, 0));

        Label title = new Label("GESTIÓN DE LIBROS");
        title.setStyle("-fx-font-size: 22px; -fx-font-weight: bold; -fx-text-fill: white;");

        Region spacer = new Region();
        HBox.setHgrow(spacer, Priority.ALWAYS);

        ComboBox<String> operationCombo = new ComboBox<>();
        operationCombo.getStyleClass().add("combo-modern");
        operationCombo.getItems().addAll("AGREGAR", "ELIMINAR", "MODIFICAR");
        operationCombo.setPromptText("Operación...");

        Button actionBtn = new Button("EJECUTAR");
        actionBtn.getStyleClass().add("btn-primary");
        actionBtn.setOnAction(e -> {
            String op = operationCombo.getValue();
            if (op == null) return;
            switch (op) {
                case "AGREGAR" -> {
                    agregar_libros dialog = new agregar_libros(this);
                    dialog.show();
                }
                case "ELIMINAR" -> eliminarLibro();
                case "MODIFICAR" -> modificarLibro();
            }
        });

        Button backBtn = new Button("VOLVER");
        backBtn.getStyleClass().add("btn-secondary");
        backBtn.setStyle(backBtn.getStyle() + "-fx-text-fill: white; -fx-border-color: white;");
        backBtn.setOnAction(e -> SceneManager.showOpcionesAdmin());

        titleBar.getChildren().addAll(title, spacer, operationCombo, actionBtn, backBtn);

        // Table
        tablaLibros = new TableView<>();
        tablaLibros.getStyleClass().add("table-modern");
        tablaLibros.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);
        VBox.setVgrow(tablaLibros, Priority.ALWAYS);

        TableColumn<String[], String> colId = new TableColumn<>("ID");
        colId.setCellValueFactory(cd -> new SimpleStringProperty(cd.getValue()[0]));
        colId.setPrefWidth(60);

        TableColumn<String[], String> colTitulo = new TableColumn<>("TÍTULO");
        colTitulo.setCellValueFactory(cd -> new SimpleStringProperty(cd.getValue()[1]));

        TableColumn<String[], String> colTomo = new TableColumn<>("TOMO");
        colTomo.setCellValueFactory(cd -> new SimpleStringProperty(cd.getValue()[2]));
        colTomo.setPrefWidth(70);

        TableColumn<String[], String> colAutor = new TableColumn<>("AUTOR");
        colAutor.setCellValueFactory(cd -> new SimpleStringProperty(cd.getValue()[3]));

        TableColumn<String[], String> colEditorial = new TableColumn<>("EDITORIAL");
        colEditorial.setCellValueFactory(cd -> new SimpleStringProperty(cd.getValue()[4]));

        TableColumn<String[], String> colSemestre = new TableColumn<>("SEMESTRE");
        colSemestre.setCellValueFactory(cd -> new SimpleStringProperty(cd.getValue()[5]));
        colSemestre.setPrefWidth(90);

        TableColumn<String[], String> colCarrera = new TableColumn<>("CARRERA");
        colCarrera.setCellValueFactory(cd -> new SimpleStringProperty(cd.getValue()[6]));

        tablaLibros.getColumns().addAll(colId, colTitulo, colTomo, colAutor, colEditorial, colSemestre, colCarrera);
        tablaLibros.setItems(librosData);

        center.getChildren().addAll(titleBar, tablaLibros);
        root.setCenter(center);
    }

    public void cargarDatos() {
        librosData.clear();
        try (Connection con = DriverManager.getConnection(Conexion_BD.url, Conexion_BD.user, Conexion_BD.pws)) {
            String sql = "SELECT ID_libro, Titulo_libro, Tomo_libro, Autor_libro, Editorial_libro, Semestre, Carrera FROM biblioteca.libro";
            PreparedStatement ps = con.prepareStatement(sql);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                librosData.add(new String[]{
                    rs.getString("ID_libro"),
                    rs.getString("Titulo_libro"),
                    rs.getString("Tomo_libro"),
                    rs.getString("Autor_libro"),
                    rs.getString("Editorial_libro"),
                    rs.getString("Semestre"),
                    rs.getString("Carrera")
                });
            }
            rs.close();
            ps.close();
        } catch (Exception e) {
            System.out.println(e.getMessage());
        }
    }

    private void eliminarLibro() {
        TextInputDialog dialog = new TextInputDialog();
        dialog.setTitle("Eliminar Libro");
        dialog.setHeaderText(null);
        dialog.setContentText("Ingrese el ID del libro a eliminar:");
        dialog.showAndWait().ifPresent(id -> {
            if (id.trim().isEmpty()) return;
            try (Connection con = DriverManager.getConnection(Conexion_BD.url, Conexion_BD.user, Conexion_BD.pws)) {
                String sql = "DELETE FROM biblioteca.libro WHERE ID_libro = ?";
                PreparedStatement ps = con.prepareStatement(sql);
                ps.setString(1, id.trim());
                int rows = ps.executeUpdate();
                ps.close();
                if (rows > 0) {
                    showInfo("El libro se eliminó correctamente.");
                } else {
                    showError("No se encontró un libro con ese ID.");
                }
                cargarDatos();
            } catch (Exception e) {
                showError("Error: " + e.getMessage());
            }
        });
    }

    private void modificarLibro() {
        TextInputDialog dialog = new TextInputDialog();
        dialog.setTitle("Modificar Libro");
        dialog.setHeaderText(null);
        dialog.setContentText("Ingrese el ID del libro a modificar:");
        dialog.showAndWait().ifPresent(id -> {
            if (id.trim().isEmpty()) return;
            Modificar_libros modDialog = new Modificar_libros(this, id.trim());
            if (modDialog.isEncontrado()) {
                modDialog.show();
            } else {
                showError("Libro no encontrado.");
            }
        });
    }

    private void showInfo(String msg) {
        Alert alert = new Alert(Alert.AlertType.INFORMATION);
        alert.setTitle("Información");
        alert.setHeaderText(null);
        alert.setContentText(msg);
        alert.showAndWait();
    }

    private void showError(String msg) {
        Alert alert = new Alert(Alert.AlertType.ERROR);
        alert.setTitle("Error");
        alert.setHeaderText(null);
        alert.setContentText(msg);
        alert.showAndWait();
    }

    public Parent getRoot() {
        return root;
    }
}
