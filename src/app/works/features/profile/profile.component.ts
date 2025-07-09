import {
  AfterViewInit,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { WorksService } from '../../services/works.service';
import { AuthStateService } from '../../../shared/data-access/auth-state.service';
import { of, switchMap, tap, Subject, takeUntil } from 'rxjs';
import { SateliteUser } from '../models/satelite.model';
import { WorkerUser } from '../models/worker.model';
import { TallerUSer } from '../models/talleres.model';
import { CommonModule } from '@angular/common';
import StartsCalificationComponent from '../../../shared/ui/starts-calification/starts-calification.component';
import { PositionsService } from '../../services/positions.service';
import { toast } from 'ngx-sonner';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import LoadingComponent from '../../../shared/ui/loading/loading.component';
import { AnalyticsService } from '../../../shared/data-access/analytics.service';
import Swal from 'sweetalert2';
import { TypeUser } from '../models/type-user.model';
import { ProfileEmpresaOrNaturalPersonComponent } from './profile-empresa-or-natural-persona/profile-empresa-or-natural-person.component';
import { EmpresaUser } from '../models/empresa.model';
import { NaturalPersonUser } from '../models/natural-person.model';
import { PublicationDemandService } from '../../../publication/services/publication-demand.services';
import { OwnPublicationsComponent } from './own-publications/own-publications.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    StartsCalificationComponent,
    FormsModule,
    ReactiveFormsModule,
    LoadingComponent,
    ProfileEmpresaOrNaturalPersonComponent,
    OwnPublicationsComponent,
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
  // Señal donde guardaremos si es una empresa
  empresaSignal = signal<EmpresaUser | null>(null);
  // Señal donde guardaremos si es una persona natural
  naturalPersonSignal = signal<NaturalPersonUser | null>(null);

  positionStatus = signal<boolean>(false);
  isLoadingPage = signal<boolean>(true);
  //
  userId!: string | undefined;
  // Inyecciones de  servicios y otros necesarios
  private _auth = inject(AuthStateService);
  private userService = inject(WorksService);
  private positionService = inject(PositionsService);
  private analyticsService = inject(AnalyticsService);
  private _router = inject(Router);
  private publicationService = inject(PublicationDemandService);
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
            return this.loadUser(userId);
          } else {
            return of(null);
          }
        }),
        tap((userFound) => {
          if (
            userFound &&
            userFound.length &&
            userFound[0]?.typeUSer !== TypeUser.NO_PROFILE // Si existe pero no tiene pefile muestra el Sweet Alert
          ) {
            const user = userFound[0];
            if (user) {
              const typeUser = user.typeUSer;
              if (typeUser) {
                this.typeUser.set(typeUser);
              }
              if (typeUser == TypeUser.TRABAJADOR) {
                this.workerSignal.set(user);
              } else if (
                typeUser == TypeUser.SATELITE ||
                typeUser == TypeUser.TALLER
              ) {
                this.businessSignal.set(user);
              } else if (typeUser == TypeUser.EMPRESA) {
                this.empresaSignal.set(user);
              } else if (typeUser == TypeUser.PERSONA_NATURAL) {
                this.naturalPersonSignal.set(user);
              }
              this.isLoadingPage.set(false);
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
        }),
        switchMap((userData) =>
          this.publicationService.getUsersPublicationsByUserId(userData.userId)
        ),
        tap()
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
  loadUser(userId: string) {
    const PATH = 'users'; // Esta es la collection donde se guardan todos los usuarios ahora
    return this.userService.getUserByUserIdAndCollection(userId, PATH);
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
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  /**
   * Nuevos métodos para mostrar los perfiles de empresas y persona natural
   */
  onSearchWorkers(): void {
    // Navegar a la página de búsqueda de trabajadores
    this._router.navigate(['/works/search/workers']);
  }

  onSearchTalleres(): void {
    // Navegar a la página de búsqueda de talleres
    this._router.navigate(['/works/search/talleres']);
  }

  onEditProfile(profileId: string): void {
    // Navegar a la página de edición según el tipo de usuario
    const userType = this.typeUser();

    if (userType === 'empresa') {
      this._router.navigate(['/works/profile/edit-empresa', profileId]);
    } else if (userType === 'persona-natural') {
      this._router.navigate(['/works/profile/edit-natural-person', profileId]);
    }
  }
  // Método para verificar si debe mostrar el botón de crear perfil
  createProfileButtonValidation(): boolean {
    const userType = this.typeUser();

    switch (userType) {
      case 'empresa':
        return !!this.empresaSignal();
      case 'persona-natural':
        return !!this.naturalPersonSignal();
      case 'trabajadores':
        return !!this.workerSignal();
      case 'satelite':
      case 'talleres':
        return !!this.businessSignal();
      default:
        return false;
    }
  }
}
