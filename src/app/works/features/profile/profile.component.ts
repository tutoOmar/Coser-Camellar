import {
  AfterViewInit,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { WorksService } from '../../services/works.service';
import { AuthStateService } from '../../../shared/data-access/auth-state.service';
import { of, switchMap, tap, Subject, takeUntil } from 'rxjs';
import { SateliteUser } from '../models/satelite.model';
import { WorkerUser } from '../models/worker.model';
import { TallerUSer } from '../models/talleres.model';
import { CommonModule } from '@angular/common';
import CardPositionComponent from '../../../shared/ui/card-position/card-position.component';
import StartsCalificationComponent from '../../../shared/ui/starts-calification/starts-calification.component';
import { PositionsService } from '../../services/positions.service';
import { toast } from 'ngx-sonner';
import { Position, StatusPositionEnum } from '../models/position.model';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import LoadingComponent from '../../../shared/ui/loading/loading.component';
import { AnalyticsService } from '../../../shared/data-access/analytics.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    CardPositionComponent,
    RouterModule,
    StartsCalificationComponent,
    FormsModule,
    ReactiveFormsModule,
    LoadingComponent,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export default class ProfileComponent implements OnInit, AfterViewInit {
  // Señal donde guardaremos el tipo de usuario para mostrar
  typeUser = signal<string>('');
  //
  private destroy$: Subject<void> = new Subject<void>();
  //Señal donde guardaremos si es un trabajador
  workerSignal = signal<WorkerUser | null>(null);
  // Señal donde guardaremos si es un satelite o un taller
  businessSignal = signal<TallerUSer | SateliteUser | null>(null);
  positionStatus = signal<boolean>(false);
  isLoadingPage = signal<boolean>(true);
  createProfileButton = signal<boolean>(false);
  //
  userId!: string | undefined;
  // Inyecciones de  servicios y otros necesarios
  private _auth = inject(AuthStateService);
  private userService = inject(WorksService);
  private positionService = inject(PositionsService);
  private analyticsService = inject(AnalyticsService);
  private _router = inject(Router);
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
            return this.loadWorker(userId);
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
                this.isLoadingPage.set(false);
                this.workerSignal.set(user);
              } else if (typeUser == 'satelite' || typeUser == 'talleres') {
                this.businessSignal.set(user);
                this.isLoadingPage.set(false);
              }
            }
          } else {
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
        })
      )
      .subscribe();
  }
  /**
   *
   */
  ngAfterViewInit() {
    this.analyticsService.logPageVisit('profile');
  }
  /**
   *
   * @param collections
   * @param userId
   * @returns
   */
  loadWorker(userId: string) {
    return this.userService.getUserByUserIdInAnyCollection(userId);
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
   */
  deletePosition(positionId: string) {
    const user = this.businessSignal();
    const typeUser = user?.typeUSer;
    if (user && typeUser) {
      this.positionService.deletePosition(typeUser, user, positionId);
    }
  }
  /**
   *
   */
  onToggleChange(event: Event, positionId: string): void {
    const checked = (event.target as HTMLInputElement).checked;
    const user = this.businessSignal();
    const userType = user?.typeUSer;
    if (user && userType) {
      user.positions.forEach((position: Position) => {
        if (position.id === positionId) {
          position.statusPosition = checked
            ? StatusPositionEnum.ACTIVO
            : StatusPositionEnum.INACTIVO;
        }
      });
      // Actualiza el signal para notificar el cambio a Angular
      this.businessSignal.set({ ...user });
      //ToDo: Toca analizar porque al conectar el backend molesta el estado
      this.positionService
        .updateStatusPosition(userType, user)
        .pipe(takeUntil(this.destroy$))
        .subscribe();
    }
  }
  /**
   *
   * @param position
   * @returns
   */
  isPositionActive(position: Position): boolean {
    return position.statusPosition === StatusPositionEnum.ACTIVO;
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
