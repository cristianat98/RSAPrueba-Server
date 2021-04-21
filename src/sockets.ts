import { Socket } from "socket.io";

const { io } = require('./app')

let sockets: Socket[] = [];

io.on('connection', (socket: Socket) => {

    socket.on('nuevoConectado', usuario => {
        console.log(usuario.nombre + " se ha conectado");
        socket.join(usuario.nombre);
        sockets.push(socket);
        io.emit('nuevoConectado', usuario)
    });

    socket.on('cambiarNombre', (usuarios: string []) => {
        socket.rooms.forEach(sala => {
            if (sala.toString() === usuarios[0]){
                socket.leave(usuarios[0]);
                socket.join(usuarios[1]);
            }
        })

        console.log(usuarios[0] + " se ha cambiado el nombre a " + usuarios[1]);
        io.emit('cambiarNombre', usuarios);
    });

    socket.on('nuevoMensaje', mensaje => {
        io.emit('nuevoMensaje', mensaje);
    })

    socket.on('disconnect', function(){
        //console.log(socket.usuario + " se ha desconectado")
    });
});

function getSocket(){
  return io;
}

function getVectorSockets(){
  return sockets;
}

module.exports.getSocket = getSocket;
module.exports.getVectorSockets = getVectorSockets;