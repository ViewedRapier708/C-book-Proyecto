package Admin_interfaz;

import c.book.SceneManager;
import Clases_flujo_principal.Conexion_BD;
import Clases_flujo_principal.Computadoras;
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

public class Computadoras_admin {

    private BorderPane root;
    private TableView<String[]> tablaComputadoras;
    private ObservableList<String[]> data = FXCollections.observableArrayList();

    public Computadoras_admin() {
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

        Label title = new Label("GESTIÓN DE COMPUTADORAS");
        title.setStyle("-fx-font-size: 22px; -fx-font-weight: bold; -fx-text-fill: white;");

        Region spacer = new Region();
        HBox.setHgrow(spacer, Priority.ALWAYS);

        ComboBox<String> operationCombo = new ComboBox<>();
        operationCombo.getStyleClass().add("combo-modern");
        operationCombo.getItems().addAll("AGREGAR", "ELIMINAR", "MODIFICAR");
        operationCombo.setPromptText("Operación...");

        Button actionBtn = new Button("EJECUTAR");
        actionBtn.getStyleClass().add("btn-primary");
        actionBtn.setOnAction(e -> ejecutarOperacion(operationCombo.getValue(), "computadora", "COMPUTADORAS", "ID_com", "Num_com", "Estado_com"));

        Button backBtn = new Button("VOLVER");
        backBtn.getStyleClass().add("btn-secondary");
        backBtn.setStyle(backBtn.getStyle() + "-fx-text-fill: white; -fx-border-color: white;");
        backBtn.setOnAction(e -> SceneManager.showOpcionesAdmin());

        titleBar.getChildren().addAll(title, spacer, operationCombo, actionBtn, backBtn);

        tablaComputadoras = new TableView<>();
        tablaComputadoras.getStyleClass().add("table-modern");
        tablaComputadoras.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);
        VBox.setVgrow(tablaComputadoras, Priority.ALWAYS);

        TableColumn<String[], String> colNum = new TableColumn<>("NÚMERO COMPUTADORA");
        colNum.setCellValueFactory(cd -> new SimpleStringProperty(cd.getValue()[0]));

        TableColumn<String[], String> colEstado = new TableColumn<>("ESTADO");
        colEstado.setCellValueFactory(cd -> new SimpleStringProperty(cd.getValue()[1]));
        colEstado.setCellFactory(col -> new TableCell<>() {
            @Override
            protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setText(null);
                    setGraphic(null);
                } else {
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
            }
        });

        tablaComputadoras.getColumns().addAll(colNum, colEstado);
        tablaComputadoras.setItems(data);

        center.getChildren().addAll(titleBar, tablaComputadoras);
        root.setCenter(center);
    }

    private void cargarDatos() {
        data.clear();
        try (Connection con = DriverManager.getConnection(Conexion_BD.url, Conexion_BD.user, Conexion_BD.pws)) {
            String sql = "SELECT Num_com, Estado_com FROM biblioteca.computadora";
            PreparedStatement ps = con.prepareStatement(sql);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                String estado = rs.getString("Estado_com").equals("0") ? "inactivo" : "activo";
                data.add(new String[]{rs.getString("Num_com"), estado});
            }
            rs.close();
            ps.close();
        } catch (Exception e) {
            System.out.println(e.getMessage());
        }
    }

    private void ejecutarOperacion(String op, String dbTable, String displayName, String dbId, String dbNum, String dbEstado) {
        if (op == null) return;
        switch (op) {
            case "AGREGAR" -> agregarMaterial(dbTable, displayName, dbId, dbNum, dbEstado);
            case "ELIMINAR" -> eliminarMaterial(dbTable, displayName, dbNum);
            case "MODIFICAR" -> modificarEstado(dbTable, displayName, dbNum, dbEstado);
        }
    }

    private void agregarMaterial(String dbTable, String displayName, String dbId, String dbNum, String dbEstado) {
        TextInputDialog dialog = new TextInputDialog();
        dialog.setTitle("Agregar " + displayName);
        dialog.setHeaderText(null);
        dialog.setContentText("Ingrese la cantidad de " + displayName + " que desea agregar:");
        dialog.showAndWait().ifPresent(input -> {
            if (!input.trim().matches("^[0-9]+$")) {
                showAlert(Alert.AlertType.ERROR, "Este campo solo admite números.");
                return;
            }
            int cantidad = Integer.parseInt(input.trim());
            try (Connection con = DriverManager.getConnection(Conexion_BD.url, Conexion_BD.user, Conexion_BD.pws)) {
                String maxQuery = "SELECT MAX(" + dbNum + ") FROM biblioteca." + dbTable;
                PreparedStatement maxPs = con.prepareStatement(maxQuery);
                ResultSet rs = maxPs.executeQuery();
                int maxNum = 0;
                if (rs.next()) maxNum = rs.getInt(1);
                maxPs.close();

                String sql = "INSERT INTO biblioteca." + dbTable + "(" + dbId + "," + dbNum + "," + dbEstado + ") VALUES(?,?,?)";
                PreparedStatement ps = con.prepareStatement(sql);
                for (int i = 1; i <= cantidad; i++) {
                    int newNum = maxNum + i;
                    ps.setInt(1, newNum);
                    ps.setInt(2, newNum);
                    ps.setBoolean(3, true);
                    ps.executeUpdate();
                    Ingreso_de_materiales_a_arreglos.computadora.add(new Computadoras(newNum, false));
                }
                ps.close();
                showAlert(Alert.AlertType.INFORMATION, "Se agregaron " + cantidad + " " + displayName + " exitosamente.");
                cargarDatos();
            } catch (Exception e) {
                showAlert(Alert.AlertType.ERROR, "Error: " + e.getMessage());
            }
        });
    }

    private void eliminarMaterial(String dbTable, String displayName, String dbNum) {
        TextInputDialog dialog = new TextInputDialog();
        dialog.setTitle("Eliminar " + displayName);
        dialog.setHeaderText(null);
        dialog.setContentText("Ingrese el número de " + displayName + " a eliminar:");
        dialog.showAndWait().ifPresent(input -> {
            if (!input.trim().matches("^[0-9]+$")) {
                showAlert(Alert.AlertType.ERROR, "Este campo solo admite números.");
                return;
            }
            try (Connection con = DriverManager.getConnection(Conexion_BD.url, Conexion_BD.user, Conexion_BD.pws)) {
                String sql = "DELETE FROM biblioteca." + dbTable + " WHERE " + dbNum + " = ?";
                PreparedStatement ps = con.prepareStatement(sql);
                ps.setInt(1, Integer.parseInt(input.trim()));
                int rows = ps.executeUpdate();
                ps.close();
                if (rows > 0) {
                    showAlert(Alert.AlertType.INFORMATION, "Eliminación exitosa.");
                } else {
                    showAlert(Alert.AlertType.ERROR, "No se encontró " + displayName + " con ese número.");
                }
                cargarDatos();
            } catch (Exception e) {
                showAlert(Alert.AlertType.ERROR, "Error: " + e.getMessage());
            }
        });
    }

    private void modificarEstado(String dbTable, String displayName, String dbNum, String dbEstado) {
        TextInputDialog dialog = new TextInputDialog();
        dialog.setTitle("Modificar Estado - " + displayName);
        dialog.setHeaderText(null);
        dialog.setContentText("Ingrese el número de " + displayName + " a activar/desactivar:");
        dialog.showAndWait().ifPresent(input -> {
            if (!input.trim().matches("^[0-9]+$")) {
                showAlert(Alert.AlertType.ERROR, "Este campo solo admite números.");
                return;
            }
            Alert confirm = new Alert(Alert.AlertType.CONFIRMATION);
            confirm.setTitle("Cambiar Estado");
            confirm.setHeaderText(null);
            confirm.setContentText("¿Desea ACTIVAR o DESACTIVAR este material?");
            ButtonType activar = new ButtonType("ACTIVAR");
            ButtonType desactivar = new ButtonType("DESACTIVAR");
            ButtonType cancelar = new ButtonType("Cancelar", ButtonBar.ButtonData.CANCEL_CLOSE);
            confirm.getButtonTypes().setAll(activar, desactivar, cancelar);
            Optional<ButtonType> result = confirm.showAndWait();
            if (result.isEmpty() || result.get() == cancelar) return;

            boolean nuevoEstado = result.get() == activar;
            try (Connection con = DriverManager.getConnection(Conexion_BD.url, Conexion_BD.user, Conexion_BD.pws)) {
                String sql = "UPDATE biblioteca." + dbTable + " SET " + dbEstado + " = ? WHERE " + dbNum + " = ?";
                PreparedStatement ps = con.prepareStatement(sql);
                ps.setBoolean(1, nuevoEstado);
                ps.setInt(2, Integer.parseInt(input.trim()));
                int rows = ps.executeUpdate();
                ps.close();
                if (rows > 0) {
                    showAlert(Alert.AlertType.INFORMATION, "Estado actualizado correctamente.");
                } else {
                    showAlert(Alert.AlertType.ERROR, "No se encontró el material.");
                }
                cargarDatos();
            } catch (Exception e) {
                showAlert(Alert.AlertType.ERROR, "Error: " + e.getMessage());
            }
        });
    }

    private void showAlert(Alert.AlertType type, String msg) {
        Alert alert = new Alert(type);
        alert.setTitle(type == Alert.AlertType.ERROR ? "Error" : "Información");
        alert.setHeaderText(null);
        alert.setContentText(msg);
        alert.showAndWait();
    }

    public Parent getRoot() {
        return root;
    }
}
