<?php
header('Content-Type: application/json; charset=utf-8');
require 'conexion.php';
$link = Conectarse();

$query = "SELECT * FROM platillos";
$resultado = mysqli_query($link, $query);
$platillos = array();

while($row = mysqli_fetch_assoc($resultado)) {
    $row['opciones'] = $row['opciones_json'] ? json_decode($row['opciones_json'], true) : [];
    unset($row['opciones_json']);
    $platillos[] = $row;
}
echo json_encode($platillos, JSON_UNESCAPED_UNICODE);
?>