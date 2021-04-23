import express from 'express'
import cors from 'cors'
import * as bigintConversion from 'bigint-conversion'
import * as rsa from './rsa'
import * as aes from './aes'

//VARIABLES
const port = 3000
let keyRSA: rsa.rsaKeyPair
let usuarios: string[] = []

interface MensajeOutput {
  usuario: string
  mensaje: string
  iv?: string
}

export const eliminarUsuario = function (posicion: number): void {
  console.log(usuarios[posicion] + " se ha desconectado")
  usuarios.splice(posicion, 1)
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
  const usuario: string = req.body.usuario;
  while (i < usuarios.length && !encontrado){
    if (usuarios[i] === usuario)
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
    if (usuarios[i] === usuarioNuevo)
        encontrado = true;

    else
        i++;
  }

  if (encontrado === false){
    res.json(usuarios)
    usuarios.forEach(usuarioLista => {
      if (usuarioLista === usuarioAntiguo){
        usuarios[usuarios.indexOf(usuarioLista)] = usuarioNuevo;
      }
    })
  }

  else{
    res.status(409).json("Este usuario ya está conectado")
  }
})

app.post('/mensaje', async (req, res) => {
  console.log("CIFRADO RECIBIDO: " + req.body.cifrado)
  console.log("MENSAJE RECIBIDO CIFRADO: " + req.body.mensaje)
  let cifrado: aes.DatosCifrado
  
  if (req.body.cifrado === "AES"){
    const mensaje: string = req.body.mensaje.slice(0, req.body.mensaje.length - 32)
    const tag: string = req.body.mensaje.slice(req.body.mensaje.length - 32, req.body.mensaje.length)
    const mensajeDescifrado: Buffer = await aes.decrypt(bigintConversion.hexToBuf(mensaje) as Buffer, bigintConversion.hexToBuf(req.body.iv) as Buffer, bigintConversion.hexToBuf(tag) as Buffer)
    console.log("MENSAJE RECIBIDO DESCIFRADO: " + bigintConversion.bufToText(mensajeDescifrado))
    cifrado = await aes.encrypt(mensajeDescifrado)
  }

  else{
    const claveDescifradaBigint: bigint = keyRSA.privateKey.decrypt(bigintConversion.hexToBigint(req.body.clave))
    const mensaje: string = req.body.mensaje.slice(0, req.body.mensaje.length - 32)
    const tag: string = req.body.mensaje.slice(req.body.mensaje.length - 32, req.body.mensaje.length)
    const mensajeDescifrado: Buffer = await aes.decrypt(bigintConversion.hexToBuf(mensaje) as Buffer, bigintConversion.hexToBuf(req.body.iv) as Buffer, bigintConversion.hexToBuf(tag) as Buffer, bigintConversion.bigintToBuf(claveDescifradaBigint) as Buffer)
    console.log("MENSAJE RECIBIDO DESCIFRADO: " + bigintConversion.bufToText(mensajeDescifrado))
    cifrado = await aes.encrypt(mensajeDescifrado)
  }

  const enviar: MensajeOutput = {
    usuario: req.body.usuario,
    mensaje: cifrado.cifrado + cifrado.authTag,
    iv: cifrado.iv
  }
  console.log("MENSAJE ENVIADO CIFRADO: " + enviar.mensaje)
  res.json(enviar);
})

app.post('/firma', async (req, res) => {
  console.log("SE FIRMARÁ EL SIGUIENTE MENSAJE: " + req.body.mensaje)
  const firma: bigint = keyRSA.privateKey.sign(bigintConversion.hexToBigint(req.body.mensaje))
  const enviar: MensajeOutput = {
    usuario: req.body.usuario,
    mensaje: bigintConversion.bigintToHex(firma)
  }

  console.log("MENSAJE FIRMADO: " + enviar.mensaje)
  res.json(enviar)
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
  const cifrado: aes.DatosCifrado = await aes.encrypt(bigintConversion.textToBuf("Hola Mundo") as Buffer)
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