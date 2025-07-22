import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { calculateCheckOut, isTimeOverlap, getDurationInHours } from '../utils/dateUtils';
import { body, validationResult } from 'express-validator';

const router = Router();
const prisma = new PrismaClient();

// Validación para crear reserva
const createReservationValidation = [
  body('clientName').notEmpty().withMessage('El nombre del cliente es requerido'),
  body('clientDni').notEmpty().withMessage('El DNI del cliente es requerido'),
  body('clientOrigin').notEmpty().withMessage('La procedencia del cliente es requerida'),
  body('roomId').notEmpty().withMessage('El ID de la habitación es requerido'),
  body('checkIn').isISO8601().withMessage('La fecha de check-in debe ser válida'),
  body('checkOut').isISO8601().withMessage('La fecha de check-out debe ser válida')
];

// GET - Obtener todas las reservas
router.get('/', async (req: Request, res: Response) => {
  try {
    const reservations = await prisma.reservation.findMany({
      include: {
        client: true,
        room: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.json({
      success: true,
      data: reservations
    });
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener las reservas'
    });
  }
});

// GET - Obtener reserva por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        client: true,
        room: true
      }
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: 'Reserva no encontrada'
      });
    }

    return res.json({
      success: true,
      data: reservation
    });
  } catch (error) {
    console.error('Error al obtener reserva:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener la reserva'
    });
  }
});

// POST - Crear nueva reserva
router.post('/', createReservationValidation, async (req: Request, res: Response) => {
  try {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { clientName, clientDni, clientOrigin, clientOccupation, roomId, checkIn, checkOut } = req.body;

    // Verificar que la habitación existe y está disponible
    const room = await prisma.room.findUnique({
      where: { id: roomId }
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Habitación no encontrada'
      });
    }

    if (!room.isAvailable) {
      return res.status(400).json({
        success: false,
        error: 'La habitación no está disponible'
      });
    }

    // Convertir checkIn y checkOut a Date
    const checkInDate = new Date(checkIn);
    const checkOutDate = checkOut ? new Date(checkOut) : calculateCheckOut(checkInDate);

    // Verificar si hay conflictos de horario
    // Una reserva tiene conflicto si:
    // 1. El nuevo check-in está dentro de una reserva existente
    // 2. El nuevo check-out está dentro de una reserva existente  
    // 3. La nueva reserva engloba completamente una reserva existente
    const conflictingReservations = await prisma.reservation.findMany({
      where: {
        roomId,
        status: 'ACTIVE',
        OR: [
          {
            // Nuevo check-in está dentro de reserva existente
            AND: [
              { checkIn: { lte: checkInDate } },
              { checkOut: { gt: checkInDate } }
            ]
          },
          {
            // Nuevo check-out está dentro de reserva existente
            AND: [
              { checkIn: { lt: checkOutDate } },
              { checkOut: { gt: checkOutDate } }
            ]
          },
          {
            // Nueva reserva engloba completamente una reserva existente
            AND: [
              { checkIn: { gte: checkInDate } },
              { checkOut: { lte: checkOutDate } }
            ]
          }
        ]
      }
    });

    if (conflictingReservations.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'La habitación ya tiene una reserva en ese horario'
      });
    }

    // Crear o encontrar el cliente
    let client = await prisma.client.findUnique({
      where: { dni: clientDni }
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          name: clientName,
          dni: clientDni,
          origin: clientOrigin,
          occupation: clientOccupation || null
        }
      });
    }

    // El precio de la habitación ya es el precio total
    const totalPrice = room.price;

    // Crear la reserva
    const reservation = await prisma.reservation.create({
      data: {
        checkIn: checkInDate,
        checkOut: checkOutDate,
        totalPrice,
        roomId,
        clientId: client.id
      },
      include: {
        client: true,
        room: true
      }
    });

    // Ya no necesitamos actualizar isOccupied - se calcula desde reservas

    // Emitir evento de tiempo real
    const io = req.app.get('io');
    if (io) {
      io.emit('reservation-created', reservation);
      io.to(`room-${roomId}`).emit('room-updated', { roomId });
    }

    return res.status(201).json({
      success: true,
      data: reservation,
      message: 'Reserva creada exitosamente'
    });

  } catch (error) {
    console.error('Error al crear reserva:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al crear la reserva'
    });
  }
});

// PUT - Actualizar reserva
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { room: true }
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: 'Reserva no encontrada'
      });
    }

    const updatedReservation = await prisma.reservation.update({
      where: { id },
      data: { status },
      include: {
        client: true,
        room: true
      }
    });

    // Si la reserva se completa o cancela, emitir evento (isOccupied se calcula automáticamente)
    if (status === 'COMPLETED' || status === 'CANCELLED') {
      // Emitir evento de tiempo real
      const io = req.app.get('io');
      if (io) {
        io.emit('reservation-updated', updatedReservation);
        io.to(`room-${reservation.roomId}`).emit('room-updated', { 
          roomId: reservation.roomId
        });
      }
    }

    return res.json({
      success: true,
      data: updatedReservation,
      message: 'Reserva actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error al actualizar reserva:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al actualizar la reserva'
    });
  }
});

// DELETE - Eliminar reserva
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { room: true }
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: 'Reserva no encontrada'
      });
    }

    await prisma.reservation.delete({
      where: { id }
    });

    // Emitir evento de tiempo real (isOccupied se calcula automáticamente)
    if (reservation.status === 'ACTIVE') {
      const io = req.app.get('io');
      if (io) {
        io.emit('reservation-deleted', { id });
        io.to(`room-${reservation.roomId}`).emit('room-updated', { 
          roomId: reservation.roomId
        });
      }
    }

    return res.json({
      success: true,
      message: 'Reserva eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar reserva:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al eliminar la reserva'
    });
  }
});

export default router; 