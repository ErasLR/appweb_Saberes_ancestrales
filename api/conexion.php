<?php
function Conectarse() {
    // Cambia "saberes_vainilla" si tu base de datos se llama diferente
    $link = mysqli_connect("localhost", "root", "", "saberes_vainilla");
    if(!$link) { 
        return false; 
    }
    return $link;
}
?>
