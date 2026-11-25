import { Component,input,output } from '@angular/core';

export interface TabOption {
  value: string;
  text: string;
}

@Component({
  selector: 'app-tabs',
  imports: [],
  templateUrl: './tabs.html',
  styleUrl: './tabs.css',
})
export class Tabs {
  options = input.required<TabOption[]>();
  selected = input.required<string>();
  // compact es para el inicio y full ocupa todo el ancho en autenticación
  variant = input<'compact'|'full'>('compact');
  changed = output<string>();
}
