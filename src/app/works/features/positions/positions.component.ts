import {
  Component,
  computed,
  signal,
  inject,
  AfterViewInit,
} from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { WorksService } from '../../services/works.service';
import { SateliteUser } from '../models/satelite.model';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import CardSateliteComponent from '../../../shared/ui/card-satelite/card-satelite.component';
import { TallerUSer } from '../models/talleres.model';
import { Position } from '../models/position.model';
import CardPositionComponent from '../../../shared/ui/card-position/card-position.component';
import { AnalyticsService } from '../../../shared/data-access/analytics.service';

const COLLECTION_DATA_TALLER = 'talleres';
const COLLECTION_DATA_SATELITE = 'satelite';

@Component({
  selector: 'app-positions',
  standalone: true,
  imports: [CardPositionComponent, CommonModule, RouterModule],
  templateUrl: './positions.component.html',
  styleUrl: './positions.component.scss',
})
export default class PositionsComponent implements AfterViewInit {
  service = inject(WorksService);
  //Inyecciones importantes
  private _router = inject(Router);
  private searchSubject = new Subject<string>();
  private analyticsService = inject(AnalyticsService);

  // Signal que recibe la lista de trabajadores desde el servicio
  sateliteListSignal = inject(WorksService).getSateliteSignal(
    COLLECTION_DATA_SATELITE
  );
  tallerListSignal = inject(WorksService).getWorkersSignal(
    COLLECTION_DATA_TALLER
  );
  // Signal para almacenar la lista filtrada
  positionsFilteredSignal = signal<SateliteUser[]>([]);
  // Debounce value for the search input
  searchValueSignal = signal<string>('');
  // Computed para obtener la lista filtrada
  filteredPositionSateliteSignal = computed(() => {
    const satelites = this.sateliteListSignal() as SateliteUser[];
    const searchValue = this.searchValueSignal().toLowerCase();

    // Si no hay trabajadores, retornamos un array vacío
    if (!satelites) return [];

    // Filtramos satélites
    const filteredSatelites = satelites
      .map((satelite) => {
        if (searchValue) {
          const positionFind = satelite.positions.filter(
            (position: Position) => {
              return (
                position.name.toLowerCase().includes(searchValue) ||
                position.city.toLowerCase().includes(searchValue) ||
                position.experience.toLowerCase().includes(searchValue) ||
                position.neighborhood.toLowerCase().includes(searchValue) ||
                position.typePayment.toLowerCase().includes(searchValue)
              );
            }
          );

          // Si se encontraron posiciones, retornamos el satelite con posiciones filtradas
          if (positionFind.length > 0) {
            return {
              ...satelite,
              positions: positionFind,
            };
          }
          return null; // Retornamos null si no hay coincidencias para este satelite
        } else {
          return satelite;
        }
      })
      .filter((satelite) => satelite !== null); // Eliminamos los nulos
    // Actualizamos la señal positionsFilteredSignal
    return filteredSatelites;
  });
  // Computed para obtener la lista filtrada
  filteredPositionTallerSignal = computed(() => {
    const talleres = this.tallerListSignal() as TallerUSer[];
    const searchValue = this.searchValueSignal().toLowerCase();

    // Si no hay trabajadores, retornamos un array vacío
    if (!talleres) return [];

    // Filtramos satélites
    const filteredTalleres = talleres
      .map((taller) => {
        if (searchValue && searchValue.length > 0) {
          const positionFind = taller.positions.filter((position: Position) => {
            return (
              position.name.toLowerCase().includes(searchValue) ||
              position.city.toLowerCase().includes(searchValue) ||
              position.experience.toLowerCase().includes(searchValue) ||
              position.neighborhood.toLowerCase().includes(searchValue) ||
              position.typePayment.toLowerCase().includes(searchValue)
            );
          });

          // Si se encontraron posiciones, retornamos el satelite con posiciones filtradas
          if (positionFind.length > 0) {
            return {
              ...taller,
              positions: positionFind,
            };
          }
          return null; // Retornamos null si no hay coincidencias para este satelite
        } else {
          return taller;
        }
      })
      .filter((satelite) => satelite !== null); // Eliminamos los nulos
    // Actualizamos la señal positionsFilteredSignal
    return filteredTalleres;
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
    this.analyticsService.logPageVisit('ofertas-laborales');
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
}
