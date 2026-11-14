/* =========================================
   VARIABLES GLOBALES
   ========================================= */
let MENU_DATA = [];
let carrito = JSON.parse(localStorage.getItem('carrito')) || {}; 
let itemEnPersonalizacion = null;
let clienteData = null;
let costoEnvioActual = 0;

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
   MODO OSCURO Y OJITO DE CONTRASEÑA
   ========================================= */
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    document.getElementById('theme-btn').innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    localStorage.setItem('darkMode', isDark);
}

function togglePassword(inputId, icon) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function mostrarOtraColonia() {
    const select = document.getElementById('reg-colonia');
    const grupoOtra = document.getElementById('grupo-otra-colonia');
    const inputOtra = document.getElementById('reg-otra-colonia');

    if (select.value === 'Otra') {
        grupoOtra.classList.remove('hidden');
        inputOtra.required = true;
    } else {
        grupoOtra.classList.add('hidden');
        inputOtra.required = false;
        inputOtra.value = '';
    }
}

/* =========================================
   LÓGICA DE SESIÓN Y MIS COMPRAS
   ========================================= */
async function checkSession() {
    try {
        const res = await fetch('api/clientes.php?action=check_session', { credentials: 'include' });
        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } catch (err) { return console.error("PHP Error:", text); }
        
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
    } catch (e) { console.error("Error de sesión:", e); }
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
        catch (err) { console.error("PHP Error:", text); return alert("Error en el servidor."); }

        if (data.success) { window.location.reload(); } 
        else { alert(data.error || "Error al iniciar sesión"); }
    } catch(e) { alert("Error de red: " + e.message); }
}

async function registerCliente() {
    let coloniaFinal = document.getElementById('reg-colonia').value;
    if (coloniaFinal === 'Otra') {
        coloniaFinal = document.getElementById('reg-otra-colonia').value.trim();
        if (!coloniaFinal) return alert("Por favor, escribe tu colonia.");
    }

    const payload = {
        nombre: document.getElementById('reg-nombre').value,
        telefono: document.getElementById('reg-tel').value,
        password: document.getElementById('reg-pass').value,
        colonia: coloniaFinal, 
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
        catch (err) { console.error("PHP Error:", text); return alert("Error en el servidor."); }

        if (data.success) { window.location.reload(); } 
        else { alert(data.error || "Error al registrarse"); }
    } catch(e) { alert("Error de red: " + e.message); }
}

async function cerrarSesionCliente() {
    await fetch('api/clientes.php?action=logout', { credentials: 'include' });
    window.location.reload();
}

async function cargarMisCompras() {
    const contenedor = document.getElementById('historial-compras');
    contenedor.style.display = 'block';
    contenedor.innerHTML = '<p style="text-align:center; color:var(--texto-muted);">Cargando historial...</p>';

    try {
        const res = await fetch('api/mis_pedidos.php', { credentials: 'include' });
        const text = await res.text();
        let pedidos;
        try { pedidos = JSON.parse(text); } 
        catch (err) { contenedor.innerHTML = `<p style="color:red; text-align:center;">Error al cargar historial.</p>`; return; }

        if (pedidos.error) { contenedor.innerHTML = `<p style="color:red; text-align:center;">${pedidos.error}</p>`; return; }
        if (pedidos.length === 0) { contenedor.innerHTML = '<p style="text-align:center; color:var(--texto-muted);">Aún no tienes compras registradas.</p>'; return; }

        let html = '<h4 style="color:var(--texto-main); margin-bottom:15px; border-bottom: 2px solid var(--border-color); padding-bottom: 10px;">Tus Pedidos Recientes</h4>';
        
        pedidos.forEach(p => {
            let itemsLimpios = (p.items && p.items !== 'null') ? p.items : 'Sin detalles';
            itemsLimpios = itemsLimpios.replace(/null/gi, 'Platillo'); 
            const folio = (p.id && p.id !== 'null') ? p.id : 'S/N';
            const fecha = (p.fecha && p.fecha !== 'null') ? p.fecha : 'Fecha no disponible';
            const total = (p.total && p.total !== 'null') ? parseFloat(p.total).toFixed(2) : '0.00';
            const direccion = (p.direccion_entrega && p.direccion_entrega !== 'null') ? p.direccion_entrega : '';

            // Se eliminó por completo la lógica del estado (colorEstado, etc.)
            
            html += `
            <div class="info-card" style="margin-bottom: 15px; padding: 15px; border-left: 4px solid var(--dorado);">
                
                <!-- Cabecera: Folio y Fecha -->
                <div style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom:1px dashed var(--border-color); padding-bottom:8px;">
                    <strong style="color:var(--texto-main); font-size: 1.1rem;">Folio #${folio}</strong>
                    <small style="color:var(--texto-muted);">${fecha}</small>
                </div>
                
                <!-- Lista de Platillos -->
                <div style="font-size: 0.95rem; color: var(--texto-main); margin-bottom: 12px; line-height: 1.6;">
                    <strong style="font-size: 0.85rem; color: var(--texto-muted); text-transform: uppercase;">Lo que pediste:</strong><br>
                    ${itemsLimpios}
                </div>

                <!-- Dirección de Entrega -->
                ${direccion ? `<div style="font-size: 0.85rem; color: var(--texto-muted); margin-bottom: 12px;"><i class="fa-solid fa-location-dot"></i> Entrega en: ${direccion}</div>` : ''}
                
                <!-- Footer: Solo el Total -->
                <div style="display:flex; justify-content:flex-end; align-items:center; font-size: 0.9rem; margin-top: 15px; padding-top: 10px; border-top: 1px dashed var(--border-color);">
                    <strong style="color:var(--verde); font-size:1.2rem;">Total: $${total}</strong>
                </div>
            </div>`;
        });
        contenedor.innerHTML = html;
    } catch (e) { contenedor.innerHTML = '<p style="color:red; text-align:center;">Error de conexión.</p>'; }
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

/* =========================================
   MENÚ Y CARRITO
   ========================================= */
async function fetchMenu() {
    try {
        const res = await fetch('api/menu.php');
        MENU_DATA = await res.json();
        cargarMenu();
    } catch (e) { document.getElementById('contenedor-menu').innerHTML = "<p>Error al cargar el menú.</p>"; }
}

function cargarMenu() {
    const contenedor = document.getElementById('contenedor-menu');
    if (!MENU_DATA || MENU_DATA.length === 0) { contenedor.innerHTML = "<p style='text-align:center; width:100%;'>No hay platillos disponibles.</p>"; return; }
    contenedor.innerHTML = MENU_DATA.map(platillo => {
        const enCarrito = Object.values(carrito).filter(item => item.id == platillo.id).reduce((sum, item) => sum + item.cantidad, 0);
        const textoBoton = enCarrito > 0 ? `Agregar (${enCarrito})` : `Agregar`;
        const claseBoton = enCarrito > 0 ? 'add-btn btn-added' : 'add-btn';
        const nombreFinal = (platillo.nombre && platillo.nombre !== 'null') ? platillo.nombre : 'Platillo';
        const descFinal = (platillo.descripcion && platillo.descripcion !== 'null') ? platillo.descripcion : 'Delicioso platillo.';
        const imgFinal = (platillo.imagen_url && platillo.imagen_url !== 'null') ? platillo.imagen_url : 'https://images.unsplash.com/photo-1544025162-811114215b2b';

        return `
        <div class="card-food" data-cat="${platillo.categoria}">
            <img src="${imgFinal}" alt="${nombreFinal}" onerror="this.src='https://images.unsplash.com/photo-1544025162-811114215b2b'">
            <div class="card-food-body">
                <h3>${nombreFinal}</h3>
                <p>${descFinal}</p>
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
    } else { agregarDirecto(platillo, []); }
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
    let nombreBase = platillo.nombre || 'Platillo';
    const nombreCompleto = nombreBase + (selecciones.length > 0 ? ` (${selecciones.join(', ')})` : '');
    const key = platillo.id + (selecciones.length > 0 ? '_' + selecciones.join('_') : '');
    if (carrito[key]) { carrito[key].cantidad++; } 
    else { carrito[key] = { ...platillo, nombreMostrar: nombreCompleto, cantidad: 1 }; }
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

function calcularEnvio() {
    const coloniaSelect = document.getElementById('del-colonia');
    if (!coloniaSelect) return;
    
    const colonia = coloniaSelect.value;
    
    // ZONAS Y COSTOS
    if (colonia === 'Centro' || colonia === 'Barrio del Zapote' || colonia === 'Barrio de la Cruz') {
        costoEnvioActual = 30;
    } else if (colonia === 'Benito Juárez' || colonia === 'Emiliano Zapata') {
        costoEnvioActual = 50;
    } else if (colonia === 'Lázaro Cárdenas' || colonia === 'Otra') {
        costoEnvioActual = 80;
    } else {
        costoEnvioActual = 0; 
    }
    
    let totalPlatillos = Object.values(carrito).reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    let granTotal = totalPlatillos + costoEnvioActual;
    
    document.getElementById('cart-total').innerText = `Total: $${granTotal.toFixed(2)} (Envío: $${costoEnvioActual})`;
}

function abrirCarrito() {
    if(Object.keys(carrito).length === 0) return alert("El carrito está vacío");
    if (!clienteData) { mostrarAvisoLogin(); return; }

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
    
    if (clienteData) {
        document.getElementById('del-tel').value = clienteData.telefono || '';
        document.getElementById('del-calle').value = clienteData.calle_colonia || '';
        document.getElementById('del-num').value = clienteData.numero || ''; 
        document.getElementById('del-notas').value = clienteData.referencias || '';
        
        const delColonia = document.getElementById('del-colonia');
        if(delColonia && clienteData.colonia) {
            for(let i=0; i<delColonia.options.length; i++) {
                if(delColonia.options[i].value === clienteData.colonia) {
                    delColonia.selectedIndex = i;
                    break;
                }
            }
            calcularEnvio();
        } else {
            document.getElementById('cart-total').innerText = `Total: $${total.toFixed(2)}`;
        }
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
    if (!clienteData) { mostrarAvisoLogin(); return; }
    
    const metodo = document.getElementById('payment-method').value;
    if (metodo === 'Tarjeta de Crédito' || metodo === 'Tarjeta de Débito') {
        document.getElementById('payment-step-1').classList.add('hidden');
        document.getElementById('payment-step-card').classList.remove('hidden');
        document.getElementById('card-form-title').innerHTML = `<i class="fa-solid fa-credit-card"></i> Datos de ${metodo}`;
    } else { procesarPago(null); }
}

function volverAPaso1() {
    document.getElementById('payment-step-card').classList.add('hidden');
    document.getElementById('payment-step-1').classList.remove('hidden');
}

async function procesarPago(event) {
    const metodo = document.getElementById('payment-method').value;
    const carritoGuardado = JSON.parse(JSON.stringify(carrito)); 
    let subtotal = Object.values(carritoGuardado).reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    let granTotal = subtotal + costoEnvioActual;
    
    const telEntrega = document.getElementById('del-tel').value.trim();
    const calleEntrega = document.getElementById('del-calle').value.trim();
    const numEntrega = document.getElementById('del-num').value.trim(); 
    const notasEntrega = document.getElementById('del-notas').value.trim();

    if(!telEntrega || !calleEntrega || !numEntrega) {
        return alert("Por favor, llena el teléfono, la calle y el número.");
    }

    const direccionCompleta = `${calleEntrega} #${numEntrega}`;
    const payload = { 
        total: granTotal, 
        costo_envio: costoEnvioActual,
        metodo_pago: metodo, 
        carrito: Object.values(carritoGuardado), 
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
        catch (err) { alert("Error en el servidor al procesar pago."); btn.innerHTML = textoOriginal; btn.disabled = false; return; }

        if (data.success) {
            carrito = {};
            localStorage.removeItem('carrito');
            actualizarBotonCarrito();
            cerrarCarrito();
            
            const numFolio = data.pedido_id;
            const fechaActual = new Date().toLocaleString();
            
            document.getElementById('ticket-folio').innerText = `#${numFolio}`;
            document.getElementById('ticket-fecha').innerText = fechaActual;
            document.getElementById('ticket-nombre').innerText = clienteData.nombre;
            document.getElementById('ticket-gracias-nombre').innerText = clienteData.nombre;
            document.getElementById('ticket-tel').innerText = telEntrega;
            document.getElementById('ticket-dir').innerText = direccionCompleta; 
            document.getElementById('ticket-metodo').innerText = metodo;
            
            document.getElementById('ticket-subtotal').innerText = `$${subtotal.toFixed(2)}`;
            document.getElementById('ticket-envio').innerText = `$${costoEnvioActual.toFixed(2)}`;
            document.getElementById('ticket-total').innerText = `$${granTotal.toFixed(2)}`;
            
            let itemsHtml = '';
            Object.values(carritoGuardado).forEach(item => {
                itemsHtml += `<p>${item.cantidad}x ${item.nombreMostrar} - $${(item.precio * item.cantidad).toFixed(2)}</p>`;
            });
            document.getElementById('ticket-items').innerHTML = itemsHtml;

            if(notasEntrega) {
                document.getElementById('ticket-items').innerHTML += `<br><p style="font-size:10px;"><strong>Notas:</strong> ${notasEntrega}</p>`;
            }

            document.getElementById('ticket-modal').classList.remove('hidden');
        } else {
            alert(data.error || "Error al procesar el pago");
            btn.innerHTML = textoOriginal;
            btn.disabled = false;
        }
    } catch (e) { 
        alert("Error de red."); 
        btn.innerHTML = textoOriginal;
        btn.disabled = false;
    }
}

function descargarTicketPDF() {
    const element = document.getElementById('ticket-pdf-area');
    const numFolio = document.getElementById('ticket-folio').innerText.replace('#', '');
    const opt = { margin: 0.5, filename: `Ticket_Saberes_${numFolio}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } };
    html2pdf().set(opt).from(element).save();
}

/* =========================================
   NARRADOR
   ========================================= */
let reproduciendoNarracion = false;
let sintetizador = window.speechSynthesis;
let utterance = null;

function obtenerVozDeCalidad() {
    const voces = sintetizador.getVoices();
    const vocesEspanol = voces.filter(voz => voz.lang.includes('es'));
    const vozPremium = vocesEspanol.find(v => v.name.toLowerCase().includes('neural') || v.name.toLowerCase().includes('premium') || v.name.toLowerCase().includes('natural'));
    if (vozPremium) return vozPremium;
    const nombresBuenos = ['Paulina', 'Sabina', 'Mónica', 'Monica', 'Helena', 'Luciana', 'Google español'];
    for (let nombre of nombresBuenos) {
        const encontrada = vocesEspanol.find(v => v.name.includes(nombre));
        if (encontrada) return encontrada;
    }
    return vocesEspanol.length > 0 ? vocesEspanol[0] : null;
}

function controlarNarrador() {
    const btn = document.getElementById('btn-narrador');
    const texto = document.getElementById('texto-narracion').innerText;
    if (!('speechSynthesis' in window)) { alert("Tu navegador no soporta la narración."); return; }
    if (reproduciendoNarracion) {
        sintetizador.cancel();
        reproduciendoNarracion = false;
        btn.innerHTML = '<i class="fa-solid fa-volume-high"></i> Escuchar Historia';
        btn.classList.remove('playing');
        return;
    }
    utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'es-MX';
    utterance.rate = 0.85; 
    utterance.pitch = 1.0; 
    const vozElegida = obtenerVozDeCalidad();
    if (vozElegida) utterance.voice = vozElegida;
    utterance.onend = function() {
        reproduciendoNarracion = false;
        btn.innerHTML = '<i class="fa-solid fa-volume-high"></i> Escuchar Historia';
        btn.classList.remove('playing');
    };
    sintetizador.speak(utterance);
    reproduciendoNarracion = true;
    btn.innerHTML = '<i class="fa-solid fa-stop"></i> Detener Narración';
    btn.classList.add('playing');
}
if (speechSynthesis.onvoiceschanged !== undefined) { speechSynthesis.onvoiceschanged = obtenerVozDeCalidad; }

/* =========================================
   AVISO DE LOGIN
   ========================================= */
function mostrarAvisoLogin() {
    if (document.getElementById('login-warning-modal')) return;
    const modalHTML = `
        <div id="login-warning-modal" class="modal-overlay">
            <div class="modal-content" style="text-align: center; border-radius: 20px; max-width: 400px; margin: auto;">
                <i class="fa-solid fa-lock" style="font-size: 3.5rem; color: var(--dorado); margin-bottom: 15px;"></i>
                <h3 style="color: var(--texto-main); margin-bottom: 10px; font-family: Georgia, serif;">Inicia Sesión</h3>
                <p style="color: var(--texto-muted); margin-bottom: 25px; font-size: 1rem; line-height: 1.5;">Para ver tu carrito y realizar tu pedido, primero necesitas iniciar sesión o crear una cuenta.</p>
                <button class="btn btn-primary full-width" onclick="window.location.href='login.html'"><i class="fa-solid fa-arrow-right-to-bracket"></i> Ir a Iniciar Sesión</button>
                <button class="btn btn-secondary full-width mt-10" onclick="cerrarModalAviso()">Seguir explorando</button>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}
function cerrarModalAviso() {
    const modal = document.getElementById('login-warning-modal');
    if (modal) modal.remove();
}
