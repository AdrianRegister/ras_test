import { Router } from 'express';
import {
  listClients,
  getClientById,
  createClient,
  updateClient,
} from '../repositories/client-repository.js';
import { nuevoClienteSchema, actualizarClienteSchema } from '../validation/cliente-validation.ts';

const router = Router();

router.put('/:id', async (req, res) => {
  console.log('PUT route reached');
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'ID de cliente no válido' });
  }

  const validation = actualizarClienteSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      error: 'Datos del cliente no válidos',
      details: validation.error.issues,
    });
  }

  try {
    const cliente = await updateClient(id, validation.data);

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    return res.status(200).json(cliente);
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    return res.status(500).json({ error: 'Error al actualizar el cliente' });
  }
});

router.post('/', async (req, res) => {
  const validation = nuevoClienteSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      error: 'Datos del cliente no válidos',
      details: validation.error.issues,
    });
    return;
  }

  try {
    const client = await createClient(validation.data);
    res.status(201).json(client);
  } catch (error) {
    console.error('Error creating client:', error);

    res.status(500).json({
      error: 'Error al crear el cliente',
    });
  }
});

router.get('/:id', async (req, res) => {
  const id = req.params.id;

  if (!id || !/^\d+$/.test(id)) {
    res.status(400).json({ error: 'ID de cliente no válido' });
    return;
  }

  try {
    const client = await getClientById(id);

    if (!client) {
      res.status(404).json({ error: 'Cliente no encontrado' });
      return;
    }

    res.json(client);
  } catch (error) {
    console.error('Error getting client:', error);
    res.status(500).json({ error: 'Error al obtener el cliente' });
  }
});

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
