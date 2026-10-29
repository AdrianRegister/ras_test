import 'dotenv/config';

import express, { type Express } from 'express';
import cors from 'cors';

import { pool } from './db/db.ts';
import clientesRouter from './routes/clientes.js';
import usersRouter from './routes/users.ts';
import { requireAuth } from './middleware/auth.js';

const app: Express = express();

app.use(
  cors({
    origin: 'http://localhost:4200',
    credentials: true,
  }),
);

app.use(express.json());

// Login and logout must remain accessible without authentication.
app.use('/api/users', usersRouter);

// Protect client data and lookup endpoints.
app.use('/api/clientes', requireAuth, clientesRouter);
app.use('/api/paises', requireAuth);
app.use('/api/estados', requireAuth);
app.use('/api/comerciales', requireAuth);

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

// Keep the health check public.
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

if (process.env.NODE_ENV !== 'test') {
  app.listen(3000);
}

export default app;
