const socket = io.connect('http://' + document.location.hostname + ':5000');
let current_session = null;
const enterBtn = document.getElementById("enter-btn");
window.addEventListener("keypress", ({key}) => {
  if (key == "Enter")
    enterBtn.click();
});
// Función para actualizar el estado de conexión
function updateConnectionStatus(connected, sessionId = null, userId = null) {
    const statusText = document.getElementById('status-text');
    const currentSession = document.getElementById('current-session');
    const userName = document.getElementById('user-name');

    statusText.textContent = connected ? 'Conectado ✅' : 'Desconectado ❌';
    currentSession.textContent = sessionId || 'Ninguna';
    userName.textContent = userId || 'Anon'; 
    
    // Cambiar color de fondo
    document.getElementById('connection-status').style.backgroundColor = connected ? 'rgb(37 rgb(13 61 166)99 235)' : '#000000';
}

// Eventos de conexión
/*socket.on('connect', () => {
    updateConnectionStatus(true, current_session);
});*/

socket.on('disconnect', () => {
    updateConnectionStatus(false);
})
// Unirse a sesión
function joinSession() {
    const sessionId = document.getElementById('session_id').value;
    const userId = document.getElementById('user_id').value;
    if (!sessionId.trim()) return;
	
    console.log(current_session);
    socket.emit('join_session', {'session_id' : sessionId,
    				'user_id':userId});
    /*document.getElementById('current-session').textContent = sessionId;*/
    updateConnectionStatus(true, sessionId, userId);
}
socket.on('session_joined', (data) => {
    current_session = data.session_id;
    current_user = data.user_id;
    document.getElementById('current-session').textContent = current_session;
    document.getElementById('user-name').textContent = current_user;
    updateConnectionStatus(true, current_session);
});

// Enviar mensaje
function sendMessage() {
    const message = document.getElementById('message_input').value.trim();
    if (!message || !current_session){console.log(user_id.value)};  
    current_session = session_id.value;
	current_user = user_id.value;

	socket.emit('send_message', { 
	'session_id': current_session,
	'user_id': current_user,
	'content': message
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
    const linkElement = document.createElement('a');
    linkElement.className = 'text-gray-100'
    linkElement.href = data.file_data;
    linkElement.download = data.file_name;
    linkElement.textContent = `Descargar ${data.file_name}`;
    messagesDiv.appendChild(linkElement);
});

socket.on('status', (data) => {
    console.log(data.msg);
});
socket.on('error', (data) => {
    alert(`Error: ${data.msg}`);
});
