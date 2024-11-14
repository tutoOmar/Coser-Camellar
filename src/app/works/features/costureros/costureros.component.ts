import { Component, computed, inject, OnInit, signal } from '@angular/core';
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

const COLLECTION_DATA = 'trabajadores';
const CONCEPT_FILTER = 'costura';

@Component({
  selector: 'app-costureros',
  standalone: true,
  imports: [CardCalificationComponent, CommonModule, RouterModule],
  templateUrl: './costureros.component.html',
  styleUrl: './costureros.component.scss',
})
export default class CosturerosComponent implements OnInit {
  // subject para destruir el componente
  private destroy$ = new Subject<void>(); // Controlador de destrucción
  // Estado actual
  private authState = inject(AuthStateService);
  private userService = inject(WorksService);
  currentStatusState = signal<boolean>(false);
  //Inyecciones importantes
  private _router = inject(Router);
  private searchSubject = new Subject<string>();
  // Signal que recibe la lista de trabajadores desde el servicio
  workersListSignal = inject(WorksService).getWorkersSignal(COLLECTION_DATA);
  // Debounce value for the search input
  searchValueSignal = signal<string>('');
  // Signal computada que filtra los trabajadores por alguna característica
  filteredWorkersSignal = computed(() => {
    const workers = this.workersListSignal();
    const searchValue = this.searchValueSignal().toLowerCase();
    // Si no hay trabajdores returna vacio
    if (!workers) return [];
    // Se filtra
    return workers.filter((worker) => {
      if (searchValue) {
        return (
          // Aquí utilizamos el criterio de busqueda del input
          // y debe cumplir con el criterio del filtro según cada categoria de trabajo
          // Ejemplo cortadores
          (worker.name.toLowerCase().includes(searchValue) ||
            worker.specialty.some((specialty: string) =>
              specialty.toLowerCase().includes(searchValue)
            ) ||
            worker.experience.some((experience: string) =>
              experience.toLowerCase().includes(searchValue)
            ) ||
            worker.city.toLowerCase().includes(searchValue) ||
            worker.country.toLowerCase().includes(searchValue)) &&
          worker.specialty.some((w: string) => w.includes(CONCEPT_FILTER))
        );
      } else {
        return worker.specialty.some((w: string) => w.includes(CONCEPT_FILTER));
      }
    });
  });
  /**
   *
   */
  constructor() {
    // Initialize debounce
    this.searchSubject
      .pipe(
        debounceTime(300), // Wait 300ms after last input
        distinctUntilChanged() // Only trigger if the search value changed
      )
      .subscribe((searchValue) => {
        this.searchValueSignal.set(searchValue);
      });
  }
  /**
   *
   */
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
        //Debemos validar que sí el status del usario en el registro está icimpleto pero existe ya un usuario lo reenvie al register para que finalice su registro
        if (!stateUserExist && this.currentStatusState()) {
          /** Esto se hace para cuando se regist pero aun no haya ingresado datos no pueda ir, es mejor manejarlo con un guard */
          this._router.navigate(['/auth/register']);
        }
      });
  }
  /**
   *
   * @param value
   */
  onSearch(value: any) {
    if (value.target.value) {
      this.searchSubject.next(value.target.value);
    }
  }
  /**
   *
   * @param workerId
   */
  onWorkerSelected(workerId: string | undefined) {
    this._router.navigate(['/works/worker', workerId]);
  }
}
