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

interface MensajeOutput {
  usuario: string
  mensaje: string
  iv: string
}

app.post('/mensaje', async (req, res) => {
  console.log("MENSAJE RECIBIDO CIFRADO: " + req.body.mensaje)
  const mensaje: bigint = keyprivate.decrypt(bigintConversion.hexToBigint(req.body.mensaje))
  console.log("MENSAJE RECIBIDO DESCIFRADO: " + bigintConversion.bigintToText(mensaje))
  const cifrado: aes.DatosCifrado = await aes.encrypt(bigintConversion.bigintToBuf(mensaje) as Buffer) 
  const enviar: MensajeOutput = {
    usuario: req.body.usuario,
    mensaje: cifrado.cifrado + cifrado.authTag,
    iv: cifrado.iv
  }
  console.log("MENSAJE ENVIADO CIFRADO: " + enviar.mensaje)
  res.json(enviar);
})

app.get('/rsa', async function (req, res) {
  const rsaKeys: rsa.rsaKeyPair = await rsa.generateKeys(2048)
  keyprivate = rsaKeys.privateKey;
  res.json({
    publicKey: {
      e: bigintConversion.bigintToHex(rsaKeys.publicKey.e),
      n: bigintConversion.bigintToHex(rsaKeys.publicKey.n)
    } 
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

app.listen(port, function () {
  console.log(`Listening on http://localhost:${port}`)
})