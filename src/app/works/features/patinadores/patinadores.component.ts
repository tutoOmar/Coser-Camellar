import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import CardCalificationComponent from '../../../shared/ui/card-calification/card-calification.component';
import { WorksService } from '../../services/works.service';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { AnalyticsService } from '../../../shared/data-access/analytics.service';

const COLLECTION_DATA = 'trabajadores';
const CONCEPT_FILTER = 'patinaje';
@Component({
  selector: 'app-patinadores',
  standalone: true,
  imports: [CardCalificationComponent, CommonModule, RouterModule],
  templateUrl: './patinadores.component.html',
  styleUrl: './patinadores.component.scss',
})
export default class PatinadoresComponent implements AfterViewInit {
  //Inyecciones importantes
  private _router = inject(Router);
  private searchSubject = new Subject<string>();
  // Signal que recibe la lista de trabajadores desde el servicio
  workersListSignal = inject(WorksService).getWorkersSignal(COLLECTION_DATA);
  private analyticsService = inject(AnalyticsService);

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
  ngAfterViewInit() {
    this.analyticsService.logPageVisit('patinadores');
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
