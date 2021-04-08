import express from 'express'
import cors from 'cors'
import * as bigintConversion from 'bigint-conversion'
import * as rsa from './rsa'
import * as aes from './aes'

const port = 3000
let keyprivate: rsa.RsaPrivateKey
const app = express()
app.use(cors({
  origin: 'http://localhost:4200' // angular.js server
}), express.json())

app.get('/', (req, res) => {
  res.send('hello world')
})

app.post('/mensaje', async (req, res) => {
  console.log("MENSAJE RECIBIDO CIFRADO: " + req.body.mensaje)
  let mensaje: bigint = keyprivate.decrypt(bigintConversion.hexToBigint(req.body.mensaje))
  console.log("MENSAJE RECIBIDO DESCIFRADO: " + bigintConversion.bigintToText(mensaje))
  const cifrado = await aes.encrypt(bigintConversion.bigintToText(mensaje))
  const resultado = {
    usuario: req.body.usuario,
    mensaje: cifrado.cifrado,
    iv: cifrado.iv
  }
  console.log("MENSAJE ENVIADO CIFRADO: " + resultado.mensaje)
  res.json(resultado);
})

app.get('/rsa', async function (req, res) {
  const rsaKeys = await rsa.generateKeys(2048)
  keyprivate = rsaKeys.privateKey;
  res.json({
    publicKey: {
      e: bigintConversion.bigintToHex(rsaKeys.publicKey.e),
      n: bigintConversion.bigintToHex(rsaKeys.publicKey.n)
    } 
  })
})

app.get('/aes', async function (req, res) {
  const cifrado = await aes.encrypt("Hola Mundo")
  console.log("Cifrado: " + cifrado.cifrado);
  const mensaje = await aes.decrypt(cifrado.cifrado, cifrado.iv)
  console.log("Mensaje: " + mensaje)
})

app.get('/user', (req, res) => {
  const user = {
    username: 'walrus',
    description: 'it is what it is'
  }
  res.json(user)
})

app.listen(port, function () {
  console.log(`Listening on http://localhost:${port}`)
})