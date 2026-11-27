// Funciones pequeñas para mostrar datos en varias pantallas
// Saca las iniciales, de Eso Tilin a ET
export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  const first = parts[0]?.[0] ?? '';
  const second = parts.length > 1 ? parts[1][0] : '';
  return (first + second).toUpperCase();
}
// Muestra las fechas como 3 nov 2026
export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '');
}
// Convierte el promedio en estrellas llenas y vacías
// Me copié del formato que sacó kenneth la vdd, gracias gng
export function stars(value: number | string | null | undefined): string {
  const full = Math.round(Number(value ?? 0));
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}
// El promedio llega como texto y se muestra con un decimal, o 0.0 si no hay
export function score(value: number | string | null | undefined): string {
  return Number(value ?? 0).toFixed(1);
}
// Convierte el archivo elegido a base64 porque así lo pide el backend
export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}