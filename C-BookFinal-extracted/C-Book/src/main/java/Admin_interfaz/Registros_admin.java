package Admin_interfaz;

import c.book.SceneManager;
import Clases_flujo_principal.Conexion_BD;
import Interfazes.Pantalla_principal;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.collections.transformation.FilteredList;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Parent;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import java.sql.*;

public class Registros_admin {

    private BorderPane root;
    private ObservableList<String[]> data = FXCollections.observableArrayList();

    public Registros_admin() {
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

        // Title + search bar
        HBox titleBar = new HBox(20);
        titleBar.setAlignment(Pos.CENTER_LEFT);
        titleBar.setPadding(new Insets(10, 0, 10, 0));

        Label title = new Label("REGISTROS DE ALUMNOS");
        title.setStyle("-fx-font-size: 22px; -fx-font-weight: bold; -fx-text-fill: white;");

        Region spacer = new Region();
        HBox.setHgrow(spacer, Priority.ALWAYS);

        TextField searchField = new TextField();
        searchField.getStyleClass().add("text-field-modern");
        searchField.setPromptText("Buscar por boleta...");
        searchField.setPrefWidth(250);

        Button backBtn = new Button("VOLVER");
        backBtn.getStyleClass().add("btn-secondary");
        backBtn.setStyle(backBtn.getStyle() + "-fx-text-fill: white; -fx-border-color: white;");
        backBtn.setOnAction(e -> SceneManager.showOpcionesAdmin());

        titleBar.getChildren().addAll(title, spacer, searchField, backBtn);

        // Table
        TableView<String[]> tabla = new TableView<>();
        tabla.getStyleClass().add("table-modern");
        tabla.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);
        VBox.setVgrow(tabla, Priority.ALWAYS);

        String[] headers = {"BOLETA", "ACTIVIDAD", "NO. COMPUTADORA", "NO. RESTIRADOR", "NO. GUARDARROPA", "HORA ENTRADA", "HORA SALIDA"};
        for (int i = 0; i < headers.length; i++) {
            final int idx = i;
            TableColumn<String[], String> col = new TableColumn<>(headers[i]);
            col.setCellValueFactory(cd -> new SimpleStringProperty(cd.getValue()[idx]));
            tabla.getColumns().add(col);
        }

        FilteredList<String[]> filtered = new FilteredList<>(data, p -> true);
        searchField.textProperty().addListener((obs, old, val) -> {
            filtered.setPredicate(row -> {
                if (val == null || val.isEmpty()) return true;
                return row[0] != null && row[0].contains(val);
            });
        });
        tabla.setItems(filtered);

        center.getChildren().addAll(titleBar, tabla);
        root.setCenter(center);
    }

    private void cargarDatos() {
        data.clear();
        try (Connection con = DriverManager.getConnection(Conexion_BD.url, Conexion_BD.user, Conexion_BD.pws)) {
            PreparedStatement ps = con.prepareStatement("SELECT * FROM biblioteca.registro");
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                data.add(new String[]{
                    rs.getString("boleta"),
                    rs.getString("actividad"),
                    rs.getString("num_com"),
                    rs.getString("num_restirador"),
                    rs.getString("num_guardarropa"),
                    rs.getString("hora_entrada"),
                    rs.getString("hora_salida")
                });
            }
            rs.close(); ps.close();
        } catch (Exception e) { System.out.println(e.getMessage()); }
    }

    public Parent getRoot() { return root; }
}
