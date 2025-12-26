<<<<<<< HEAD
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
=======
const peer = new Peer();
let conn;
let myRole = null;
let thiefPos = null;
let turn = 'thief';
>>>>>>> 256f3d9d12ff04d10b3f35f966e9a8db2a41f2b0

peer.on('open', (id) => document.getElementById('my-id').innerText = id);

peer.on('connection', (c) => {
    conn = c;
    setupData();
    alert("¡Amigo conectado!");
});

function connectToFriend() {
    const rId = document.getElementById('remote-id').value;
    conn = peer.connect(rId);
    setupData();
}

function setupData() {
    conn.on('data', (data) => {
        if (data.type === 'move') {
            thiefPos = data.pos;
            updateStatus("Ladrón oculto. ¡Tu turno, Detective!");
            turn = 'detective';
        }
        if (data.type === 'guess') {
            processGuess(data.index);
        }
        if (data.type === 'result') {
            showGuessResult(data.index, data.dist);
        }
    });
}

function chooseRole(role) {
    myRole = role;
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('player-role-badge').innerText = role.toUpperCase();
    createBoard();
}

function createBoard() {
    const board = document.getElementById('board');
    for (let i = 0; i < 16; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.onclick = () => handleClick(i);
        cell.id = `cell-${i}`;
        board.appendChild(cell);
    }
}

<<<<<<< HEAD
function handleCellClick(index) {
    if (!conn || !conn.open) return alert("Primero conéctate con un amigo");
    if (!myRole) return alert("Primero elige tu rol");

    // LÓGICA DEL LADRÓN
=======
function handleClick(i) {
    if (!conn) return alert("Conecta con un amigo primero");
    
>>>>>>> 256f3d9d12ff04d10b3f35f966e9a8db2a41f2b0
    if (myRole === 'thief' && turn === 'thief') {
        thiefPos = i;
        conn.send({ type: 'move', pos: i });
        document.querySelectorAll('.cell').forEach(c => c.classList.remove('thief-here'));
        document.getElementById(`cell-${i}`).classList.add('thief-here');
        updateStatus("Te has escondido...");
        turn = 'detective';
<<<<<<< HEAD
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
=======
    } else if (myRole === 'detective' && turn === 'detective') {
        conn.send({ type: 'guess', index: i });
>>>>>>> 256f3d9d12ff04d10b3f35f966e9a8db2a41f2b0
        turn = 'thief';
    }
}

function processGuess(idx) {
    const dist = calculateDist(idx, thiefPos);
    conn.send({ type: 'result', index: idx, dist: dist });
    showGuessResult(idx, dist);
}

function calculateDist(i1, i2) {
    return Math.abs((i1 % 4) - (i2 % 4)) + Math.abs(Math.floor(i1 / 4) - Math.floor(i2 / 4));
}

function showGuessResult(idx, dist) {
    const cell = document.getElementById(`cell-${idx}`);
    cell.classList.add('guessed');
    cell.innerText = dist;
    updateStatus(dist === 0 ? "¡ATRAPADO!" : `Distancia: ${dist}. Turno Ladrón.`);
    turn = 'thief';
}

function updateStatus(msg) { document.getElementById('game-status').innerText = msg; }