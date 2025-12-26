// --- CONFIGURACIÓN DE RED (PeerJS) ---
const peer = new Peer(); 
let conn = null;

// Referencias al DOM
const boardElement = document.getElementById('board');
const statusElement = document.getElementById('status');
const myIdDisplay = document.getElementById('my-id');
const remoteIdInput = document.getElementById('remote-id');

// --- VARIABLES DE ESTADO DEL JUEGO ---
const BOARD_SIZE = 16; // 4x4 = 16 celdas
let myRole = null;
let thiefPosition = null; 
let turn = 'thief'; // El ladrón siempre empieza escondiéndose
let gameStarted = false;

// --- INICIALIZACIÓN DE PEERJS ---

// Mostrar tu ID cuando se conecte al servidor de PeerJS
peer.on('open', (id) => {
    myIdDisplay.innerText = id;
});

// Escuchar cuando alguien intenta conectarse a ti (Tú eres el Host)
peer.on('connection', (connection) => {
    conn = connection;
    setupDataExchange();
    alert("¡Jugador conectado! Ya pueden empezar.");
});

// Función para conectar con tu amigo (Tú eres el Invitado)
function connectToFriend() {
    const remoteId = remoteIdInput.value;
    if (!remoteId) return alert("Pega el ID de tu amigo primero");
    
    conn = peer.connect(remoteId);
    setupDataExchange();
}

// Configurar qué pasa cuando recibes datos
function setupDataExchange() {
    conn.on('open', () => {
        console.log("Conexión establecida.");
    });

    conn.on('data', (data) => {
        if (data.type === 'move') {
            // El detective recibe el aviso de que el ladrón se movió
            thiefPosition = data.pos; 
            turn = 'detective';
            statusElement.innerText = "¡El Ladrón se ha movido! Tu turno, Detective.";
        } 
        else if (data.type === 'guess') {
            // El ladrón recibe el disparo del detective
            processGuess(data.index);
        }
    });
}

// --- LÓGICA DEL JUEGO ---

function chooseRole(role) {
    myRole = role;
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('player-role').innerText = `Rol: ${role === 'thief' ? 'Ladrón 🥷' : 'Detective 🕵️‍♂️'}`;
    
    if (role === 'thief') {
        statusElement.innerText = "Elige tu escondite inicial";
    } else {
        statusElement.innerText = "Espera a que el ladrón se esconda...";
    }
}

function handleCellClick(index) {
    if (!conn || !conn.open) return alert("Primero conéctate con un amigo");
    if (!myRole) return alert("Primero elige tu rol");

    // LÓGICA DEL LADRÓN
    if (myRole === 'thief' && turn === 'thief') {
        thiefPosition = index;
        updateBoardVisuals();
        
        // Enviamos la posición al detective (aunque él no la vea, su app la necesita para calcular distancia)
        conn.send({ type: 'move', pos: index });
        
        turn = 'detective';
        statusElement.innerText = "¡Te has escondido! Turno del detective...";
    } 
    // LÓGICA DEL DETECTIVE
    else if (myRole === 'detective' && turn === 'detective') {
        // El detective envía su "disparo" al ladrón
        conn.send({ type: 'guess', index: index });
        statusElement.innerText = "Disparando... esperando respuesta del ladrón.";
        turn = 'thief'; // Cambia el turno localmente para esperar
    }
    else if (myRole === 'thief' && turn === 'detective') {
        statusElement.innerText = "Es turno del detective, espera su disparo...";
    }
    else if (myRole === 'detective' && turn === 'thief') {
        statusElement.innerText = "Es turno del ladrón, espera a que se mueva...";
    }
}

// El Ladrón procesa el disparo y le devuelve la distancia al Detective
function processGuess(index) {
    const distance = calculateDistance(index, thiefPosition);
    renderGuess(index, distance);
    
    if (distance === 0) {
        statusElement.innerText = "¡TE ATRAPARON! Fin del juego.";
        // Avisar victoria (opcional implementar más mensajes)
    } else {
        statusElement.innerText = `El Detective falló (distancia: ${distance}). ¡Muévete!`;
        turn = 'thief';
    }
}

function calculateDistance(idx1, idx2) {
    const x1 = idx1 % 4, y1 = Math.floor(idx1 / 4);
    const x2 = idx2 % 4, y2 = Math.floor(idx2 / 4);
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

function updateBoardVisuals() {
    document.querySelectorAll('.cell').forEach((cell, i) => {
        cell.classList.toggle('thief-here', myRole === 'thief' && i === thiefPosition);
    });
}

function renderGuess(index, dist) {
    const cell = document.querySelector(`[data-index="${index}"]`);
    cell.classList.add('guessed');
    cell.innerText = dist;
}

function createBoard() {
    for (let i = 0; i < BOARD_SIZE; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = i;
        cell.addEventListener('click', () => handleCellClick(i));
        boardElement.appendChild(cell);
    }
}

createBoard();