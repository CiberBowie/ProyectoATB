const socket = io.connect('http://' + document.location.hostname + ':5000');
let current_session = null;

// Función para actualizar el estado de conexión
function updateConnectionStatus(connected, sessionId = null) {
    const statusText = document.getElementById('status-text');
    const currentSession = document.getElementById('current-session');
    
    statusText.textContent = connected ? 'Conectado ✅' : 'Desconectado ❌';
    currentSession.textContent = sessionId || 'Ninguna';
    
    // Cambiar color de fondo
    document.getElementById('connection-status').style.backgroundColor = connected ? '#e3f7e1' : '#ffe5e5';
}

// Eventos de conexión
/*socket.on('connect', () => {
    updateConnectionStatus(true, current_session);
});*/

socket.on('disconnect', () => {
    updateConnectionStatus(false);
});

// Unirse a sesión
function joinSession() {
    const sessionId = document.getElementById('session_id').value;
    if (!sessionId.trim()) return;
    
    current_session = sessionId;
    console.log(current_session);
    socket.emit('join_session', {'session_id' : current_session});
    /*document.getElementById('current-session').textContent = sessionId;*/
    updateConnectionStatus(true, sessionId);
}
socket.on('session_joined', (data) => {
    current_session = data.session_id;
    document.getElementById('current-session').textContent = current_session;
    updateConnectionStatus(true, current_session);
});

// Enviar mensaje
function sendMessage() {
    const message = document.getElementById('message_input').value.trim();
    if (!message || !current_session) return;
    
    socket.emit('send_message', {
        session_id: current_session,
        content: message
    });
    
    document.getElementById('message_input').value = ''; // Limpiar campo
}

// Manejo de archivos
document.getElementById('file_input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (event) => {
        socket.emit('file', {
            session_id: current_session,
            file_data: event.target.result,
            file_name: file.name
        });
    };
    reader.readAsDataURL(file);
});

// Escuchar mensajes/archivos
socket.on('new_message', (data) => {
    const messagesDiv = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.className = 'bg-gray-800 p-4 rounded-lg';
    messageElement.innerHTML = `
        <div class="flex justify-between items-center mb-2">
            <span class="text-blue-400 font-medium text-sm">${data.sender}</span>
            <span class="text-gray-400 text-xs">${data.timestamp}</span>
        </div>
        <p class="text-gray-100">${data.content}</p>
    `;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

socket.on('file', (data) => {
    const messagesDiv = document.getElementById('messages');
    const link = document.createElement('a');
    link.href = data.file_data;
    link.download = data.file_name;
    link.textContent = `Descargar ${data.file_name}`;
    messagesDiv.appendChild(link);
});

socket.on('status', (data) => {
    console.log(data.msg);
});
socket.on('error', (data) => {
    alert(`Error: ${data.msg}`);
});
