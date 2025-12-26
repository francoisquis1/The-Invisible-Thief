const peer = new Peer();
let conn;
let myRole = null;
let thiefPos = null;
let turn = 'thief';

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

function handleClick(i) {
    if (!conn) return alert("Conecta con un amigo primero");
    
    if (myRole === 'thief' && turn === 'thief') {
        thiefPos = i;
        conn.send({ type: 'move', pos: i });
        document.querySelectorAll('.cell').forEach(c => c.classList.remove('thief-here'));
        document.getElementById(`cell-${i}`).classList.add('thief-here');
        updateStatus("Te has escondido...");
        turn = 'detective';
    } else if (myRole === 'detective' && turn === 'detective') {
        conn.send({ type: 'guess', index: i });
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