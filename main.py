from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, join_room, leave_room

app = Flask(__name__)
app.config['SECRET_KEY'] = 'tu_clave_secreta'
socketio = SocketIO(app, cors_allowed_origins="*")

# Almacén de sesiones
sessions = {}
# Almacen de usuarios
user_list = {}

@socketio.on('join_session')
def handle_join_session(data):
    try:
        session_id = data['session_id']
        user_id = data['user_id']
        if not(session_id and user_id):
            raise

        if (session_id not in sessions) and (user_id not in user_list):
            sessions[session_id] = []
            user_list[user_id] = [request.sid] #agrega al usuario y lo guarda junto a su request

        sessions[session_id].append(request.sid)
        join_room(session_id)
        emit('status', {
            'msg': f'Unido a la sesión {session_id}',
            'session': session_id
        }, room=request.sid)
        
    except:
        emit('error', {'msg':'Verificar valores de entrada'})

@socketio.on('send_message')
def handle_message(data):
    try:
        session_id = data['session_id']
        user_id = data['user_id']
        content = data['content']
        
        if session_id not in sessions:
            raise ValueError("Sesión no existe")
        
        emit('new_message', {
            'content': content,
            'sender': user_id  # nombre del usuario ID
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
@app.route('/login')
def loginPage():
    return render_template('login.html')
@app.route('/admin')
def adminPage():
    return render_template('admin.html')
if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
