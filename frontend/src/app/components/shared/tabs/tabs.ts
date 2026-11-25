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
  // 'compact' para la del inicio, 'full' ocupa todo el ancho (autenticación)
  variant = input<'compact'|'full'>('compact');
  changed = output<string>();
}
