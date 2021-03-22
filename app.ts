import express from 'express'
import cors from 'cors'
import * as bigintConversion from 'bigint-conversion'
import * as rsa from './rsa'

const port = 3000

const app = express()
app.use(cors({
  origin: 'http://localhost:3001' // angular.js server
}))

app.get('/', (req, res) => {
  res.send('hello world')
})

app.post('/mensaje', (req, res) => {
  res.json(req.body);
})

app.get('/rsa', async function (req, res) {
  const rsaKeys = await rsa.generateKeys(2048)
  console.log(rsaKeys)
  res.json({
    publicKey: {
      e: bigintConversion.bigintToHex(rsaKeys.publicKey.e),
      n: bigintConversion.bigintToHex(rsaKeys.publicKey.n)
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