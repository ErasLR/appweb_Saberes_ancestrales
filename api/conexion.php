<?php
function Conectarse() {
    $link = mysqli_connect("localhost", "root", "", "saberes_vainilla");
    if(!$link) { 
        die(json_encode(["error" => "Error de conexión a la base de datos"])); 
    }
    return $link;
}
?>