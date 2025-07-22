'use client'

import { useState } from 'react'
import { Calendar, Clock, RotateCcw } from 'lucide-react'

interface DateSelectorProps {
  selectedDateTime: string
  onDateTimeChange: (datetime: string) => void
  onReset: () => void
}

export default function DateSelector({ selectedDateTime, onDateTimeChange, onReset }: DateSelectorProps) {
  const [isCustomTime, setIsCustomTime] = useState(false)
  const [tempDateTime, setTempDateTime] = useState('')

  const formatDisplayDate = (datetime: string) => {
    if (!datetime) return 'Seleccionar fecha'
    
    const date = new Date(datetime)
    const now = new Date()
    
    // Verificar si es hoy (comparar en hora local)
    const isToday = date.toDateString() === now.toDateString()
    
    const formattedDate = date.toLocaleDateString('es-PE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Lima'
    })
    
    const formattedTime = date.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Lima'
    })
    
    return `${isToday ? 'Hoy' : formattedDate} a las ${formattedTime}`
  }

  const handleQuickSelect = (hours: number) => {
    const now = new Date()
    const targetDate = new Date(now.getTime() + hours * 60 * 60 * 1000)
    
    // Formatear para datetime-local input
    const year = targetDate.getFullYear()
    const month = String(targetDate.getMonth() + 1).padStart(2, '0')
    const day = String(targetDate.getDate()).padStart(2, '0')
    const hour = String(targetDate.getHours()).padStart(2, '0')
    const minute = String(targetDate.getMinutes()).padStart(2, '0')
    
    const formattedDateTime = `${year}-${month}-${day}T${hour}:${minute}`
    onDateTimeChange(formattedDateTime)
    setIsCustomTime(false)
    setTempDateTime('')
  }

  const handleSearchAvailability = () => {
    if (tempDateTime) {
      onDateTimeChange(tempDateTime)
      setIsCustomTime(false)
    }
  }

  const getCurrentDateTime = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hour = String(now.getHours()).padStart(2, '0')
    const minute = String(now.getMinutes()).padStart(2, '0')
    
    return `${year}-${month}-${day}T${hour}:${minute}`
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Consultar Disponibilidad
        </h3>
        
        <button
          onClick={onReset}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center"
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Ver actual
        </button>
      </div>

      {/* Botones de selección rápida */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => handleQuickSelect(0)}
          className="px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
        >
          Ahora
        </button>
        
        <button
          onClick={() => {
            setIsCustomTime(!isCustomTime)
            // Abrir automáticamente el selector de fecha después de un pequeño delay
            setTimeout(() => {
              const dateInput = document.querySelector('input[type="datetime-local"]') as HTMLInputElement
              if (dateInput) {
                dateInput.focus()
                dateInput.showPicker?.()
              }
            }, 100)
          }}
          className="px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 transition-colors flex items-center justify-center"
        >
          <Clock className="h-4 w-4 mr-1" />
          Personalizar
        </button>
      </div>

      {/* Selector de fecha/hora personalizado */}
      {isCustomTime && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha y Hora Específica
          </label>
          <div className="flex gap-2">
            <input
              type="datetime-local"
              value={tempDateTime || getCurrentDateTime()}
              onChange={(e) => setTempDateTime(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min={getCurrentDateTime()}
            />
            <button
              onClick={handleSearchAvailability}
              disabled={!tempDateTime}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Buscar
            </button>
          </div>
        </div>
      )}

      {/* Mostrar fecha seleccionada */}
      {selectedDateTime && (
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>Consultando disponibilidad para:</strong>
          </p>
          <p className="text-blue-900 font-medium">
            {formatDisplayDate(selectedDateTime)}
          </p>
        </div>
      )}
    </div>
  )
} 