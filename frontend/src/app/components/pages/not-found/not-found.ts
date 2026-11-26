import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

// Pantalla de error 404, se muestra con cualquier dirección que no exista
@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  templateUrl: './not-found.html',
  styleUrl: './not-found.css'
})
export class NotFound {}
