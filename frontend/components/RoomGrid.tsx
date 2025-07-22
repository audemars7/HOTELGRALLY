import { Bed, Users, User } from 'lucide-react'
import { Room } from '@/types'

interface RoomGridProps {
  rooms: Room[]
  onRoomClick: (room: Room) => void
  availabilityMode?: boolean
}

const roomTypeIcons = {
  PLAZA_MEDIA: User,
  DOS_PLAZAS: Users,
  DOBLE: Bed
}

const roomTypeLabels = {
  PLAZA_MEDIA: 'Plaza 1/2',
  DOS_PLAZAS: '2 Plazas',
  DOBLE: 'Doble'
}

const roomTypeColors = {
  PLAZA_MEDIA: 'bg-blue-100 text-blue-800 border-blue-300',
  DOS_PLAZAS: 'bg-green-100 text-green-800 border-green-300',
  DOBLE: 'bg-purple-100 text-purple-800 border-purple-300'
}

export default function RoomGrid({ rooms, onRoomClick, availabilityMode = false }: RoomGridProps) {
  const getRoomStatus = (room: Room) => {
    // En modo de disponibilidad, usar la propiedad availableAt
    if (availabilityMode) {
      const availableAt = (room as any).availableAt
      const reason = (room as any).reason
      
      if (!room.isAvailable) {
        return {
          status: 'Mantenimiento',
          className: 'room-maintenance',
          color: 'bg-yellow-500'
        }
      }
      
      if (availableAt === false) {
        return {
          status: 'Ocupada',
          className: 'room-occupied',
          color: 'bg-red-500'
        }
      }
      
      return {
        status: 'Disponible',
        className: 'room-available',
        color: 'bg-green-500'
      }
    }
    
    // Modo normal (estado actual)
    if (!room.isAvailable) {
      return {
        status: 'Mantenimiento',
        className: 'room-maintenance',
        color: 'bg-yellow-500'
      }
    }
    if (room.isOccupied) {
      return {
        status: 'Ocupada',
        className: 'room-occupied',
        color: 'bg-red-500'
      }
    }
    return {
      status: 'Disponible',
      className: 'room-available',
      color: 'bg-green-500'
    }
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {rooms.map((room) => {
        const roomStatus = getRoomStatus(room)
        const Icon = roomTypeIcons[room.type]
        
        return (
          <div
            key={room.id}
            onClick={() => onRoomClick(room)}
            className={`card cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${
              room.isAvailable && !room.isOccupied ? 'hover:border-primary-300' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Icon className="h-5 w-5 text-gray-600 mr-2" />
                <span className="text-lg font-semibold text-gray-900">
                  Hab. {room.number}
                </span>
              </div>
              <div className={`w-3 h-3 rounded-full ${roomStatus.color}`}></div>
            </div>
            
            <div className="space-y-2">
              <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${roomTypeColors[room.type]}`}>
                {roomTypeLabels[room.type]}
              </div>
              
              <div className="text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Precio:</span>
                  <span className="font-medium">S/ {room.price}</span>
                </div>
              </div>
              
              <div className={`text-xs font-medium ${roomStatus.className} px-2 py-1 rounded-full text-center`}>
                {roomStatus.status}
              </div>
              
              {/* Información adicional para habitaciones con reservas futuras */}
              {room.additionalInfo && (
                <div className="text-xs text-gray-500 text-center mt-1">
                  {room.additionalInfo.type === 'occupied_until' && (
                    <span>Ocupada hasta {room.additionalInfo.time}</span>
                  )}
                  {room.additionalInfo.type === 'available_until' && (
                    <span>Disponible hasta {room.additionalInfo.time}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
} 