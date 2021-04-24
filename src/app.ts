import express from 'express'
import cors from 'cors'
import * as bigintConversion from 'bigint-conversion'
import * as rsa from './rsa'
import * as aes from './aes'
import * as modelos from './modelos'

//VARIABLES
const port = 3000
let keyRSA: rsa.rsaKeyPair
let usuarios: modelos.Usuario[] = []

export const eliminarUsuario = function (posicion: number): string {
  console.log(usuarios[posicion].nombre + " se ha desconectado")
  const usuario: string = usuarios[posicion].nombre;
  usuarios.splice(posicion, 1);
  return usuario;
}

//SERVIDOR
const app = express()
app.use(cors({
  origin: 'http://localhost:4200' // angular.js server
}), express.json())

app.get('/', (req, res) => {
  res.send('hello world')
})

app.post('/conectar', (req, res) => {
  let i: number = 0;
  let encontrado: Boolean = false;
  const usuario: modelos.Usuario = req.body
  while (i < usuarios.length && !encontrado){
    if (usuarios[i].nombre === usuario.nombre)
        encontrado = true;

    else
        i++;
  }

  if (encontrado === false){
    res.json(usuarios)
    usuarios.push(usuario)
  }

  else{
    res.status(409).json("Este usuario ya está conectado")
  }
})

app.post('/cambiar', (req, res) => {
  let i: number = 0;
  let encontrado: Boolean = false;
  const usuarioAntiguo: string = req.body.usuarioAntiguo;
  const usuarioNuevo: string = req.body.usuarioNuevo;
  while (i < usuarios.length && !encontrado){
    if (usuarios[i].nombre === usuarioNuevo)
        encontrado = true;

    else
        i++;
  }

  if (encontrado === false){
    res.json(usuarios)
    usuarios.forEach((usuarioLista: modelos.Usuario) => {
      if (usuarioLista.nombre === usuarioAntiguo){
        usuarios[usuarios.indexOf(usuarioLista)].nombre = usuarioNuevo;
      }
    })
  }

  else{
    res.status(409).json("Este usuario ya está conectado")
  }
})

app.post('/mensaje', async (req, res) => {
  const recibido: modelos.MensajeServidor = req.body;
  console.log("CIFRADO RECIBIDO: " + recibido.tipo)
  console.log("MENSAJE RECIBIDO CIFRADO: " + recibido.cifrado)
  let cifrado: modelos.cifradoAES;
  
  if (recibido.tipo === "AES"){
    const mensaje: string = recibido.cifrado.slice(0, recibido.cifrado.length - 32)
    const tag: string = recibido.cifrado.slice(recibido.cifrado.length - 32, recibido.cifrado.length)
    console.log(mensaje + " " + tag);
    const mensajeDescifrado: Buffer = await aes.decrypt(bigintConversion.hexToBuf(mensaje) as Buffer, bigintConversion.hexToBuf(recibido.iv) as Buffer, bigintConversion.hexToBuf(tag) as Buffer)
    console.log("MENSAJE RECIBIDO DESCIFRADO: " + bigintConversion.bufToText(mensajeDescifrado))
    cifrado = await aes.encrypt(mensajeDescifrado)
  }

  else{
    let claveDescifradaBigint: bigint = 0n;

    if (recibido.clave !== undefined)
      claveDescifradaBigint = keyRSA.privateKey.decrypt(bigintConversion.hexToBigint(recibido.clave))

    const mensaje: string = recibido.cifrado.slice(0, recibido.cifrado.length - 32)
    const tag: string = recibido.cifrado.slice(recibido.cifrado.length - 32, recibido.cifrado.length)
    const mensajeDescifrado: Buffer = await aes.decrypt(bigintConversion.hexToBuf(mensaje) as Buffer, bigintConversion.hexToBuf(recibido.iv) as Buffer, bigintConversion.hexToBuf(tag) as Buffer, bigintConversion.bigintToBuf(claveDescifradaBigint) as Buffer)
    console.log("MENSAJE RECIBIDO DESCIFRADO: " + bigintConversion.bufToText(mensajeDescifrado))
    cifrado = await aes.encrypt(mensajeDescifrado)
  }

  const enviar: modelos.MensajeServidor = {
    usuario: recibido.usuario,
    tipo: recibido.tipo,
    cifrado: cifrado.cifrado + cifrado.authTag,
    iv: cifrado.iv
  }

  console.log("MENSAJE ENVIADO CIFRADO: " + enviar.cifrado)
  res.json(enviar);
})

app.post('/firmar', async (req, res) => {
  console.log("SE FIRMARÁ EL SIGUIENTE MENSAJE: " + req.body.mensaje)
  const firma: bigint = keyRSA.privateKey.sign(bigintConversion.hexToBigint(req.body.mensaje))
  const enviar: modelos.Mensaje = {
    usuario: req.body.usuario,
    mensaje: bigintConversion.bigintToHex(firma)
  }

  console.log("MENSAJE FIRMADO: " + enviar.mensaje)
  res.json(enviar)
})

app.post('/noRepudio', (req, res) => {
  const recibido: modelos.NoRepudio = req.body;
  usuarios.forEach((usuarioLista: modelos.Usuario) => {
    /*if (usuarioLista.nombre === recibido.usuarioOrigen){
      const clavePublica: rsa.RsaPublicKey = new rsa.RsaPublicKey(bigintConversion.hexToBigint(usuarioLista.eHex), bigintConversion.hexToBigint(usuarioLista.nHex))

    }*/
  })
})

app.get('/rsa', async function (req, res) {
  if (keyRSA === undefined)
    keyRSA = await rsa.generateKeys(2048)

  res.json({
    eHex: bigintConversion.bigintToHex(keyRSA.publicKey.e),
    nHex: bigintConversion.bigintToHex(keyRSA.publicKey.n)
  })
})

app.get('/aes', async function (req, res) {
  const cifrado: modelos.cifradoAES = await aes.encrypt(bigintConversion.textToBuf("Hola Mundo") as Buffer)
  console.log("Cifrado: " + cifrado.cifrado);
  const mensaje: Buffer = await aes.decrypt(bigintConversion.hexToBuf(cifrado.cifrado) as Buffer, bigintConversion.hexToBuf(cifrado.iv) as Buffer, bigintConversion.hexToBuf(cifrado.authTag) as Buffer)
  console.log("Mensaje: " + bigintConversion.bufToText(mensaje))
  res.json({
    mensajes: {
      mensaje: "Hola Mundo",
      cifrado: cifrado,
      descifrado: bigintConversion.bufToText(mensaje)
    }
  })
})

app.get('/user', (req, res) => {
  const user = {
    username: 'walrus',
    description: 'it is what it is'
  }
  res.json(user)
})

//SERVIDOR SOCKETS
const server = require('http').createServer(app);
module.exports.io = require('socket.io')(server, {
  cors: {
    origin: "http://localhost:4200",
    methods: ["GET", "POST"]
  }
});
require('./sockets');

server.listen(port, function () {
  console.log(`Listening on http://localhost:${port}`)
})