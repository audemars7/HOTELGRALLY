import { format, addDays, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';

export interface TimeRange {
  start: Date;
  end: Date;
}

/**
 * Calcula la fecha y hora de check-out basada en la hora de check-in
 * Lógica: Si ingresa entre 12:00 AM y 5:59 AM → Check-out a la 1:00 PM del mismo día
 *         Si ingresa entre 6:00 AM y 11:59 PM → Check-out a la 1:00 PM del día siguiente
 */
export const calculateCheckOut = (checkIn: Date): Date => {
  const checkInHour = checkIn.getHours();
  
  let checkOutDate: Date;
  
  if (checkInHour >= 0 && checkInHour <= 5) {
    // Check-in entre 12:00 AM y 5:59 AM → Check-out a la 1:00 PM del mismo día
    checkOutDate = setTimeTo1PM(checkIn);
  } else {
    // Check-in entre 6:00 AM y 11:59 PM → Check-out a la 1:00 PM del día siguiente
    const nextDay = addDays(checkIn, 1);
    checkOutDate = setTimeTo1PM(nextDay);
  }
  
  return checkOutDate;
};

/**
 * Establece la hora a 12:59 PM en una fecha dada
 */
export const setTimeTo1PM = (date: Date): Date => {
  return setMilliseconds(setSeconds(setMinutes(setHours(date, 12), 59), 0), 0);
};

/**
 * Verifica si dos rangos de tiempo se solapan
 */
export const isTimeOverlap = (range1: TimeRange, range2: TimeRange): boolean => {
  return range1.start < range2.end && range2.start < range1.end;
};

/**
 * Formatea una fecha para mostrar en la interfaz
 */
export const formatDateTime = (date: Date): string => {
  return format(date, 'dd/MM/yyyy HH:mm');
};

/**
 * Formatea solo la fecha
 */
export const formatDate = (date: Date): string => {
  return format(date, 'dd/MM/yyyy');
};

/**
 * Formatea solo la hora
 */
export const formatTime = (date: Date): string => {
  return format(date, 'HH:mm');
};

/**
 * Obtiene la duración en horas entre dos fechas
 */
export const getDurationInHours = (start: Date, end: Date): number => {
  const diffInMs = end.getTime() - start.getTime();
  return Math.ceil(diffInMs / (1000 * 60 * 60)); // Convertir a horas y redondear hacia arriba
};

/**
 * Verifica si una fecha está en el pasado
 */
export const isPastDate = (date: Date): boolean => {
  return date < new Date();
};

/**
 * Verifica si una fecha está en el futuro
 */
export const isFutureDate = (date: Date): boolean => {
  return date > new Date();
};