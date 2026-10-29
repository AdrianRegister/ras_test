import express, { type Express, type Request, type Response } from 'express';
import 'dotenv/config';

import { pool } from './db/db.ts';

import clientesRouter from './routes/clientes.js';

const app: Express = express();
app.use(express.json());

app.use('/api/clientes', clientesRouter);

app.get('/', (req: Request, res: Response) => {
  res.send(`Hello World!`);
});

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');

    res.status(200).json({
      status: 'ok',
      database: 'connected',
    });
  } catch (error) {
    console.error('Database health check failed:', error);

    res.status(503).json({
      status: 'error',
      database: 'unavailable',
    });
  }
});

app.listen(3000);
