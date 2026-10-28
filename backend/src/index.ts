import express, { type Express, type Request, type Response } from 'express';
import 'dotenv/config';
import { pool } from './db/db.ts';
import type { QueryResult, QueryResultRow } from 'pg';

const app: Express = express();

app.get('/', (req: Request, res: Response) => {
  res.send(`Hello World!`);
});

app.get('/db-health', async (req: Request, res: Response) => {
  const startupCheck: QueryResult<QueryResultRow> = await pool.query(
    'SELECT NOW() AS current_time',
  );
  const startupCheckResult: string = JSON.stringify(startupCheck.rows[0]);

  res.send(startupCheckResult);
});

app.listen(3000);
