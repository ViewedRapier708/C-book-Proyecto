package Interfazes;

import c.book.SceneManager;
import Clases_flujo_principal.*;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.collections.transformation.FilteredList;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Parent;
import javafx.scene.control.*;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;
import javafx.scene.layout.*;
import java.sql.*;
import java.time.LocalDateTime;

public class Consulta_libros {

    private BorderPane root;
    private TableView<String[]> tablaLibros;
    private ObservableList<String[]> librosData = FXCollections.observableArrayList();
    private static int indice;

    public Consulta_libros() {
        buildUI();
        ingresoDatosLib();
    }

    public static void setIndice(int idx) {
        indice = idx;
    }

    @SuppressWarnings("unchecked")
    private void buildUI() {
        root = new BorderPane();
        root.getStyleClass().add("main-bg");

        // Header
        HBox header = new HBox();
        header.getStyleClass().add("header-bar");
        header.setAlignment(Pos.CENTER);
        header.setSpacing(20);

        try {
            ImageView ipnLogo = new ImageView(new Image(getClass().getResourceAsStream("/Img/ipn 140.png")));
            ipnLogo.setFitHeight(50);
            ipnLogo.setPreserveRatio(true);
            header.getChildren().add(ipnLogo);
        } catch (Exception ignored) {}

        Region s1 = new Region();
        HBox.setHgrow(s1, Priority.ALWAYS);
        header.getChildren().add(s1);

        Label title = new Label("SISTEMA DE BÚSQUEDA DE LIBROS");
        title.setStyle("-fx-font-size: 22px; -fx-font-weight: bold; -fx-text-fill: #6B1942;");
        header.getChildren().add(title);

        Region s2 = new Region();
        HBox.setHgrow(s2, Priority.ALWAYS);
        header.getChildren().add(s2);

        try {
            ImageView batizLogo = new ImageView(new Image(getClass().getResourceAsStream("/Img/batiz.jpeg")));
            batizLogo.setFitHeight(50);
            batizLogo.setPreserveRatio(true);
            header.getChildren().add(batizLogo);
        } catch (Exception ignored) {}

        root.setTop(header);

        // Center: search + table
        VBox center = new VBox(16);
        center.setPadding(new Insets(20));
        center.setAlignment(Pos.TOP_CENTER);

        // Search bar card
        HBox searchBar = new HBox(12);
        searchBar.getStyleClass().add("card");
        searchBar.setAlignment(Pos.CENTER_LEFT);
        searchBar.setPadding(new Insets(16, 24, 16, 24));
        searchBar.setMaxWidth(Double.MAX_VALUE);

        Label searchIcon = new Label("\uD83D\uDD0D");
        searchIcon.setStyle("-fx-font-size: 18px;");

        TextField fieldFiltro = new TextField();
        fieldFiltro.getStyleClass().add("text-field-modern");
        fieldFiltro.setPromptText("Buscar por título, autor, editorial, carrera...");
        HBox.setHgrow(fieldFiltro, Priority.ALWAYS);

        searchBar.getChildren().addAll(searchIcon, fieldFiltro);

        // Table
        tablaLibros = new TableView<>();
        tablaLibros.getStyleClass().add("table-modern");
        tablaLibros.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);
        VBox.setVgrow(tablaLibros, Priority.ALWAYS);

        TableColumn<String[], String> colTitulo = new TableColumn<>("TÍTULO");
        colTitulo.setCellValueFactory(cd -> new SimpleStringProperty(cd.getValue()[0]));
        colTitulo.setPrefWidth(220);

        TableColumn<String[], String> colTomo = new TableColumn<>("TOMO");
        colTomo.setCellValueFactory(cd -> new SimpleStringProperty(cd.getValue()[1]));
        colTomo.setPrefWidth(80);

        TableColumn<String[], String> colAutor = new TableColumn<>("AUTOR");
        colAutor.setCellValueFactory(cd -> new SimpleStringProperty(cd.getValue()[2]));
        colAutor.setPrefWidth(180);

        TableColumn<String[], String> colEditorial = new TableColumn<>("EDITORIAL");
        colEditorial.setCellValueFactory(cd -> new SimpleStringProperty(cd.getValue()[3]));
        colEditorial.setPrefWidth(160);

        TableColumn<String[], String> colCarrera = new TableColumn<>("CARRERA");
        colCarrera.setCellValueFactory(cd -> new SimpleStringProperty(cd.getValue()[4]));
        colCarrera.setPrefWidth(160);

        TableColumn<String[], String> colSemestre = new TableColumn<>("SEMESTRE");
        colSemestre.setCellValueFactory(cd -> new SimpleStringProperty(cd.getValue()[5]));
        colSemestre.setPrefWidth(100);

        tablaLibros.getColumns().addAll(colTitulo, colTomo, colAutor, colEditorial, colCarrera, colSemestre);

        // Filter
        FilteredList<String[]> filteredData = new FilteredList<>(librosData, p -> true);
        fieldFiltro.textProperty().addListener((obs, oldVal, newVal) -> {
            filteredData.setPredicate(row -> {
                if (newVal == null || newVal.isEmpty()) return true;
                String lower = newVal.toLowerCase();
                for (String cell : row) {
                    if (cell != null && cell.toLowerCase().contains(lower)) return true;
                }
                return false;
            });
        });
        tablaLibros.setItems(filteredData);

        center.getChildren().addAll(searchBar, tablaLibros);
        root.setCenter(center);

        // Footer: exit button
        HBox footer = new HBox();
        footer.setAlignment(Pos.CENTER_RIGHT);
        footer.setPadding(new Insets(10, 20, 20, 20));

        Button salidaBtn = new Button("SALIR");
        salidaBtn.getStyleClass().add("btn-primary");
        salidaBtn.setPrefWidth(160);
        salidaBtn.setOnAction(e -> registroSalida());

        footer.getChildren().add(salidaBtn);
        root.setBottom(footer);
    }

    private void ingresoDatosLib() {
        try (Connection con = DriverManager.getConnection(Conexion_BD.url, Conexion_BD.user, Conexion_BD.pws)) {
            String sql = "SELECT Titulo_libro, Tomo_libro, Autor_libro, Editorial_libro, Carrera, Semestre FROM biblioteca.libro";
            PreparedStatement ps = con.prepareStatement(sql);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                librosData.add(new String[]{
                    rs.getString("Titulo_libro"),
                    rs.getString("Tomo_libro"),
                    rs.getString("Autor_libro"),
                    rs.getString("Editorial_libro"),
                    rs.getString("Carrera"),
                    rs.getString("Semestre")
                });
            }
            rs.close();
            ps.close();
        } catch (Exception e) {
            System.out.println(e.getMessage());
        }
    }

    private void registroSalida() {
        try {
            if (indice >= 0 && indice < Variables_para_registro.registro.size()) {
                Variables_para_registro reg = Variables_para_registro.registro.get(indice);
                reg.setHora_salida(LocalDateTime.now());

                Registro_actividad restablecer = new Registro_actividad();
                restablecer.restablecer_numeros_salida(reg.getActividad(), reg.getNo_asignado(), reg.getNumero_guardarropa());

                try (Connection con = DriverManager.getConnection(Conexion_BD.url, Conexion_BD.user, Conexion_BD.pws)) {
                    String sql = "INSERT INTO biblioteca.registro (boleta, actividad, num_com, num_restirador, num_guardarropa, hora_entrada, hora_salida) VALUES (?,?,?,?,?,?,?)";
                    PreparedStatement ps = con.prepareStatement(sql);
                    ps.setInt(1, reg.getBoleta_g());
                    ps.setString(2, reg.getActividad());
                    ps.setInt(3, 0);
                    ps.setInt(4, 0);
                    ps.setInt(5, reg.getNumero_guardarropa());
                    ps.setTimestamp(6, Timestamp.valueOf(reg.getHora_entrada()));
                    ps.setTimestamp(7, Timestamp.valueOf(reg.getHora_salida()));
                    ps.executeUpdate();
                    ps.close();
                }
                Variables_para_registro.registro.remove(indice);
            }
        } catch (Exception e) {
            System.out.println(e.getMessage());
        }
        SceneManager.showMensajeSalida();
    }

    public Parent getRoot() {
        return root;
    }
}
