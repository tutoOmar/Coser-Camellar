import { Component, computed, inject, OnInit, signal } from '@angular/core';
import CardCalificationComponent from '../../../shared/ui/card-calification/card-calification.component';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { WorksService } from '../../services/works.service';
import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  takeUntil,
  tap,
} from 'rxjs';
import { AuthStateService } from '../../../shared/data-access/auth-state.service';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CardCalificationComponent, CommonModule, RouterModule],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export default class MainComponent implements OnInit {
  private destroy$ = new Subject<void>();
  private authState = inject(AuthStateService);
  private userService = inject(WorksService);
  private _router = inject(Router);
  readonly MAX_DISPLAY_COUNT = 5;

  currentStatusState = signal<boolean>(false);
  searchValueSignal = signal<string>('');
  workersListSignal = inject(WorksService).getWorkersSignal('trabajadores');

  // Categorías disponibles
  categories = ['costura', 'corte', 'patinaje', 'arreglo', 'patronaje'];

  // Trabajadores clasificados por categoría
  categorizedWorkersSignal = computed(() => {
    const workers = this.workersListSignal();
    const searchValue = this.searchValueSignal().toLowerCase();

    if (!workers) return {};

    const categorizedWorkers: Record<string, any[]> = {};

    // Inicializar las categorías con listas vacías
    this.categories.forEach((category) => {
      categorizedWorkers[category] = [];
    });

    workers.forEach((worker) => {
      const firstSpecialty = worker.specialty?.[0]?.toLowerCase();
      const matchingCategory = this.categories.find((category) =>
        firstSpecialty?.includes(category)
      );

      if (matchingCategory) {
        const matchesSearch = searchValue
          ? worker.name.toLowerCase().includes(searchValue) ||
            worker.city.toLowerCase().includes(searchValue) ||
            worker.country.toLowerCase().includes(searchValue)
          : true;

        if (
          matchesSearch &&
          categorizedWorkers[matchingCategory].length < this.MAX_DISPLAY_COUNT
        ) {
          categorizedWorkers[matchingCategory].push(worker);
        }
      }
    });
    return categorizedWorkers;
  });

  constructor() {
    this.searchValueSignal.set('');
  }

  ngOnInit(): void {
    this.authState.isAuthenticated$
      .pipe(
        takeUntil(this.destroy$),
        tap((authStatus) => this.currentStatusState.set(authStatus))
      )
      .subscribe();
  }

  onSearch(value: any) {
    this.searchValueSignal.set(value.target.value);
  }

  onWorkerSelected(workerId: string | undefined) {
    this._router.navigate(['/works/worker', workerId]);
  }
  onViewMore(category: string): void {
    this._router.navigate([
      '/works',
      this.convertNameCategoryToRoute(category),
    ]); // Cambia la ruta según tu estructura
  }
  /**
   * Funcion para convertir las categorias en rutas especificas
   * @param category
   * @returns
   */
  convertNameCategoryToRoute(category: string): string {
    switch (category) {
      case 'costura':
        return 'costureros';
      case 'corte':
        return 'cortadores';
      case 'patinaje':
        return 'patinadores';
      case 'arreglo':
        return 'mecanicos';
      case 'patronaje':
        return 'patronistas';
      default:
        return '';
    }
  }
  /**
   * Funcion para convertir las categorias en el HTML mostra un buen titulo por categoria
   * @param category
   * @returns
   */
  convertNameCategoryToPresentInHTML(category: string): string {
    switch (category) {
      case 'costura':
        return 'Costureros(as)';
      case 'corte':
        return 'Cortadores(as)';
      case 'patinaje':
        return 'Patinadores(as)';
      case 'arreglo':
        return 'Arreglo de máquinas';
      case 'patronaje':
        return 'Patronaje';
      default:
        return '';
    }
  }
}
