import { Component,input } from '@angular/core';


// Este componente hace referencia a un campo de búsqueda mas el botón Buscar. Como tal este no tiene su propio <form>: va dentro del formulario
// ya sea en la página (home o explore), que lee el campo "q" con FormData al enviarse.
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
