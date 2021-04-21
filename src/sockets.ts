const { io } = require('./app')

let sockets: any [] = [];

io.on('connection', (socket: any) => {
  socket.on('nuevoConectado', (usuario: string) => {
      socket.usuario = usuario;
      console.log(socket.usuario + " se ha conectado");
      sockets.push(socket);
  });

  socket.on('cambiarNombre', (usuario: string) => {
    console.log(socket.usuario + " se ha cambiado el nombre a " + usuario);
    socket.usuario = usuario;
  })
  socket.on('disconnect', function(){
      console.log(socket.usuario + " se ha desconectado")
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