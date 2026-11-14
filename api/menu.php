<?php
header('Content-Type: application/json; charset=utf-8');
error_reporting(0);
require 'conexion.php';
$link = Conectarse();

$query = "SELECT * FROM platillos";
$resultado = mysqli_query($link, $query);
$platillos = array();

if($resultado) {
    while($row = mysqli_fetch_assoc($resultado)) {
        // Decodificamos las opciones
        $row['opciones'] = empty($row['opciones_json']) ? [] : json_decode($row['opciones_json'], true);
        unset($row['opciones_json']);

        // Limpiamos cualquier rastro de nulos
        if (empty($row['nombre']) || $row['nombre'] == 'null') {
            $row['nombre'] = "Platillo de la casa";
        }
        if (empty($row['descripcion']) || $row['descripcion'] == 'null') {
            $row['descripcion'] = "Preparado con ingredientes de la región y el toque especial de nuestra vainilla.";
        }
        if (empty($row['imagen_url']) || $row['imagen_url'] == 'null') {
            $row['imagen_url'] = "https://images.unsplash.com/photo-1544025162-811114215b2b";
        }
        
        $platillos[] = $row;
    }
    echo json_encode($platillos, JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode([]);
}
?>
