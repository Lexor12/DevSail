import { Component, input, output } from '@angular/core';

export interface ActiveFilter {
  key: string;     // nombre del parámetro en la dirección
  value?: string;  // solo para tecnologías, que pueden ser varias
  text: string;    // lo que ve el usuario en la etiqueta
}

@Component({
  selector: 'app-active-filters',
  templateUrl: './active-filters.html',
  styleUrl: './active-filters.css'
})
export class ActiveFilters {
  filters = input<ActiveFilter[]>([]);
  remove = output<ActiveFilter>();
  clearAll = output<void>();
}