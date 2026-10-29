import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import 'dotenv/config';

import { pool } from './db/db.ts';

import clientesRouter from './routes/clientes.js';

const app: Express = express();
app.use(
  cors({
    origin: 'http://localhost:4200',
  }),
);
app.use(express.json());
app.use('/api/clientes', clientesRouter);

app.get('/api/paises', async (_req, res, next) => {
  try {
    const result = await pool.query('SELECT id, codigo, nombre FROM paises ORDER BY nombre');
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.get('/api/estados', async (_req, res, next) => {
  try {
    const result = await pool.query('SELECT id, nombre FROM estados');
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.get('/api/comerciales', async (_req, res, next) => {
  try {
    const result = await pool.query('SELECT id, nombre FROM comerciales ORDER BY nombre');
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
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
