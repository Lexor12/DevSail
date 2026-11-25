import { IMAGES_URL } from '../config/api';
 
// Funciones pequeñas para mostrar datos; las usan varias pantallas
// Las iniciales, de "Eso Tilin" a "ET"
export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  const first = parts[0]?.[0] ?? '';
  const second = parts.length > 1 ? parts[1][0] : '';
  return (first + second).toUpperCase();
}
 
// Para que las fechas pasen de "2026-11-03T..." a "3 nov 2026"
export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '');
}
 
// Para que el puntaje en estrellas se muestre tipo de 4.3 a "★★★★☆"
// Me copié del formato que sacó kenneth la vdd, gracias gng
export function stars(value: number | string | null | undefined): string {
  const full = Math.round(Number(value ?? 0));
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}
 
// Que el promedio que manda Postgres como texto pase a "4.3" en calificación, o ya de plano 0.0 si no hay
export function score(value: number | string | null | undefined): string {
  return Number(value ?? 0).toFixed(1);
}
 
// Pasamos de la ruta del bucket a la dirección completa de la imagen (null si todavía no hay bucket configurado)
export function imageUrl(path: string | null | undefined): string | null {
  return path && IMAGES_URL ? IMAGES_URL + path : null;
}
 
// Convierte un archivo elegido en un <input type="file"> a texto base64 (data URL), que es lo que pide el backend
export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}