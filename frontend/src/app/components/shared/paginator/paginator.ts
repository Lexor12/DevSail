import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-paginator',
  templateUrl: './paginator.html',
  styleUrl: './paginator.css'
})
export class Paginator {
  total = input(0);
  page = input(1);
  pageSize = input(12);
  pageChange = output<number>();
  pageSizeChange = output<number>();

  readonly sizes = [12, 24, 48];

  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  from = computed(() => (this.total() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1));
  to = computed(() => Math.min(this.page() * this.pageSize(), this.total()));

  // Hasta 5 números alrededor de la página actual
  pages = computed(() => {
    const total = this.totalPages();
    const start = Math.max(1, Math.min(this.page() - 2, total - 4));
    const end = Math.min(total, start + 4);
    const list: number[] = [];
    for (let i = start; i <= end; i++) list.push(i);
    return list;
  });

  changeSize(event: Event): void {
    this.pageSizeChange.emit(Number((event.target as HTMLSelectElement).value));
  }
}