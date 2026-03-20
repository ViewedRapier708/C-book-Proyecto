package Admin_interfaz;

import c.book.SceneManager;
import Clases_flujo_principal.Conexion_BD;
import Clases_flujo_principal.guardarropas;
import Clases_flujo_principal.Ingreso_de_materiales_a_arreglos;
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
import java.util.Optional;

public class Guardarropa_admin {

    private BorderPane root;
    private ObservableList<String[]> data = FXCollections.observableArrayList();

    public Guardarropa_admin() {
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

        HBox titleBar = new HBox(20);
        titleBar.setAlignment(Pos.CENTER_LEFT);
        titleBar.setPadding(new Insets(10, 0, 10, 0));

        Label title = new Label("GESTIÓN DE GUARDARROPA");
        title.setStyle("-fx-font-size: 22px; -fx-font-weight: bold; -fx-text-fill: white;");

        Region spacer = new Region();
        HBox.setHgrow(spacer, Priority.ALWAYS);

        ComboBox<String> opCombo = new ComboBox<>();
        opCombo.getStyleClass().add("combo-modern");
        opCombo.getItems().addAll("AGREGAR", "ELIMINAR", "MODIFICAR");
        opCombo.setPromptText("Operación...");

        Button actionBtn = new Button("EJECUTAR");
        actionBtn.getStyleClass().add("btn-primary");
        actionBtn.setOnAction(e -> ejecutarOp(opCombo.getValue()));

        Button backBtn = new Button("VOLVER");
        backBtn.getStyleClass().add("btn-secondary");
        backBtn.setStyle(backBtn.getStyle() + "-fx-text-fill: white; -fx-border-color: white;");
        backBtn.setOnAction(e -> SceneManager.showOpcionesAdmin());

        titleBar.getChildren().addAll(title, spacer, opCombo, actionBtn, backBtn);

        TableView<String[]> tabla = new TableView<>();
        tabla.getStyleClass().add("table-modern");
        tabla.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);
        VBox.setVgrow(tabla, Priority.ALWAYS);

        TableColumn<String[], String> colNum = new TableColumn<>("NÚMERO GUARDARROPA");
        colNum.setCellValueFactory(cd -> new SimpleStringProperty(cd.getValue()[0]));

        TableColumn<String[], String> colEstado = new TableColumn<>("ESTADO");
        colEstado.setCellValueFactory(cd -> new SimpleStringProperty(cd.getValue()[1]));
        colEstado.setCellFactory(col -> new TableCell<>() {
            @Override
            protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) { setText(null); setGraphic(null); return; }
                HBox box = new HBox(8);
                box.setAlignment(Pos.CENTER_LEFT);
                javafx.scene.shape.Circle dot = new javafx.scene.shape.Circle(6);
                dot.setFill(item.equals("activo") ? javafx.scene.paint.Color.web("#27ae60") : javafx.scene.paint.Color.web("#e74c3c"));
                Label lbl = new Label(item.toUpperCase());
                lbl.setStyle("-fx-font-weight: bold; -fx-font-size: 12px;");
                box.getChildren().addAll(dot, lbl);
                setGraphic(box);
                setText(null);
            }
        });

        tabla.getColumns().addAll(colNum, colEstado);
        tabla.setItems(data);

        center.getChildren().addAll(titleBar, tabla);
        root.setCenter(center);
    }

    private void cargarDatos() {
        data.clear();
        try (Connection con = DriverManager.getConnection(Conexion_BD.url, Conexion_BD.user, Conexion_BD.pws)) {
            PreparedStatement ps = con.prepareStatement("SELECT Num_guardarropa, Estado_guardarropa FROM biblioteca.guardarropa");
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                String estado = rs.getString("Estado_guardarropa").equals("0") ? "inactivo" : "activo";
                data.add(new String[]{rs.getString("Num_guardarropa"), estado});
            }
            rs.close(); ps.close();
        } catch (Exception e) { System.out.println(e.getMessage()); }
    }

    private void ejecutarOp(String op) {
        if (op == null) return;
        switch (op) {
            case "AGREGAR" -> {
                TextInputDialog d = new TextInputDialog();
                d.setTitle("Agregar Guardarropas");
                d.setHeaderText(null);
                d.setContentText("Cantidad a agregar:");
                d.showAndWait().ifPresent(input -> {
                    if (!input.trim().matches("^[0-9]+$")) return;
                    int cant = Integer.parseInt(input.trim());
                    try (Connection con = DriverManager.getConnection(Conexion_BD.url, Conexion_BD.user, Conexion_BD.pws)) {
                        ResultSet rs = con.prepareStatement("SELECT MAX(Num_guardarropa) FROM biblioteca.guardarropa").executeQuery();
                        int max = 0; if (rs.next()) max = rs.getInt(1);
                        PreparedStatement ps = con.prepareStatement("INSERT INTO biblioteca.guardarropa(idguardarropa,Num_guardarropa,Estado_guardarropa) VALUES(?,?,?)");
                        for (int i = 1; i <= cant; i++) {
                            int n = max + i; ps.setInt(1, n); ps.setInt(2, n); ps.setBoolean(3, true); ps.executeUpdate();
                            Ingreso_de_materiales_a_arreglos.guardarropa.add(new guardarropas(n, false));
                        }
                        ps.close();
                        cargarDatos();
                    } catch (Exception e) { System.out.println(e.getMessage()); }
                });
            }
            case "ELIMINAR" -> {
                TextInputDialog d = new TextInputDialog();
                d.setTitle("Eliminar Guardarropa");
                d.setHeaderText(null);
                d.setContentText("Número del guardarropa a eliminar:");
                d.showAndWait().ifPresent(input -> {
                    if (!input.trim().matches("^[0-9]+$")) return;
                    try (Connection con = DriverManager.getConnection(Conexion_BD.url, Conexion_BD.user, Conexion_BD.pws)) {
                        PreparedStatement ps = con.prepareStatement("DELETE FROM biblioteca.guardarropa WHERE Num_guardarropa = ?");
                        ps.setInt(1, Integer.parseInt(input.trim()));
                        int rows = ps.executeUpdate(); ps.close();
                        showMsg(rows > 0 ? "Eliminación exitosa." : "No encontrado.");
                        cargarDatos();
                    } catch (Exception e) { System.out.println(e.getMessage()); }
                });
            }
            case "MODIFICAR" -> {
                TextInputDialog d = new TextInputDialog();
                d.setTitle("Modificar Estado");
                d.setHeaderText(null);
                d.setContentText("Número del guardarropa:");
                d.showAndWait().ifPresent(input -> {
                    if (!input.trim().matches("^[0-9]+$")) return;
                    Alert c = new Alert(Alert.AlertType.CONFIRMATION);
                    c.setTitle("Cambiar Estado");
                    c.setHeaderText(null);
                    c.setContentText("¿Activar o desactivar?");
                    ButtonType act = new ButtonType("ACTIVAR");
                    ButtonType des = new ButtonType("DESACTIVAR");
                    c.getButtonTypes().setAll(act, des, new ButtonType("Cancelar", ButtonBar.ButtonData.CANCEL_CLOSE));
                    Optional<ButtonType> r = c.showAndWait();
                    if (r.isEmpty() || r.get().getButtonData() == ButtonBar.ButtonData.CANCEL_CLOSE) return;
                    try (Connection con = DriverManager.getConnection(Conexion_BD.url, Conexion_BD.user, Conexion_BD.pws)) {
                        PreparedStatement ps = con.prepareStatement("UPDATE biblioteca.guardarropa SET Estado_guardarropa = ? WHERE Num_guardarropa = ?");
                        ps.setBoolean(1, r.get() == act);
                        ps.setInt(2, Integer.parseInt(input.trim()));
                        ps.executeUpdate(); ps.close();
                        cargarDatos();
                    } catch (Exception e) { System.out.println(e.getMessage()); }
                });
            }
        }
    }

    private void showMsg(String msg) {
        Alert a = new Alert(Alert.AlertType.INFORMATION); a.setHeaderText(null); a.setContentText(msg); a.showAndWait();
    }

    public Parent getRoot() { return root; }
}
