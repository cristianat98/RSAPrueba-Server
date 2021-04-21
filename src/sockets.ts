const { io } = require('./app')

let sockets: any [] = [];

io.on('connection', (socket: any) => {

    console.log("Conectado")

  socket.on('nuevoConectado', () =>{
  });

  socket.on('disconnect', function(){
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