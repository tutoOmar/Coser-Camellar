import { Component, computed, inject, signal } from '@angular/core';
import { WorksService } from '../../services/works.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import CardSateliteComponent from '../../../shared/ui/card-satelite/card-satelite.component';
import { SateliteUser } from '../models/satelite.model';

const COLLECTION_DATA = 'satelite';

@Component({
  selector: 'app-satelites',
  standalone: true,
  imports: [CardSateliteComponent, CommonModule, RouterModule],
  templateUrl: './satelites.component.html',
  styleUrl: './satelites.component.scss',
})
export default class SatelitesComponent {
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
    const satelites = this.sateliteListSignal() as SateliteUser[];
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
    this._router.navigate(['/works/satelite', workerId]);
  }
  createUsers() {
    this.service.addSpecificUser();
  }
}
