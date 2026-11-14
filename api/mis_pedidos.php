<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
error_reporting(0);
require 'conexion.php';
$link = Conectarse();

if (!isset($_SESSION['cliente_id'])) {
    echo json_encode(["error" => "No autorizado"]); exit;
}

$cliente_id = $_SESSION['cliente_id'];

$query = "SELECT p.id, p.total, p.estado, p.fecha, p.direccion_entrega,
          GROUP_CONCAT(CONCAT(d.cantidad, 'x ', d.platillo_nombre) SEPARATOR '<br>') as items
          FROM pedidos p
          LEFT JOIN pedido_detalles d ON p.id = d.pedido_id
          WHERE p.cliente_id = $cliente_id
          GROUP BY p.id
          ORDER BY p.fecha DESC";

$resultado = mysqli_query($link, $query);
$pedidos = array();

if ($resultado) {
    while($row = mysqli_fetch_assoc($resultado)) {
        $row['items'] = $row['items'] ? $row['items'] : "Sin platillos registrados";
        $row['fecha'] = $row['fecha'] ? $row['fecha'] : "Fecha no disponible";
        $pedidos[] = $row; 
    }
    echo json_encode($pedidos);
} else {
    echo json_encode(["error" => "Error SQL: " . mysqli_error($link)]);
}
?>