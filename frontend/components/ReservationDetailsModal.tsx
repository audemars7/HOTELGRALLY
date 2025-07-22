'use client'

import { useState } from 'react'
import { X, User, Calendar, Clock, MapPin, Briefcase, CreditCard, AlertTriangle } from 'lucide-react'
import { Room, Reservation } from '@/types'

interface ReservationDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  room: Room | null
  reservation: Reservation | null
  onCancelReservation: (reservationId: string) => Promise<void>
}

export default function ReservationDetailsModal({
  isOpen,
  onClose,
  room,
  reservation,
  onCancelReservation
}: ReservationDetailsModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  if (!isOpen || !room || !reservation) return null

  const handleCancelReservation = async () => {
    setIsLoading(true)
    try {
      await onCancelReservation(reservation.id)
      onClose()
    } catch (error) {
      console.error('Error al cancelar reserva:', error)
    } finally {
      setIsLoading(false)
      setShowCancelConfirm(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoomTypeLabel = (type: string) => {
    switch (type) {
      case 'PLAZA_MEDIA':
        return 'Plaza 1/2'
      case 'DOS_PLAZAS':
        return '2 Plazas'
      case 'DOBLE':
        return 'Doble'
      default:
        return type
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            Detalles de Reserva - Habitación {room.number}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Información de la Habitación */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">Habitación</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Número:</span>
                <span className="font-medium">{room.number}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Tipo:</span>
                <span className="font-medium">{getRoomTypeLabel(room.type)}</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-gray-500" />
                <span className="text-gray-600">Precio:</span>
                <span className="font-medium">S/ {room.price}</span>
              </div>
            </div>
          </div>

          {/* Información del Cliente */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <User size={16} />
              Cliente
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Nombre:</span>
                <span className="font-medium">{reservation.client?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">DNI:</span>
                <span className="font-medium">{reservation.client?.dni}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-gray-500" />
                <span className="text-gray-600">Origen:</span>
                <span className="font-medium">{reservation.client?.origin}</span>
              </div>
              {reservation.client?.occupation && (
                <div className="flex items-center gap-2">
                  <Briefcase size={16} className="text-gray-500" />
                  <span className="text-gray-600">Ocupación:</span>
                  <span className="font-medium">{reservation.client.occupation}</span>
                </div>
              )}
            </div>
          </div>

          {/* Información de la Reserva */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Calendar size={16} />
              Reserva
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-500" />
                <span className="text-gray-600">Check-in:</span>
                <span className="font-medium">{formatDate(reservation.checkIn)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-500" />
                <span className="text-gray-600">Check-out:</span>
                <span className="font-medium">{formatDate(reservation.checkOut)}</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-gray-500" />
                <span className="text-gray-600">Total:</span>
                <span className="font-medium">S/ {reservation.totalPrice}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Estado:</span>
                <span className={`font-medium px-2 py-1 rounded text-sm ${
                  reservation.status === 'ACTIVE' 
                    ? 'bg-green-100 text-green-800' 
                    : reservation.status === 'COMPLETED'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {reservation.status === 'ACTIVE' ? 'Activa' : 
                   reservation.status === 'COMPLETED' ? 'Completada' : 'Cancelada'}
                </span>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cerrar
            </button>
            
            {reservation.status === 'ACTIVE' && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                <AlertTriangle size={16} />
                Cancelar Reserva
              </button>
            )}
          </div>
        </div>

        {/* Modal de Confirmación de Cancelación */}
        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-4">
              <div className="text-center">
                <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">¿Confirmar Cancelación?</h3>
                <p className="text-gray-600 mb-6">
                  Esta acción no se puede deshacer. La reserva será cancelada permanentemente.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={isLoading}
                  >
                    No, Mantener
                  </button>
                  <button
                    onClick={handleCancelReservation}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Cancelando...' : 'Sí, Cancelar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 