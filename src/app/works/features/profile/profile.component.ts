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
  mergeAll,
  concatMap,
  first,
  from,
} from 'rxjs';
import { SateliteUser } from '../models/satelite.model';
import { WorkerUser } from '../models/worker.model';
import { TallerUSer } from '../models/talleres.model';
import { CommonModule } from '@angular/common';
import CardPositionComponent from '../../../shared/ui/card-position/card-position.component';
import { user } from '@angular/fire/auth';
import StartsCalificationComponent from '../../../shared/ui/starts-calification/starts-calification.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    CardPositionComponent,
    RouterModule,
    StartsCalificationComponent,
  ],
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
  businessSignal = signal<TallerUSer | SateliteUser | null>(null);
  //
  userId!: string | undefined;
  COLLECTION_OPTIONS = ['satelite', 'trabajadores', 'talleres'];
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
        tap((userFound) => {
          if (userFound && userFound.length) {
            const user = userFound[0];
            if (user) {
              const typeUser = user.typeUSer;
              if (typeUser) {
                this.typeUser.set(typeUser);
              }
              if (typeUser == 'trabajadores') {
                this.workerSignal.set(user);
              } else if (typeUser == 'satelite' || typeUser == 'talleres') {
                this.businessSignal.set(user);
              }
            }
          }
        })
      )
      .subscribe();
  }
  /**
   *
   * @param collections
   * @param userId
   * @returns
   */
  loadWorker(collections: string[], userId: string) {
    return this.userService.getUserInAnyCollection(userId);
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
