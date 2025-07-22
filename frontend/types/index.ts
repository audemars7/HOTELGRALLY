export interface Room {
  id: string
  number: number
  type: 'PLAZA_MEDIA' | 'DOS_PLAZAS' | 'DOBLE'
  price: number
  isOccupied: boolean
  isAvailable: boolean
  createdAt: string
  updatedAt: string
  reservations?: Reservation[]
  // Propiedades para modo de disponibilidad
  availableAt?: boolean
  reason?: string
  additionalInfo?: {
    type: 'occupied_until' | 'available_until'
    time: string
  }
}

export interface Client {
  id: string
  name: string
  dni: string
  origin: string
  occupation?: string
  createdAt: string
  updatedAt: string
  reservations?: Reservation[]
}

export interface Reservation {
  id: string
  checkIn: string
  checkOut: string
  totalPrice: number
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
  updatedAt: string
  roomId: string
  clientId: string
  room?: Room
  client?: Client
}

export interface ReservationFormData {
  clientName: string
  clientDni: string
  clientOrigin: string
  clientOccupation?: string
  roomId: string
  checkIn: string
  checkOut: string
}

export interface RoomStats {
  total: number
  occupied: number
  available: number
  occupancyRate: number
  byType: Array<{
    type: string
    _count: {
      type: number
    }
  }>
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
} 