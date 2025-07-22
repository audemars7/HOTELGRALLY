'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Calendar, User, MapPin, Briefcase } from 'lucide-react'
import { Room, ReservationFormData } from '@/types'
import toast from 'react-hot-toast'

const reservationSchema = z.object({
  clientName: z.string().min(1, 'El nombre es requerido'),
  clientDni: z.string().min(8, 'El DNI debe tener al menos 8 caracteres'),
  clientOrigin: z.string().min(1, 'La procedencia es requerida'),
  clientOccupation: z.string().optional(),
  roomId: z.string().min(1, 'Debe seleccionar una habitación'),
  checkIn: z.string().min(1, 'La fecha de check-in es requerida'),
  checkOut: z.string().min(1, 'La fecha de check-out es requerida')
})

interface ReservationFormProps {
  rooms: Room[]
  selectedRoom?: Room | null
  selectedDateTime?: string
  availabilityMode?: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function ReservationForm({ rooms, selectedRoom, selectedDateTime, availabilityMode = false, onClose, onSuccess }: ReservationFormProps) {
  const [loading, setLoading] = useState(false)
  const [currentRoom, setCurrentRoom] = useState<Room | null>(selectedRoom || null)
  const [suggestedCheckOut, setSuggestedCheckOut] = useState<string>('')
  const [suggestionReason, setSuggestionReason] = useState<string>('')
  const [loadingSuggestion, setLoadingSuggestion] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      roomId: selectedRoom?.id || '',
      checkIn: selectedDateTime || '',
      checkOut: ''
    }
  })

  const checkIn = watch('checkIn')
  const roomId = watch('roomId')

  // Calcular check-out cuando cambia el check-in
  const calculateCheckOut = (checkInDate: string) => {
    if (!checkInDate) return ''
    
    // Crear fecha sin conversión de zona horaria
    const date = new Date(checkInDate)
    const hour = date.getHours()
    
    let checkOutDate: Date
    
    if (hour >= 0 && hour <= 5) {
      // Check-in entre 12:00 AM y 5:59 AM → Check-out a las 12:59 PM del mismo día
      checkOutDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 59, 0)
    } else {
      // Check-in entre 6:00 AM y 11:59 PM → Check-out a las 12:59 PM del día siguiente
      checkOutDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 12, 59, 0)
    }
    
    // Formatear para datetime-local input
    const year = checkOutDate.getFullYear()
    const month = String(checkOutDate.getMonth() + 1).padStart(2, '0')
    const day = String(checkOutDate.getDate()).padStart(2, '0')
    const hours = String(checkOutDate.getHours()).padStart(2, '0')
    const minutes = String(checkOutDate.getMinutes()).padStart(2, '0')
    
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  // useEffect para actualizar check-out cuando cambia check-in
  useEffect(() => {
    if (checkIn) {
      const calculatedCheckOut = calculateCheckOut(checkIn)
      setValue('checkOut', calculatedCheckOut)
    }
  }, [checkIn, setValue])

  // useEffect para actualizar habitación seleccionada
  useEffect(() => {
    if (roomId && !currentRoom) {
      const room = rooms.find(r => r.id === roomId)
      if (room) setCurrentRoom(room)
    }
  }, [roomId, currentRoom, rooms])



  // Función para obtener sugerencia de check-out
  const getSuggestedCheckOut = async () => {
    if (!roomId || !checkIn) return
    
    setLoadingSuggestion(true)
    try {
      // Convertir checkIn a UTC para la consulta
      const checkInUTC = new Date(checkIn).toISOString()
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/rooms/${roomId}/availability/${encodeURIComponent(checkInUTC)}`
      )
      const result = await response.json()
      
      if (result.success) {
        // La respuesta viene en UTC, convertir a formato local para el input
        const suggestedDate = new Date(result.data.suggestedCheckOut)
        const year = suggestedDate.getFullYear()
        const month = String(suggestedDate.getMonth() + 1).padStart(2, '0')
        const day = String(suggestedDate.getDate()).padStart(2, '0')
        const hours = String(suggestedDate.getHours()).padStart(2, '0')
        const minutes = String(suggestedDate.getMinutes()).padStart(2, '0')
        
        const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`
        setSuggestedCheckOut(formattedDate)
        setSuggestionReason(result.data.reason)
      }
    } catch (error) {
      console.error('Error al obtener sugerencia:', error)
    } finally {
      setLoadingSuggestion(false)
    }
  }

  // useEffect para obtener sugerencia cuando cambia la habitación o check-in
  useEffect(() => {
    if (roomId && checkIn && !suggestedCheckOut) {
      getSuggestedCheckOut()
    }
  }, [roomId, checkIn, suggestedCheckOut])

  const onSubmit = async (data: ReservationFormData) => {
    setLoading(true)
    
    try {
      // Convertir las fechas a UTC para enviar al backend
      const checkInUTC = new Date(data.checkIn).toISOString()
      const checkOutUTC = new Date(data.checkOut).toISOString()
      
      const reservationData = {
        ...data,
        checkIn: checkInUTC,
        checkOut: checkOutUTC
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservationData),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Reserva creada exitosamente')
        onSuccess()
      } else {
        toast.error(result.error || 'Error al crear la reserva')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  // Filtrar habitaciones según el modo
  const availableRooms = availabilityMode 
    ? rooms.filter(room => room.isAvailable && (room as any).availableAt === true)
    : rooms.filter(room => room.isAvailable && !room.isOccupied)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Nueva Reserva</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Información del Cliente */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Información del Cliente
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  {...register('clientName')}
                  className="input-field"
                  placeholder="Nombre completo"
                />
                {errors.clientName && (
                  <p className="text-red-500 text-sm mt-1">{errors.clientName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DNI *
                </label>
                <input
                  type="text"
                  {...register('clientDni')}
                  className="input-field"
                  placeholder="12345678"
                />
                {errors.clientDni && (
                  <p className="text-red-500 text-sm mt-1">{errors.clientDni.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Procedencia *
                </label>
                <input
                  type="text"
                  {...register('clientOrigin')}
                  className="input-field"
                  placeholder="Ciudad de origen"
                />
                {errors.clientOrigin && (
                  <p className="text-red-500 text-sm mt-1">{errors.clientOrigin.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dedicación (Opcional)
                </label>
                <input
                  type="text"
                  {...register('clientOccupation')}
                  className="input-field"
                  placeholder="Profesión u ocupación"
                />
              </div>
            </div>
          </div>

          {/* Información de la Reserva */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Información de la Reserva
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Habitación *
                </label>
                <select
                  {...register('roomId')}
                  className="input-field"
                >
                  <option value="">Seleccionar habitación</option>
                  {availableRooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      Hab. {room.number} - {room.type === 'PLAZA_MEDIA' ? 'Plaza 1/2' : 
                          room.type === 'DOS_PLAZAS' ? '2 Plazas' : 'Doble'} (S/ {room.price})
                    </option>
                  ))}
                </select>
                {errors.roomId && (
                  <p className="text-red-500 text-sm mt-1">{errors.roomId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check-in *
                </label>
                <input
                  type="datetime-local"
                  {...register('checkIn')}
                  className="input-field"
                  readOnly={availabilityMode}
                />
                {errors.checkIn && (
                  <p className="text-red-500 text-sm mt-1">{errors.checkIn.message}</p>
                )}
                {availabilityMode && (
                  <p className="text-sm text-blue-600 mt-1">
                    Fecha seleccionada desde consulta de disponibilidad
                  </p>
                )}
              </div>
            </div>

            {/* Check-out manual */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check-out *
              </label>
              <input
                type="datetime-local"
                {...register('checkOut', { required: true })}
                className="input-field"
              />
              {errors.checkOut && (
                <p className="text-red-500 text-sm mt-1">{errors.checkOut.message}</p>
              )}
            </div>

            {/* Botón de check-out sugerido inteligente */}
            {suggestedCheckOut && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Check-out sugerido</p>
                      <p className="text-sm text-blue-700">
                        {new Date(suggestedCheckOut).toLocaleString('es-PE', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })}
                      </p>
                      {suggestionReason && (
                        <p className="text-xs text-blue-600 mt-1">{suggestionReason}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setValue('checkOut', suggestedCheckOut, { shouldValidate: true })
                      toast.success('Check-out sugerido aplicado')
                    }}
                    disabled={loadingSuggestion}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {loadingSuggestion ? 'Calculando...' : 'Aplicar'}
                  </button>
                </div>
              </div>
            )}

            {/* Información de la habitación seleccionada */}
            {currentRoom && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Habitación Seleccionada</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Número:</span>
                    <span className="font-medium ml-2">Habitación {currentRoom.number}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Tipo:</span>
                    <span className="font-medium ml-2">
                      {currentRoom.type === 'PLAZA_MEDIA' ? 'Plaza 1/2' : 
                       currentRoom.type === 'DOS_PLAZAS' ? '2 Plazas' : 'Doble'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Precio por hora:</span>
                    <span className="font-medium ml-2">S/ {currentRoom.price}</span>
                  </div>
                  {/* Información de disponibilidad */}
                  {currentRoom.additionalInfo && (
                    <div className="col-span-2">
                      <span className="text-gray-600">Disponibilidad:</span>
                      <span className="font-medium ml-2 text-blue-600">
                        {currentRoom.additionalInfo.type === 'available_until' && 
                          `Disponible hasta ${currentRoom.additionalInfo.time}`}
                        {currentRoom.additionalInfo.type === 'occupied_until' && 
                          `Ocupada hasta ${currentRoom.additionalInfo.time}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Creando...' : 'Crear Reserva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 