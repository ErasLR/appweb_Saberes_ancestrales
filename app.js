/* =========================================
   VARIABLES GLOBALES
   ========================================= */
let MENU_DATA = [];
let carrito = JSON.parse(localStorage.getItem('carrito')) || {}; 
let itemEnPersonalizacion = null;
let clienteData = null;

/* =========================================
   INICIALIZACIÓN
   ========================================= */
window.onload = function() {
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        if(document.getElementById('theme-btn')) document.getElementById('theme-btn').innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
    
    checkSession();
    
    if (document.getElementById('contenedor-menu')) fetchMenu();
    if (document.getElementById('cart-count')) actualizarBotonCarrito();
};

/* =========================================
   MODO OSCURO
   ========================================= */
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    document.getElementById('theme-btn').innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    localStorage.setItem('darkMode', isDark);
}

/* =========================================
   LÓGICA DE SESIÓN (LOGIN / REGISTRO)
   ========================================= */
async function checkSession() {
    try {
        const res = await fetch('api/clientes.php?action=check_session', { credentials: 'include' });
        const text = await res.text();
        
        let data;
        try { data = JSON.parse(text); } 
        catch (err) { return console.error("PHP devolvió esto (No es JSON):", text); }
        
        if (data.logged_in) {
            clienteData = data; 
            if (document.getElementById('auth-guest')) {
                document.getElementById('auth-guest').classList.add('hidden');
                document.getElementById('auth-user').classList.remove('hidden');
                document.getElementById('user-name-display').innerText = data.nombre;
            }
        } else {
            if (document.getElementById('auth-guest')) {
                document.getElementById('auth-guest').classList.remove('hidden');
                document.getElementById('auth-user').classList.add('hidden');
                document.getElementById('auth-initial-view').classList.remove('hidden');
                document.getElementById('form-login').classList.add('hidden');
                document.getElementById('form-register').classList.add('hidden');
            }
        }
    } catch (e) { 
        console.error("Error de sesión:", e); 
    }
}

function mostrarForm(tipo) {
    document.getElementById('auth-initial-view').classList.add('hidden');
    document.getElementById('form-login').classList.add('hidden');
    document.getElementById('form-register').classList.add('hidden');
    document.getElementById(`form-${tipo}`).classList.remove('hidden');
    document.querySelector('.app-content').scrollTop = 0;
}

function volverAlInicioAuth() {
    document.getElementById('auth-initial-view').classList.remove('hidden');
    document.getElementById('form-login').classList.add('hidden');
    document.getElementById('form-register').classList.add('hidden');
}

async function loginCliente() {
    const tel = document.getElementById('log-tel').value;
    const pass = document.getElementById('log-pass').value;
    if(!tel || !pass) return alert("Llena todos los campos");

    try {
        const res = await fetch('api/clientes.php?action=login', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telefono: tel, password: pass }),
            credentials: 'include'
        });
        
        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } 
        catch (err) { return alert("Error en el servidor: " + text.substring(0, 200)); }

        if (data.success) { window.location.reload(); } 
        else { alert(data.error || "Error al iniciar sesión"); }
    } catch(e) { alert("Error de red: " + e.message); }
}

async function registerCliente() {
    const payload = {
        nombre: document.getElementById('reg-nombre').value,
        telefono: document.getElementById('reg-tel').value,
        password: document.getElementById('reg-pass').value,
        calle: document.getElementById('reg-calle').value, 
        numero: document.getElementById('reg-num').value,
        interior: document.getElementById('reg-int').value,
        referencias: document.getElementById('reg-ref').value
    };
    
    try {
        const res = await fetch('api/clientes.php?action=register', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            credentials: 'include'
        });
        
        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } 
        catch (err) { return alert("Error en el servidor: " + text.substring(0, 200)); }

        if (data.success) { window.location.reload(); } 
        else { alert(data.error || "Error al registrarse"); }
    } catch(e) { alert("Error de red: " + e.message); }
}

async function cerrarSesionCliente() {
    await fetch('api/clientes.php?action=logout', { credentials: 'include' });
    window.location.reload();
}

/* =========================================
   MENÚ
   ========================================= */
async function fetchMenu() {
    try {
        const res = await fetch('api/menu.php');
        MENU_DATA = await res.json();
        cargarMenu();
    } catch (e) {
        document.getElementById('contenedor-menu').innerHTML = "<p>Error al cargar el menú.</p>";
    }
}

function cargarMenu() {
    const contenedor = document.getElementById('contenedor-menu');
    contenedor.innerHTML = MENU_DATA.map(platillo => {
        const enCarrito = Object.values(carrito).filter(item => item.id == platillo.id).reduce((sum, item) => sum + item.cantidad, 0);
        const textoBoton = enCarrito > 0 ? `Agregar (${enCarrito})` : `Agregar`;
        const claseBoton = enCarrito > 0 ? 'add-btn btn-added' : 'add-btn';
        
        return `
        <div class="card-food" data-cat="${platillo.categoria}">
            <img src="${platillo.imagen_url}" alt="${platillo.nombre}">
            <div class="card-food-body">
                <h3>${platillo.nombre}</h3>
                <p>${platillo.descripcion}</p>
                <span class="card-food-price">$${parseFloat(platillo.precio).toFixed(2)}</span>
                <button class="${claseBoton}" onclick="agregarAlCarrito(${platillo.id})">${textoBoton}</button>
            </div>
        </div>`;
    }).join('');
}

function filtrarMenu(categoria, btn) {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.card-food').forEach(card => {
        card.style.display = (categoria === 'Todas' || card.dataset.cat === categoria) ? 'flex' : 'none';
    });
}

/* =========================================
   CARRITO Y PERSONALIZACIÓN
   ========================================= */
function agregarAlCarrito(id) {
    const platillo = MENU_DATA.find(p => p.id == id);
    
    if (platillo.opciones && platillo.opciones.length > 0) {
        itemEnPersonalizacion = platillo;
        document.getElementById('custom-title').innerText = platillo.nombre;
        document.getElementById('custom-options').innerHTML = platillo.opciones.map((op, index) => `
            <div class="custom-group"><p><strong>${op.nombre}</strong></p>
                ${op.valores.map((val, i) => `
                    <label class="radio-label"><input type="radio" name="opcion_${index}" value="${val}" ${i === 0 ? 'checked' : ''}> ${val}</label>
                `).join('')}
            </div>
        `).join('');
        document.getElementById('custom-modal').classList.remove('hidden');
    } else {
        agregarDirecto(platillo, []);
    }
}

function confirmarCustomizacion() {
    if(!itemEnPersonalizacion) return;
    const selecciones = [];
    itemEnPersonalizacion.opciones.forEach((op, index) => {
        const selected = document.querySelector(`input[name="opcion_${index}"]:checked`);
        if(selected) selecciones.push(selected.value);
    });
    agregarDirecto(itemEnPersonalizacion, selecciones);
    document.getElementById('custom-modal').classList.add('hidden');
    itemEnPersonalizacion = null;
}

function agregarDirecto(platillo, selecciones) {
    const key = platillo.id + (selecciones.length > 0 ? '_' + selecciones.join('_') : '');
    const nombreCompleto = platillo.nombre + (selecciones.length > 0 ? ` (${selecciones.join(', ')})` : '');
    
    if (carrito[key]) { 
        carrito[key].cantidad++; 
    } else { 
        carrito[key] = { ...platillo, nombreMostrar: nombreCompleto, cantidad: 1 }; 
    }
    
    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarBotonCarrito();
    
    if (document.getElementById('contenedor-menu')) cargarMenu();
    if (!document.getElementById('cart-modal').classList.contains('hidden')) abrirCarrito();
}

function actualizarBotonCarrito() {
    if(!document.getElementById('cart-count')) return;
    const count = Object.values(carrito).reduce((sum, item) => sum + item.cantidad, 0);
    document.getElementById('cart-count').innerText = count;
}

function abrirCarrito() {
    if(Object.keys(carrito).length === 0) return alert("El carrito está vacío");
    
    document.getElementById('payment-step-1').classList.remove('hidden');
    document.getElementById('payment-step-card').classList.add('hidden');

    const list = document.getElementById('cart-items');
    let total = 0;
    list.innerHTML = '';
    
    Object.keys(carrito).forEach(key => {
        const item = carrito[key];
        const sub = item.precio * item.cantidad;
        total += sub;
        list.innerHTML += `
            <div class="cart-item">
                <div class="cart-item-info"><span>${item.nombreMostrar}</span><strong>$${sub.toFixed(2)}</strong></div>
                <div class="cart-item-controls">
                    <button class="qty-btn" onclick="disminuirCantidad('${key}')"><i class="fa-solid fa-minus"></i></button>
                    <span class="qty-number">${item.cantidad}</span>
                    <button class="qty-btn" onclick="aumentarCantidad('${key}')"><i class="fa-solid fa-plus"></i></button>
                    <button class="delete-btn" onclick="eliminarDelCarrito('${key}')"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>`;
    });
    document.getElementById('cart-total').innerText = `Total: $${total.toFixed(2)}`;
    
    if (clienteData) {
        document.getElementById('del-tel').value = clienteData.telefono || '';
        document.getElementById('del-calle').value = clienteData.calle_colonia || '';
        document.getElementById('del-num').value = clienteData.numero || ''; 
        document.getElementById('del-notas').value = clienteData.referencias || '';
    }

    document.getElementById('cart-modal').classList.remove('hidden');
}

function aumentarCantidad(key) { carrito[key].cantidad++; guardarCarritoYRecargar(); }
function disminuirCantidad(key) { carrito[key].cantidad--; if (carrito[key].cantidad <= 0) delete carrito[key]; guardarCarritoYRecargar(); }
function eliminarDelCarrito(key) { delete carrito[key]; guardarCarritoYRecargar(); }
function cerrarCarrito() { document.getElementById('cart-modal').classList.add('hidden'); }

function guardarCarritoYRecargar() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarBotonCarrito();
    if (Object.keys(carrito).length === 0) cerrarCarrito(); else abrirCarrito();
    if (document.getElementById('contenedor-menu')) cargarMenu();
}

/* =========================================
   FLUJO DE PAGO Y TICKET
   ========================================= */
function irAPago() {
    if (!clienteData) {
        alert("Debes iniciar sesión para continuar con el pedido.");
        window.location.href = 'login.html';
        return;
    }
    
    const metodo = document.getElementById('payment-method').value;
    
    if (metodo === 'Tarjeta de Crédito' || metodo === 'Tarjeta de Débito') {
        document.getElementById('payment-step-1').classList.add('hidden');
        document.getElementById('payment-step-card').classList.remove('hidden');
        document.getElementById('card-form-title').innerHTML = `<i class="fa-solid fa-credit-card"></i> Datos de ${metodo}`;
    } else {
        procesarPago(null); 
    }
}

function volverAPaso1() {
    document.getElementById('payment-step-card').classList.add('hidden');
    document.getElementById('payment-step-1').classList.remove('hidden');
}

async function procesarPago(event) {
    const metodo = document.getElementById('payment-method').value;
    const total = Object.values(carrito).reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    
    const telEntrega = document.getElementById('del-tel').value.trim();
    const calleEntrega = document.getElementById('del-calle').value.trim();
    const numEntrega = document.getElementById('del-num').value.trim(); 
    const notasEntrega = document.getElementById('del-notas').value.trim();

    if(!telEntrega || !calleEntrega || !numEntrega) {
        return alert("Por favor, llena el teléfono, la calle/colonia y el número exterior.");
    }

    const direccionCompleta = `${calleEntrega} #${numEntrega}`;

    const payload = { 
        total: total, 
        metodo_pago: metodo, 
        carrito: Object.values(carrito),
        telefono_entrega: telEntrega,
        direccion_entrega: direccionCompleta,
        notas_entrega: notasEntrega
    };

    let btn = (event && event.target) ? event.target : document.querySelector('#payment-step-1 .btn-primary');
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando...';
    btn.disabled = true;

    try {
        const res = await fetch('api/pedidos.php', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            credentials: 'include'
        });
        
        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } 
        catch (err) { return alert("Error en el servidor: " + text.substring(0, 200)); }

        if (data.success) {
            generarPDF(metodo, total, telEntrega, direccionCompleta, notasEntrega, data.pedido_id);
            
            carrito = {};
            localStorage.removeItem('carrito');
            actualizarBotonCarrito();
            cerrarCarrito();
            document.getElementById('ticket-modal').classList.remove('hidden');
        } else {
            alert(data.error || "Error al procesar el pago");
            btn.innerHTML = textoOriginal;
            btn.disabled = false;
        }
    } catch (e) { 
        alert("Error de red. Revisa que WampServer esté encendido."); 
        btn.innerHTML = textoOriginal;
        btn.disabled = false;
    }
}

function generarPDF(metodo, total, tel, dir, notas, folio) {
    const numFolio = folio ? folio : Math.floor(Math.random() * 10000);
    const fechaActual = new Date().toLocaleString();

    document.getElementById('ticket-folio').innerText = `#${numFolio}`;
    document.getElementById('ticket-fecha').innerText = fechaActual;
    document.getElementById('ticket-nombre').innerText = clienteData.nombre;
    document.getElementById('ticket-gracias-nombre').innerText = clienteData.nombre;
    document.getElementById('ticket-tel').innerText = tel;
    document.getElementById('ticket-dir').innerText = dir; 
    document.getElementById('ticket-metodo').innerText = metodo;
    document.getElementById('ticket-total').innerText = `$${total.toFixed(2)}`;
    
    let itemsHtml = '';
    Object.values(carrito).forEach(item => {
        itemsHtml += `<p>${item.cantidad}x ${item.nombreMostrar} - $${(item.precio * item.cantidad).toFixed(2)}</p>`;
    });
    document.getElementById('ticket-items').innerHTML = itemsHtml;

    if(notas) {
        document.getElementById('ticket-items').innerHTML += `<br><p style="font-size:10px;"><strong>Notas:</strong> ${notas}</p>`;
    }

    const element = document.getElementById('ticket-pdf-area');
    element.style.display = 'block';
    const opt = { 
        margin: 0.5, 
        filename: `Ticket_Saberes_${numFolio}.pdf`, 
        image: { type: 'jpeg', quality: 0.98 }, 
        html2canvas: { scale: 2 }, 
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } 
    };
    
    html2pdf().set(opt).from(element).save().then(() => { 
        element.style.display = 'none'; 
    });
}
