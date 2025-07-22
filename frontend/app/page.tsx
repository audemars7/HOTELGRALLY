'use client'

import { useState, useEffect } from 'react'
import { Building2, Users, Calendar, Clock, Bed, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import RoomGrid from '@/components/RoomGrid'
import ReservationForm from '@/components/ReservationForm'
import ReservationDetailsModal from '@/components/ReservationDetailsModal'
import DateSelector from '@/components/DateSelector'
import StatsCard from '@/components/StatsCard'
import { Room, Reservation, Client } from '@/types'

export default function Home() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [stats, setStats] = useState({
    total: 0,
    occupied: 0,
    available: 0,
    occupancyRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [showReservationForm, setShowReservationForm] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [showReservationDetails, setShowReservationDetails] = useState(false)
  const [roomWithDetails, setRoomWithDetails] = useState<Room | null>(null)
  const [selectedDateTime, setSelectedDateTime] = useState<string>('')
  const [availabilityMode, setAvailabilityMode] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [roomsRes, reservationsRes, statsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rooms`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reservations`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rooms/stats/overview`)
      ])

      const roomsData = await roomsRes.json()
      const reservationsData = await reservationsRes.json()
      const statsData = await statsRes.json()

      if (roomsData.success) setRooms(roomsData.data)
      if (reservationsData.success) setReservations(reservationsData.data)
      if (statsData.success) setStats(statsData.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailabilityForDate = async (datetime: string) => {
    try {
      setLoading(true)
      // Convertir datetime a UTC para la consulta
      const datetimeUTC = new Date(datetime).toISOString()
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rooms/available/date/${encodeURIComponent(datetimeUTC)}`)
      const data = await response.json()
      
      if (data.success) {
        setRooms(data.data)
        setAvailabilityMode(true)
        
        // Calcular estadísticas basadas en la disponibilidad consultada
        const total = data.data.length
        const occupied = data.data.filter((room: any) => room.availableAt === false).length
        const available = data.data.filter((room: any) => room.availableAt === true && room.isAvailable).length
        const occupancyRate = total > 0 ? Math.round((occupied / total) * 100 * 10) / 10 : 0
        
        setStats({
          total,
          occupied,
          available,
          occupancyRate
        })
      }
    } catch (error) {
      console.error('Error fetching availability:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateTimeChange = (datetime: string) => {
    setSelectedDateTime(datetime)
    if (datetime) {
      fetchAvailabilityForDate(datetime)
    }
  }

  const handleResetToCurrentView = () => {
    setSelectedDateTime('')
    setAvailabilityMode(false)
    fetchData()
  }

  // Nueva función para cancelar reserva
  const handleCancelReservation = async (reservationId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reservations/${reservationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })

      const result = await response.json()

      if (result.success) {
        // Actualizar datos después de cancelar
        if (availabilityMode && selectedDateTime) {
          await fetchAvailabilityForDate(selectedDateTime)
        } else {
          await fetchData()
        }
        setShowReservationDetails(false)
        setRoomWithDetails(null)
      } else {
        throw new Error(result.error || 'Error al cancelar la reserva')
      }
    } catch (error) {
      console.error('Error al cancelar reserva:', error)
      throw error
    }
  }

  // Función para obtener la reserva activa de una habitación
  const getActiveReservation = (room: Room): Reservation | null => {
    if (availabilityMode && selectedDateTime) {
      // En modo consulta, buscar la reserva que corresponde a la fecha/hora específica
      const targetDate = new Date(selectedDateTime)
      return room.reservations?.find(r => {
        if (r.status !== 'ACTIVE') return false
        const checkIn = new Date(r.checkIn)
        const checkOut = new Date(r.checkOut)
        return targetDate >= checkIn && targetDate <= checkOut
      }) || null
    } else {
      // En modo normal, buscar cualquier reserva activa
      return room.reservations?.find(r => r.status === 'ACTIVE') || null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-primary-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">
                Sistema de Gestión Hotelera
              </h1>
            </div>
            <button
              onClick={() => {
                setSelectedRoom(null)
                setShowReservationForm(true)
              }}
              className="btn-primary flex items-center"
            >
              <Calendar className="h-5 w-5 mr-2" />
              Nueva Reserva
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Habitaciones"
            value={stats.total}
            icon={Bed}
            color="blue"
          />
          <StatsCard
            title="Ocupadas"
            value={stats.occupied}
            icon={CheckCircle}
            color="red"
          />
          <StatsCard
            title="Disponibles"
            value={stats.available}
            icon={XCircle}
            color="green"
          />
          <StatsCard
            title="Ocupación"
            value={`${stats.occupancyRate}%`}
            icon={AlertCircle}
            color="yellow"
          />
        </div>

        {/* Date Selector */}
        <DateSelector
          selectedDateTime={selectedDateTime}
          onDateTimeChange={handleDateTimeChange}
          onReset={handleResetToCurrentView}
        />

        {/* Room Grid */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {availabilityMode ? 'Disponibilidad para Fecha Seleccionada' : 'Estado de Habitaciones'}
            </h2>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span>Disponible</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span>Ocupada</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span>Mantenimiento</span>
              </div>
            </div>
          </div>
          <RoomGrid 
            rooms={rooms} 
            availabilityMode={availabilityMode}
            onRoomClick={(room) => {
              if (availabilityMode) {
                // En modo de disponibilidad
                const availableAt = (room as any).availableAt
                if (availableAt === false) {
                  // Habitación ocupada - mostrar detalles de la reserva
                  setRoomWithDetails(room)
                  setShowReservationDetails(true)
                } else if (availableAt && room.isAvailable) {
                  // Habitación disponible - mostrar formulario de reserva
                  setSelectedRoom(room)
                  setShowReservationForm(true)
                }
              } else {
                // Modo normal
                if (room.isOccupied) {
                  // Si la habitación está ocupada, mostrar detalles de la reserva
                  setRoomWithDetails(room)
                  setShowReservationDetails(true)
                } else if (room.isAvailable) {
                  // Si la habitación está disponible, mostrar formulario de reserva
                  setSelectedRoom(room)
                  setShowReservationForm(true)
                }
              }
            }} 
          />
        </div>
      </main>

      {/* Reservation Form Modal */}
      {showReservationForm && (
        <ReservationForm
          rooms={rooms}
          selectedRoom={selectedRoom}
          selectedDateTime={selectedDateTime}
          availabilityMode={availabilityMode}
          onClose={() => {
            setShowReservationForm(false)
            setSelectedRoom(null)
          }}
          onSuccess={() => {
            setShowReservationForm(false)
            setSelectedRoom(null)
            // Actualizar datos según el modo
            if (availabilityMode && selectedDateTime) {
              fetchAvailabilityForDate(selectedDateTime)
            } else {
              fetchData()
            }
          }}
        />
      )}

      {/* Reservation Details Modal */}
      {showReservationDetails && roomWithDetails && (
        <ReservationDetailsModal
          isOpen={showReservationDetails}
          room={roomWithDetails}
          reservation={getActiveReservation(roomWithDetails)}
          onClose={() => {
            setShowReservationDetails(false)
            setRoomWithDetails(null)
          }}
          onCancelReservation={handleCancelReservation}
        />
      )}
    </div>
  )
}