<?php
// 1. Iniciar sesión y configurar cabeceras
session_start();
header('Content-Type: application/json; charset=utf-8');
error_reporting(0); // Ocultar advertencias para no romper el JSON

require 'conexion.php';
$link = Conectarse();

$action = isset($_GET['action']) ? $_GET['action'] : '';

// 2. REGISTRO DE NUEVOS USUARIOS
if ($action === 'register') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validar que lleguen los datos
    if (!$data || empty($data['telefono']) || empty($data['password'])) {
        echo json_encode(["error" => "Faltan datos obligatorios."]); exit;
    }

    $nombre = mysqli_real_escape_string($link, $data['nombre']);
    $telefono = mysqli_real_escape_string($link, $data['telefono']);
    $pass = $data['password'];
    $calle = mysqli_real_escape_string($link, $data['calle']);
    $numero = mysqli_real_escape_string($link, $data['numero']);
    $interior = mysqli_real_escape_string($link, $data['interior']);
    $referencias = mysqli_real_escape_string($link, $data['referencias']);

    // Verificar si el teléfono ya existe
    $check = mysqli_query($link, "SELECT id FROM clientes WHERE telefono = '$telefono'");
    if ($check && mysqli_num_rows($check) > 0) {
        echo json_encode(["error" => "Este número de teléfono ya está registrado."]); 
        exit;
    }

    // Encriptar contraseña (Compatible con PHP viejo)
    if (function_exists('password_hash')) {
        $pass_encriptada = password_hash($pass, PASSWORD_DEFAULT);
    } else {
        // Respaldo por si el Wamp es muy viejo
        $pass_encriptada = md5($pass); 
    }

    // Insertar en la base de datos
    $query = "INSERT INTO clientes (nombre, telefono, password, calle, numero, interior, referencias) 
              VALUES ('$nombre', '$telefono', '$pass_encriptada', '$calle', '$numero', '$interior', '$referencias')";
    
    if (mysqli_query($link, $query)) {
        // Iniciar sesión automáticamente
        $_SESSION['cliente_id'] = mysqli_insert_id($link);
        $_SESSION['cliente_nombre'] = $nombre;
        echo json_encode(["success" => true, "nombre" => $nombre]);
    } else {
        // Si falla el SQL, devolvemos el error exacto
        echo json_encode(["error" => "Error de Base de Datos: " . mysqli_error($link)]);
    }
    exit;
}

// 3. INICIAR SESIÓN
if ($action === 'login') {
    $data = json_decode(file_get_contents('php://input'), true);
    $telefono = mysqli_real_escape_string($link, $data['telefono']);
    $pass = $data['password'];

    $query = "SELECT * FROM clientes WHERE telefono = '$telefono'";
    $resultado = mysqli_query($link, $query);

    if ($resultado && mysqli_num_rows($resultado) > 0) {
        $row = mysqli_fetch_assoc($resultado);
        
        $login_exitoso = false;
        // Verificar contraseña moderna
        if (function_exists('password_verify')) {
            $login_exitoso = password_verify($pass, $row['password']);
        }
        // Respaldo para contraseñas viejas o md5
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

// 4. VERIFICAR SESIÓN
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
                "calle" => $user['calle'],
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

// 5. CERRAR SESIÓN
if ($action === 'logout') {
    session_destroy();
    echo json_encode(["success" => true]); 
    exit;
}
?>