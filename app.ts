import express from 'express'
import cors from 'cors';

const port = 3000;

const app = express()
app.use(cors());

app.get('/', (req, res) => {
    res.send('hello world')
})

app.post('/mensaje', (req, res) => {
    res.json("RECIBIDO!!")
})

app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`);
})