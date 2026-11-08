<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
error_reporting(0);
require 'conexion.php';
$link = Conectarse();

if (!isset($_SESSION['cliente_id'])) {
    echo json_encode(["error" => "Debes iniciar sesión para comprar."]); exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$cliente_id = $_SESSION['cliente_id'];
$total = floatval($data['total']);
$metodo_pago = mysqli_real_escape_string($link, $data['metodo_pago']);
$carrito = $data['carrito'];

$tel_entrega = mysqli_real_escape_string($link, $data['telefono_entrega']);
$dir_entrega = mysqli_real_escape_string($link, $data['direccion_entrega']);
$notas_entrega = mysqli_real_escape_string($link, $data['notas_entrega']);

mysqli_query($link, "START TRANSACTION");

try {
    $query = "INSERT INTO pedidos (cliente_id, total, metodo_pago, telefono_entrega, direccion_entrega, notas_entrega) 
              VALUES ($cliente_id, $total, '$metodo_pago', '$tel_entrega', '$dir_entrega', '$notas_entrega')";
              
    if (!mysqli_query($link, $query)) throw new Exception(mysqli_error($link));
    $pedido_id = mysqli_insert_id($link);

    foreach ($carrito as $item) {
        $nombre_platillo = mysqli_real_escape_string($link, $item['nombreMostrar']);
        $cantidad = intval($item['cantidad']);
        $query_det = "INSERT INTO pedido_detalles (pedido_id, platillo_nombre, cantidad) VALUES ($pedido_id, '$nombre_platillo', $cantidad)";
        if (!mysqli_query($link, $query_det)) throw new Exception(mysqli_error($link));
    }

    mysqli_query($link, "COMMIT");
    echo json_encode(["success" => true, "pedido_id" => $pedido_id]);
} catch (Exception $e) {
    mysqli_query($link, "ROLLBACK");
    echo json_encode(["error" => $e->getMessage()]);
}
?>