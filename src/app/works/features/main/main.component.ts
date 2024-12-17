import {
  AfterViewInit,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import CardCalificationComponent from '../../../shared/ui/card-calification/card-calification.component';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { WorksService } from '../../services/works.service';
import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { AuthStateService } from '../../../shared/data-access/auth-state.service';
import LoadingComponent from '../../../shared/ui/loading/loading.component';
import { Analytics, getAnalytics, logEvent } from '@angular/fire/analytics';
import { AnalyticsService } from '../../../shared/data-access/analytics.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    CardCalificationComponent,
    CommonModule,
    RouterModule,
    LoadingComponent,
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
  providers: [AnalyticsService],
})
export default class MainComponent implements OnInit, AfterViewInit {
  private destroy$ = new Subject<void>();
  private authState = inject(AuthStateService);
  private userService = inject(WorksService);
  private _router = inject(Router);
  private analyticsService = inject(AnalyticsService);
  workersListSignal = inject(WorksService).getWorkersSignal('trabajadores');
  readonly MAX_DISPLAY_COUNT = 5;

  currentStatusState = signal<boolean>(false);
  searchValueSignal = signal<string>('');
  isLoading = signal<boolean>(true);
  // Categorías disponibles
  categories = ['costura', 'corte', 'patinaje', 'arreglo', 'patronaje'];

  categorizedWorkersSignal = computed(() => {
    const workers = this.workersListSignal();
    const searchValue = this.searchValueSignal().toLowerCase().trim();

    if (!workers) return {};

    // Inicializar las categorías con listas vacías
    const categorizedWorkers: Record<string, any[]> = {};
    this.categories.forEach((category) => {
      categorizedWorkers[category] = [];
    });

    workers.forEach((worker) => {
      const firstSpecialty = worker.specialty?.[0]?.toLowerCase();
      const matchingCategory = this.categories.find((category) =>
        firstSpecialty?.includes(category)
      );

      // Lógica de filtrado mejorada
      const matchesSearch =
        !searchValue ||
        worker.name.toLowerCase().includes(searchValue) ||
        worker.city.toLowerCase().includes(searchValue) ||
        worker.country.toLowerCase().includes(searchValue) ||
        firstSpecialty?.includes(searchValue);

      if (matchingCategory && matchesSearch) {
        categorizedWorkers[matchingCategory].push(worker);
      }
    });

    // Filtrar y retornar solo las categorías con trabajadores
    return Object.fromEntries(
      Object.entries(categorizedWorkers).filter(
        ([, workers]) => workers.length > 0
      )
    );
  });

  constructor() {
    this.searchValueSignal.set('');
  }

  ngOnInit(): void {
    this.authState.isAuthenticated$
      .pipe(
        takeUntil(this.destroy$),
        tap((authStatus) => this.currentStatusState.set(authStatus)),
        switchMap(() => {
          return this.userService.checkUserExists();
        })
      )
      .subscribe((stateUserExist) => {
        //Debemos validar que sí el status del usario en el registro está incompleto pero existe ya un usuario lo reenvie al register para que finalice su registro
        if (!stateUserExist && this.currentStatusState()) {
          /** Esto se hace para cuando se regist pero aun no haya ingresado datos no pueda ir, es mejor manejarlo con un guard */
          // this._router.navigate(['/auth/register']);
          Swal.fire({
            title: 'Llena tu perfil',
            text: 'Para que tu perfil sea visible te recomendamos completar tu perfil y así poder aparecer en las busquedas de otras personas.  ',
            icon: 'info',
            confirmButtonText: 'Aceptar',
          });

          Swal.fire({
            title: '¡Completa tu perfil!',
            text: 'Para que tu perfil sea visible te recomendamos completarlo y así poder aparecer en las busquedas de otras personas.  ',
            icon: 'info',
            showCancelButton: true, // Muestra el botón de cancelar
            confirmButtonText: 'Completar perfil', // Texto del botón de confirmación
            cancelButtonText: 'Luego lo completo', // Texto del botón de cancelar
          }).then((result) => {
            if (result.isConfirmed) {
              this._router.navigate(['/auth/register']);
            } else if (result.isDismissed) {
              Swal.close();
            }
          });
        }
        this.isLoading.set(false);
      });
  }
  /**
   *
   */
  ngAfterViewInit() {
    this.analyticsService.logPageVisit('worksAll');
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
