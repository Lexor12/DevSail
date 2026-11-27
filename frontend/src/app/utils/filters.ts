import { ParamMap, Params } from '@angular/router';
import { SearchFilters } from '../models/project.model';

// Valores por defecto de la búsqueda
export const EMPTY_FILTERS: SearchFilters = {
  q: '',
  type: '',
  technologies: [],
  minRating: 0,
  maxRating: 5,
  feedback: false,
  collaborate: false,
  demo: false,
  featured: false,
  sort: 'recent',
  page: 1,
  pageSize: 12
};
 
export const MAX_TECHNOLOGIES = 5;
// Convierte el formulario de filtros en parámetros para la dirección
// Solo agrega los que cambian del valor por defecto para que quede corta
export function formToQueryParams(data: FormData): Params {
  const params: Params = {};
  const q = (data.get('q') as string | null)?.trim();
  const type = data.get('type') as string | null;
  const technologies = data.getAll('technologies') as string[];
  const minRating = data.get('minRating') as string | null;
  const maxRating = data.get('maxRating') as string | null;
  const sort = data.get('sort') as string | null;
 
  if (q) params['q'] = q;
  if (type) params['type'] = type;
  if (technologies.length > 0) params['technologies'] = technologies.slice(0, MAX_TECHNOLOGIES).join(',');
  if (minRating && minRating !== '0') params['minRating'] = minRating;
  if (maxRating && maxRating !== '5') params['maxRating'] = maxRating;
  if (data.get('feedback')) params['feedback'] = 'true';
  if (data.get('collaborate')) params['collaborate'] = 'true';
  if (data.get('demo')) params['demo'] = 'true';
  if (data.get('featured')) params['featured'] = 'true';
  if (sort && sort !== 'recent') params['sort'] = sort;
  return params;
}
// Lee la dirección y arma los filtros que usan la página y el servicio
export function queryParamsToFilters(params: ParamMap): SearchFilters {
  const toNumber = (value: string | null, fallback: number) => {
    const n = Number(value);
    return value !== null && !isNaN(n) ? n : fallback;
  };
  const pageSize = toNumber(params.get('pageSize'), 12);
  const page = toNumber(params.get('page'), 1);

  return {
    q: params.get('q') ?? '',
    type: params.get('type') ?? '',
    technologies: (params.get('technologies') ?? '').split(',').filter(t => t !== ''),
    minRating: toNumber(params.get('minRating'), 0),
    maxRating: toNumber(params.get('maxRating'), 5),
    feedback: params.get('feedback') === 'true',
    collaborate: params.get('collaborate') === 'true',
    demo: params.get('demo') === 'true',
    featured: params.get('featured') === 'true',
    sort: params.get('sort') ?? 'recent',
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    pageSize: [12, 24, 48].includes(pageSize) ? pageSize : 12
  };
}