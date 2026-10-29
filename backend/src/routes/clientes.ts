import { Router } from 'express';
import { listClients } from '../repositories/client-repository.js';

const router = Router();

router.get('/', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));

  const search = String(req.query.search ?? '');
  const estado = String(req.query.estado ?? '');
  const pais = String(req.query.pais ?? '');
  const comercial = String(req.query.comercial ?? '');

  try {
    const result = await listClients(page, limit, search, estado, pais, comercial);

    res.json(result);
  } catch (error) {
    console.error('Error listing clients:', error);
    res.status(500).json({ error: 'Error al obtener los clientes' });
  }
});

export default router;
