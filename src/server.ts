import express from 'express';
import { rssfetch } from '../lib/rssnews';
import { bingfetch } from '../lib/bingnews';
import dotenv from 'dotenv';
dotenv.config();

const app = express();

app.get('/', (req: express.Request, res: express.Response) => {
    res.send('I am alive');
});

const _bingfetch = new bingfetch();
console.log('server');
_bingfetch.sayhello();
//_bingfetch.startService()

const _rssfetch = new rssfetch();
console.log('server');
_rssfetch.sayhello();
_rssfetch.startService();

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
