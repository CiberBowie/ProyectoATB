from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, join_room, leave_room

app = Flask(__name__)
app.config['SECRET_KEY'] = 'tu_clave_secreta'
socketio = SocketIO(app, cors_allowed_origins="*")

# Almacén de sesiones
sessions = {}

@socketio.on('join_session')
def handle_join_session(data):
    try:
        session_id = data['session_id']
        if not session_id:
            raise ValueError("ID de sesión vacío")
        
        if session_id not in sessions:
            sessions[session_id] = []
        
        sessions[session_id].append(request.sid)
        join_room(session_id)
        emit('status', {
            'msg': f'Unido a la sesión {session_id}',
            'session': session_id
        }, room=request.sid)
        
    except Exception as e:
        emit('error', {'msg': str(e)})

@socketio.on('send_message')
def handle_message(data):
    try:
        session_id = data['session_id']
        content = data['content']
        
        if session_id not in sessions:
            raise ValueError("Sesión no existe")
        
        emit('new_message', {
            'content': content,
            'sender': request.sid[-6:]  # ID abreviado
        }, room=session_id)
        
    except Exception as e:
        emit('error', {'msg': str(e)}, room=request.sid)

@socketio.on('file')
def handle_file(data):
    session_id = data['session_id']
    file_data = data['file_data']
    file_name = data['file_name']
    # Reenviar archivo a todos en la sesión
    emit('file', {'file_data': file_data, 'file_name': file_name}, room=session_id)

@app.route('/')
def index():
    return render_template('index.html')
@app.route('/chat')
def chat_room():
    return render_template('chat_room.html')
if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)