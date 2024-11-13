import { Component, computed, inject, signal } from '@angular/core';
import { TallerUSer } from '../models/talleres.model';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import CardCalificationComponent from '../../../shared/ui/card-calification/card-calification.component';
import CardSateliteComponent from '../../../shared/ui/card-satelite/card-satelite.component';
import { WorksService } from '../../services/works.service';

const COLLECTION_DATA = 'talleres';

@Component({
  selector: 'app-talleres',
  standalone: true,
  imports: [
    CardCalificationComponent,
    CardSateliteComponent,
    CommonModule,
    RouterModule,
  ],
  templateUrl: './talleres.component.html',
  styleUrl: './talleres.component.scss',
})
export default class TalleresComponent {
  service = inject(WorksService);
  //Inyecciones importantes
  private _router = inject(Router);
  private searchSubject = new Subject<string>();
  // Signal que recibe la lista de trabajadores desde el servicio
  sateliteListSignal = inject(WorksService).getWorkersSignal(COLLECTION_DATA);
  // Debounce value for the search input
  searchValueSignal = signal<string>('');
  // Signal computada que filtra los trabajadores por alguna característica
  filteredSatelitesSignal = computed(() => {
    const satelites = this.sateliteListSignal() as TallerUSer[];
    const searchValue = this.searchValueSignal().toLowerCase();
    // Si no hay trabajdores returna vacio
    if (!satelites) return [];
    // Se filtra
    return satelites.filter((satelite) => {
      if (searchValue) {
        return (
          // Aquí utilizamos el criterio de busqueda del input
          // y debe cumplir con el criterio del filtro según cada categoria de trabajo
          // Ejemplo cortadores
          (satelite.name.toLowerCase().includes(searchValue) ||
            satelite.specialty.some((specialty: string) =>
              specialty.toLowerCase().includes(searchValue)
            ) ||
            satelite.experience.some((experience: string) =>
              experience.toLowerCase().includes(searchValue)
            ) ||
            satelite.city.toLowerCase().includes(searchValue) ||
            satelite.country.toLowerCase().includes(searchValue) ||
            satelite.neighborhood.toLowerCase().includes(searchValue) ||
            satelite.responsible.toLowerCase().includes(searchValue)) &&
          satelite
        );
      } else {
        return satelite;
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
    this._router.navigate(['/works/talleres', workerId]);
  }
}
