import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { WorksService } from '../../services/works.service';
import { AuthStateService } from '../../../shared/data-access/auth-state.service';
import {
  catchError,
  of,
  forkJoin,
  map,
  filter,
  switchMap,
  tap,
  EMPTY,
  mergeMap,
  Observable,
  Subject,
  takeUntil,
} from 'rxjs';
import { SateliteUser } from '../models/satelite.model';
import { WorkerUser } from '../models/worker.model';
import { TallerUSer } from '../models/talleres.model';
import { CommonModule } from '@angular/common';
import CardPositionComponent from '../../../shared/ui/card-position/card-position.component';
import { user } from '@angular/fire/auth';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, CardPositionComponent, RouterModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export default class ProfileComponent implements OnInit {
  //
  typeUser = signal<string>('');
  //
  private destroy$: Subject<void> = new Subject<void>();
  //
  workerSignal = signal<WorkerUser | null>(null);
  //
  businessSginal = signal<TallerUSer | SateliteUser | null>(null);
  //
  userId!: string | undefined;
  COLLECTION_OPTIONS = ['satelite', 'talleres', 'trabajadores'];
  // Inyecciones de  servicios y otros necesarios
  private _auth = inject(AuthStateService);
  private currentRoute = inject(ActivatedRoute);
  private userService = inject(WorksService);
  /**
   *
   */
  ngOnInit() {
    this._auth.authState$
      .pipe(
        takeUntil(this.destroy$),
        switchMap((state: any) => {
          if (state && state.uid) {
            const userId = state.uid;
            return this.loadWorker(this.COLLECTION_OPTIONS, userId);
          } else {
            return of(null);
          }
        }),
        // tap((res) => console.log(res, 'respuesta de spues de ')),
        mergeMap((value) => {
          // console.log('En el mergeMap', value, value instanceof Observable);
          if (value instanceof Observable) {
            return value; // Esto "aplana" el Observable interno
          }
          return of(value); // Si no es un Observable, lo envolvemos en un Observable
        }),
        tap((userFound) => {
          // console.log(userFound);
          if (userFound) {
            this.typeUser.set(userFound[0].typeUSer);
          }
          const userData = userFound[0] ? userFound[0] : {};
          if (userData.typeUSer === 'trabajadores') {
            // console.log('Aqui entra?');
            this.workerSignal.set(userData as WorkerUser);
          } else if (userData.typeUSer === 'talleres') {
            this.businessSginal.set(userData as TallerUSer);
          } else if (userData.typeUSer === 'satelite') {
            this.businessSginal.set(userData as SateliteUser);
          } else {
            //por defecto
            this.workerSignal.set(userData);
          }
        })
      )
      .subscribe();

    if (this.userId) {
      this.loadWorker(this.COLLECTION_OPTIONS, this.userId);
    }
  }
  /**
   *
   * @param collections
   * @param userId
   * @returns
   */
  loadWorker(collections: string[], userId: string) {
    // console.log(collections, userId);
    const requests = collections.map((collectionName) =>
      this.userService
        .getUserByUserIdAndCollection(userId, collectionName)
        .pipe(
          // tap((res) => console.log(res, 'respuestas')),
          catchError(() => of(null))
        )
    );

    return forkJoin([requests]).pipe(
      // tap((res) => console.log('al combinar', res)),
      switchMap((results) => {
        const foundUser = results.find((result) => result !== null);
        return foundUser ? of(foundUser) : EMPTY;
      })
      // tap((res) => console.log('al despues', res))
    );
  }
  /**Remueve guiónes de las palabras que normalmente las lleva*/
  removeHyphens(wordWithHyphens: string[] | undefined): string {
    if (wordWithHyphens) {
      const newMap = wordWithHyphens.map((specialty: String) => {
        const wordUpperCase =
          specialty[0].toUpperCase() + specialty.substring(1);
        return wordUpperCase.replace(/-/g, ' ');
      });
      const specialtiesComplete = newMap.join(', ');
      return specialtiesComplete;
    } else {
      return '';
    }
  }
  // Traducir genero
  translateGender(gender: string | undefined) {
    if (!gender) return '';
    switch (gender) {
      case 'male':
        return 'Masculino';
      case 'female':
        return 'Femenino';
      case 'other':
        return 'Otro';
      default:
        return 'Error en genero';
    }
  }
  /**
   *
   * @param user
   */
  goToEditUser(user: WorkerUser | SateliteUser | TallerUSer | null) {}
  /**
   *
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
