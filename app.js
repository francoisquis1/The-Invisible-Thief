// === INVISIBLE THIEF - MULTIPLAYER GAME ===
// Usando PeerJS para conexión P2P

// --- CONFIGURACIÓN DE RED ---
const peer = new Peer();
let conn = null;

// --- ESTADO DEL JUEGO ---
let myRole = null;
let thiefPos = null;
let turn = 'thief';
let gameActive = false;

// --- INICIALIZACIÓN PEERJS ---
peer.on('open', (id) => {
    document.getElementById('my-id').innerText = id;
    console.log('Mi ID:', id);
});

peer.on('connection', (c) => {
    conn = c;
    setupConnection();
    updateStatus('¡Jugador conectado! Ambos pueden elegir rol.');
});

// --- CONECTAR CON AMIGO ---
function connectToFriend() {
    const remoteId = document.getElementById('remote-id').value.trim();
    if (!remoteId) {
        alert('Pega el ID de tu amigo');
        return;
    }
    
    conn = peer.connect(remoteId);
    setupConnection();
}

// --- CONFIGURAR CONEXIÓN ---
function setupConnection() {
    conn.on('open', () => {
        console.log('Conexión establecida');
    });

    conn.on('data', (data) => {
        if (data.type === 'move') {
            // Detective recibe que ladrón se movió
            thiefPos = data.pos;
            turn = 'detective';
            updateStatus('¡Ladrón escondido! Tu turno, Detective 🕵️‍♂️');
        } 
        else if (data.type === 'guess') {
            // Ladrón recibe disparo
            const dist = calculateDistance(data.index, thiefPos);
            conn.send({ type: 'result', index: data.index, dist: dist });
            
            if (dist === 0) {
                updateStatus('¡TE ATRAPARON! Game Over 😱');
                gameActive = false;
            } else {
                updateStatus(`¡Fallaste! (Distancia: ${dist})`);
                turn = 'thief';
            }
        }
        else if (data.type === 'result') {
            // Detective recibe resultado
            showGuessResult(data.index, data.dist);
            if (data.dist === 0) {
                updateStatus('¡ATRAPASTE AL LADRÓN! 🎉');
                gameActive = false;
            } else {
                updateStatus(`Distancia: ${data.dist}. Espera su movimiento...`);
                turn = 'thief';
            }
        }
    });

    conn.on('error', (err) => {
        console.error('Error de conexión:', err);
        alert('Error en la conexión: ' + err);
    });
}

// --- ELEGIR ROL ---
function chooseRole(role) {
    if (!conn || !conn.open) {
        alert('Primero conéctate con un amigo');
        return;
    }
    
    myRole = role;
    gameActive = true;
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    
    const badge = role === 'thief' ? '🥷 LADRÓN' : '🕵️ DETECTIVE';
    document.getElementById('player-role-badge').innerText = badge;
    
    if (role === 'thief') {
        updateStatus('Elige tu escondite inicial');
        turn = 'thief';
    } else {
        updateStatus('Espera a que el ladrón se esconda...');
        turn = 'thief';
    }
    
    createBoard();
}

// --- CREAR TABLERO ---
function createBoard() {
    const board = document.getElementById('board');
    board.innerHTML = '';
    
    for (let i = 0; i < 16; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;
        cell.onclick = () => handleCellClick(i);
        board.appendChild(cell);
    }
}

// --- MANEJAR CLICK EN CELDA ---
function handleCellClick(idx) {
    if (!gameActive || !conn || !conn.open) return;
    
    if (myRole === 'thief' && turn === 'thief') {
        // Ladrón se esconde
        thiefPos = idx;
        
        // Marcar visualmente (solo para el ladrón)
        document.querySelectorAll('.cell').forEach(c => c.classList.remove('thief-here'));
        document.querySelector(`[data-index="${idx}"]`).classList.add('thief-here');
        
        // Enviar al detective
        conn.send({ type: 'move', pos: idx });
        
        turn = 'detective';
        updateStatus('¡Te escondiste! Espera el disparo del detective...');
    } 
    else if (myRole === 'detective' && turn === 'detective') {
        // Detective dispara
        conn.send({ type: 'guess', index: idx });
        updateStatus('Disparaste... esperando resultado...');
        turn = 'thief';
    }
}

// --- CALCULAR DISTANCIA ---
function calculateDistance(idx1, idx2) {
    const x1 = idx1 % 4, y1 = Math.floor(idx1 / 4);
    const x2 = idx2 % 4, y2 = Math.floor(idx2 / 4);
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

// --- MOSTRAR RESULTADO DEL DISPARO ---
function showGuessResult(idx, dist) {
    const cell = document.querySelector(`[data-index="${idx}"]`);
    cell.classList.add('guessed');
    cell.textContent = dist;
}

// --- ACTUALIZAR ESTADO ---
function updateStatus(msg) {
    document.getElementById('game-status').innerText = msg;
}
