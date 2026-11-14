<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
error_reporting(0);
require 'conexion.php';
$link = Conectarse();

$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($action === 'register') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data || empty($data['telefono']) || empty($data['password'])) {
        echo json_encode(["error" => "Faltan datos obligatorios."]); exit;
    }

    $nombre = isset($data['nombre']) ? mysqli_real_escape_string($link, $data['nombre']) : '';
    $telefono = isset($data['telefono']) ? mysqli_real_escape_string($link, $data['telefono']) : '';
    $pass = md5($data['password']);
    $colonia = isset($data['colonia']) ? mysqli_real_escape_string($link, $data['colonia']) : ''; 
    $calle_colonia = isset($data['calle']) ? mysqli_real_escape_string($link, $data['calle']) : ''; 
    $numero = isset($data['numero']) ? mysqli_real_escape_string($link, $data['numero']) : '';
    $interior = isset($data['interior']) ? mysqli_real_escape_string($link, $data['interior']) : '';
    $referencias = isset($data['referencias']) ? mysqli_real_escape_string($link, $data['referencias']) : '';

    $check = mysqli_query($link, "SELECT id FROM clientes WHERE telefono = '$telefono'");
    if (mysqli_num_rows($check) > 0) {
        echo json_encode(["error" => "Este teléfono ya está registrado."]); exit;
    }

    $query = "INSERT INTO clientes (nombre, telefono, password, colonia, calle_colonia, numero, interior, referencias) 
              VALUES ('$nombre', '$telefono', '$pass', '$colonia', '$calle_colonia', '$numero', '$interior', '$referencias')";
    
    if (mysqli_query($link, $query)) {
        $_SESSION['cliente_id'] = mysqli_insert_id($link);
        $_SESSION['cliente_nombre'] = $nombre;
        echo json_encode(["success" => true, "nombre" => $nombre]);
    } else {
        echo json_encode(["error" => "Error SQL: " . mysqli_error($link)]);
    }
    exit;
}

if ($action === 'login') {
    $data = json_decode(file_get_contents('php://input'), true);
    $telefono = isset($data['telefono']) ? mysqli_real_escape_string($link, $data['telefono']) : '';
    $pass = md5(isset($data['password']) ? $data['password'] : '');

    $query = "SELECT * FROM clientes WHERE telefono = '$telefono'";
    $resultado = mysqli_query($link, $query);

    if ($resultado && mysqli_num_rows($resultado) > 0) {
        $row = mysqli_fetch_assoc($resultado);
        if ($pass === $row['password']) {
            $_SESSION['cliente_id'] = $row['id'];
            $_SESSION['cliente_nombre'] = $row['nombre'];
            echo json_encode(["success" => true, "nombre" => $row['nombre']]); exit;
        }
    }
    echo json_encode(["error" => "Teléfono o contraseña incorrectos."]); exit;
}

if ($action === 'check_session') {
    if (isset($_SESSION['cliente_id'])) {
        $id = $_SESSION['cliente_id'];
        $res = mysqli_query($link, "SELECT * FROM clientes WHERE id = $id");
        $user = mysqli_fetch_assoc($res);
        if($user) {
            echo json_encode([
                "logged_in" => true, 
                "nombre" => $user['nombre'],
                "telefono" => $user['telefono'],
                "colonia" => $user['colonia'], 
                "calle_colonia" => $user['calle_colonia'], 
                "numero" => $user['numero'],
                "interior" => $user['interior'],
                "referencias" => $user['referencias']
            ]);
        } else { echo json_encode(["logged_in" => false]); }
    } else { echo json_encode(["logged_in" => false]); }
    exit;
}

if ($action === 'logout') {
    session_destroy();
    echo json_encode(["success" => true]); exit;
}
?>
