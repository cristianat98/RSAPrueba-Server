import express from 'express'
import cors from 'cors';
import { Request, Response} from "express";

const port = 3000;

const app = express()
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('hello world')
})

app.post('/mensaje', (req: Request, res: Response) => {
    res.json(req.body)
})

app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`);
})