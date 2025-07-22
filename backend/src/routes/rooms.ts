import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  getRoomsWithOccupancyStatus, 
  getRoomsAvailabilityForDate, 
  calculateRoomStats,
  isRoomCurrentlyOccupied
} from '../utils/roomUtils';

const router = Router();
const prisma = new PrismaClient();

// GET - Obtener todas las habitaciones
router.get('/', async (req: Request, res: Response) => {
  try {
    const rooms = await getRoomsWithOccupancyStatus();

    return res.json({
      success: true,
      data: rooms
    });
  } catch (error) {
    console.error('Error al obtener habitaciones:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener las habitaciones'
    });
  }
});

// GET - Obtener habitación por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        reservations: {
          include: {
            client: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Habitación no encontrada'
      });
    }

    return res.json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('Error al obtener habitación:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener la habitación'
    });
  }
});

// GET - Obtener habitaciones disponibles
router.get('/available/status', async (req: Request, res: Response) => {
  try {
    const rooms = await getRoomsWithOccupancyStatus();
    
    const availableRooms = rooms
      .filter(room => room.isAvailable)
      .map(room => ({
        id: room.id,
        number: room.number,
        type: room.type,
        price: room.price,
        isAvailable: room.isAvailable,
        isOccupied: isRoomCurrentlyOccupied(room.reservations)
      }));

    return res.json({
      success: true,
      data: availableRooms
    });
  } catch (error) {
    console.error('Error al obtener habitaciones disponibles:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener las habitaciones disponibles'
    });
  }
});

// GET - Obtener habitaciones disponibles en una fecha específica
router.get('/available/date/:datetime', async (req: Request, res: Response) => {
  try {
    const { datetime } = req.params;
    // La fecha viene en formato ISO UTC desde el frontend
    const targetDate = new Date(datetime);

    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Fecha inválida'
      });
    }

    const availableRooms = await getRoomsAvailabilityForDate(targetDate);

    return res.json({
      success: true,
      data: availableRooms,
      targetDate: targetDate.toISOString()
    });

  } catch (error) {
    console.error('Error al obtener disponibilidad por fecha:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener la disponibilidad'
    });
  }
});

// GET - Obtener información de disponibilidad para una habitación específica
router.get('/:roomId/availability/:datetime', async (req: Request, res: Response) => {
  try {
    const { roomId, datetime } = req.params;
    // La fecha viene en formato ISO UTC desde el frontend
    const targetDate = new Date(datetime);
    
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Fecha inválida'
      });
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        reservations: {
          where: {
            status: 'ACTIVE'
          },
          include: {
            client: true
          }
        }
      }
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Habitación no encontrada'
      });
    }

    // Buscar reservas futuras en el mismo día
    const sameDayReservations = room.reservations.filter(reservation => {
      const checkIn = new Date(reservation.checkIn);
      const checkOut = new Date(reservation.checkOut);
      
      const targetDay = new Date(targetDate);
      const checkInDay = new Date(checkIn);
      const checkOutDay = new Date(checkOut);
      
      return (
        checkInDay.toDateString() === targetDay.toDateString() ||
        checkOutDay.toDateString() === targetDay.toDateString()
      );
    });

    // Encontrar la próxima reserva después de la hora consultada
    const nextReservation = sameDayReservations
      .filter(reservation => {
        const checkIn = new Date(reservation.checkIn);
        return checkIn > targetDate;
      })
      .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())[0];

    // Calcular check-out sugerido
    let suggestedCheckOut: Date;
    let reason: string;

    if (nextReservation) {
      // Si hay reserva futura, check-out justo antes
      const nextCheckIn = new Date(nextReservation.checkIn);
      suggestedCheckOut = new Date(nextCheckIn.getTime() - 60000); // 1 minuto antes
      reason = `Disponible hasta ${nextCheckIn.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })}`;
    } else {
      // Sin reservas futuras, usar lógica normal
      const checkInHour = targetDate.getHours();
      
      if (checkInHour >= 0 && checkInHour <= 5) {
        // Check-in entre 12:00 AM y 5:59 AM → Check-out a las 12:59 PM del mismo día
        suggestedCheckOut = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 12, 59, 0);
      } else {
        // Check-in entre 6:00 AM y 11:59 PM → Check-out a las 12:59 PM del día siguiente
        suggestedCheckOut = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1, 12, 59, 0);
      }
      reason = 'Check-out estándar (sin reservas futuras)';
    }

    return res.json({
      success: true,
      data: {
        room,
        suggestedCheckOut: suggestedCheckOut.toISOString(),
        reason
      }
    });
  } catch (error) {
    console.error('Error al obtener disponibilidad de habitación:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener la disponibilidad'
    });
  }
});

// PUT - Actualizar estado de habitación
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;

    const room = await prisma.room.findUnique({
      where: { id }
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Habitación no encontrada'
      });
    }

    const updatedRoom = await prisma.room.update({
      where: { id },
      data: {
        isAvailable: isAvailable !== undefined ? isAvailable : room.isAvailable
      }
    });

    // Emitir evento de tiempo real
    const io = req.app.get('io');
    if (io) {
      io.emit('room-status-updated', updatedRoom);
    }

    return res.json({
      success: true,
      data: updatedRoom,
      message: 'Estado de habitación actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error al actualizar estado de habitación:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al actualizar el estado de la habitación'
    });
  }
});

// GET - Estadísticas de habitaciones
router.get('/stats/overview', async (req: Request, res: Response) => {
  try {
    const stats = await calculateRoomStats();

    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener las estadísticas'
    });
  }
});

export default router;