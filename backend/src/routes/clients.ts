

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET - Obtener todos los clientes
router.get('/', async (req: Request, res: Response) => {
  try {
    const clients = await prisma.client.findMany({
      include: {
        reservations: {
          include: {
            room: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.json({
      success: true,
      data: clients
    });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener los clientes'
    });
  }
});

// GET - Obtener cliente por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        reservations: {
          include: {
            room: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }

    return res.json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener el cliente'
    });
  }
});

// GET - Buscar cliente por DNI
router.get('/search/dni/:dni', async (req: Request, res: Response) => {
  try {
    const { dni } = req.params;
    
    const client = await prisma.client.findUnique({
      where: { dni },
      include: {
        reservations: {
          include: {
            room: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }

    return res.json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Error al buscar cliente:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al buscar el cliente'
    });
  }
});

// PUT - Actualizar cliente
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, origin, occupation } = req.body;

    const client = await prisma.client.findUnique({
      where: { id }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }

    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        name: name || client.name,
        origin: origin || client.origin,
        occupation: occupation !== undefined ? occupation : client.occupation
      },
      include: {
        reservations: {
          include: {
            room: true
          }
        }
      }
    });

    return res.json({
      success: true,
      data: updatedClient,
      message: 'Cliente actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al actualizar el cliente'
    });
  }
});

// GET - Historial de reservas de un cliente
router.get('/:id/reservations', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        reservations: {
          include: {
            room: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }

    return res.json({
      success: true,
      data: client.reservations
    });
  } catch (error) {
    console.error('Error al obtener historial de reservas:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener el historial de reservas'
    });
  }
});

export default router; 