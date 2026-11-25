import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

// Menú lateral de Mi cuenta, la página le dice cuál opción está activa
@Component({
  selector: 'app-account-menu',
  imports: [RouterLink],
  templateUrl: './account-menu.html',
  styleUrl: './account-menu.css'
})
export class AccountMenu {
  active = input.required<'data' | 'projects' | 'saved' | 'plan' | 'stats' | 'delete'>();
}
