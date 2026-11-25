import { Component,input } from '@angular/core';


// Campo de búsqueda con su botón, no tiene form propio porque va dentro del formulario
// de la página, que lee el campo q con FormData
@Component({
  selector: 'app-search-bar',
  imports: [],
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.css',
})
export class SearchBar {
  value = input('');
  placeholder = input('Buscar por título, apodo o descripción…');
}
