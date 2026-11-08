<?php
// Activar errores para saber exactamente qué falla (los desactivaremos después)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();
header('Content-Type: application/json; charset=utf-8');

require 'conexion.php';
$link = Conectarse();

if (!$link) {
    die(json_encode(["error" => "Error de conexión a MySQL."]));
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

// 1. REGISTRO
if ($action === 'register') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        echo json_encode(["error" => "No se recibieron datos."]); exit;
    }

    $nombre = isset($data['nombre']) ? mysqli_real_escape_string($link, $data['nombre']) : '';
    $telefono = isset($data['telefono']) ? mysqli_real_escape_string($link, $data['telefono']) : '';
    $pass = isset($data['password']) ? $data['password'] : '';
    
    $calle_colonia = isset($data['calle']) ? mysqli_real_escape_string($link, $data['calle']) : ''; 
    $numero = isset($data['numero']) ? mysqli_real_escape_string($link, $data['numero']) : '';
    $interior = isset($data['interior']) ? mysqli_real_escape_string($link, $data['interior']) : '';
    $referencias = isset($data['referencias']) ? mysqli_real_escape_string($link, $data['referencias']) : '';

    if (empty($telefono) || empty($pass) || empty($numero) || empty($calle_colonia)) {
        echo json_encode(["error" => "Faltan datos obligatorios (Teléfono, Contraseña, Calle, Número)."]); exit;
    }

    $check = mysqli_query($link, "SELECT id FROM clientes WHERE telefono = '$telefono'");
    if (mysqli_num_rows($check) > 0) {
        echo json_encode(["error" => "Este teléfono ya está registrado."]); exit;
    }

    // COMPATIBILIDAD CON PHP VIEJO
    if (function_exists('password_hash')) {
        $pass_encriptada = password_hash($pass, PASSWORD_DEFAULT);
    } else {
        $pass_encriptada = md5($pass); // Respaldo para versiones antiguas
    }

    $query = "INSERT INTO clientes (nombre, telefono, password, calle_colonia, numero, interior, referencias) 
              VALUES ('$nombre', '$telefono', '$pass_encriptada', '$calle_colonia', '$numero', '$interior', '$referencias')";
    
    if (mysqli_query($link, $query)) {
        $_SESSION['cliente_id'] = mysqli_insert_id($link);
        $_SESSION['cliente_nombre'] = $nombre;
        echo json_encode(["success" => true, "nombre" => $nombre]);
    } else {
        echo json_encode(["error" => "Error SQL al insertar: " . mysqli_error($link)]);
    }
    exit;
}

// 2. LOGIN
if ($action === 'login') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $telefono = isset($data['telefono']) ? mysqli_real_escape_string($link, $data['telefono']) : '';
    $pass = isset($data['password']) ? $data['password'] : '';

    $query = "SELECT * FROM clientes WHERE telefono = '$telefono'";
    $resultado = mysqli_query($link, $query);

    if ($resultado && mysqli_num_rows($resultado) > 0) {
        $row = mysqli_fetch_assoc($resultado);
        
        $login_exitoso = false;
        if (function_exists('password_verify')) {
            $login_exitoso = password_verify($pass, $row['password']);
        }
        // Si falló el verify (porque es un hash md5 viejo)
        if (!$login_exitoso && md5($pass) === $row['password']) {
            $login_exitoso = true;
        }

        if ($login_exitoso) {
            $_SESSION['cliente_id'] = $row['id'];
            $_SESSION['cliente_nombre'] = $row['nombre'];
            echo json_encode(["success" => true, "nombre" => $row['nombre']]); 
            exit;
        }
    }
    echo json_encode(["error" => "Teléfono o contraseña incorrectos."]); 
    exit;
}

// 3. VERIFICAR SESIÓN
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
                "calle_colonia" => $user['calle_colonia'], 
                "numero" => $user['numero'],
                "interior" => $user['interior'],
                "referencias" => $user['referencias']
            ]);
        } else {
            echo json_encode(["logged_in" => false]);
        }
    } else {
        echo json_encode(["logged_in" => false]);
    }
    exit;
}

// 4. LOGOUT
if ($action === 'logout') {
    session_destroy();
    echo json_encode(["success" => true]); 
    exit;
}
?>
