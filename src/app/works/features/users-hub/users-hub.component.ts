import { AfterViewInit, Component, OnInit } from '@angular/core';
import { UsersService } from '../../../shared/data-access/users.service';
import {
  debounceTime,
  distinctUntilChanged,
  of,
  Subject,
  switchMap,
  take,
  takeUntil,
  tap,
} from 'rxjs';
import { CommonModule } from '@angular/common';
import { UserListComponent } from './user-list/user-list.component';
import { TypeUser } from '../models/type-user.model';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AnalyticsService } from '../../../shared/data-access/analytics.service';
import { AuthStateService } from '../../../shared/data-access/auth-state.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { WorksService } from '../../services/works.service';

@Component({
  selector: 'app-users-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, UserListComponent],
  templateUrl: './users-hub.component.html',
  styleUrl: './users-hub.component.scss',
})
export default class UsersHubComponent implements OnInit, AfterViewInit {
  searchControl = new FormControl('');
  private destroy$ = new Subject<void>();
  /** Variables */
  tabs = [
    { key: TypeUser.TRABAJADOR, label: 'Trabajadores' },
    { key: TypeUser.SATELITE, label: 'Satélites' },
    { key: TypeUser.TALLER, label: 'Talleres' },
    { key: TypeUser.EMPRESA, label: 'Empresas' },
    { key: TypeUser.PERSONA_NATURAL, label: 'Personas Naturales' },
  ];
  activeTab = TypeUser.SATELITE;
  searchQuery = '';
  allUsers: any = [];
  filteredUsers: any = [];
  /** Ng Functions */
  constructor(
    private userService: UsersService,
    private analyticsService: AnalyticsService,
    private authStateService: AuthStateService,
    private router: Router,
    private workesService: WorksService
  ) {}
  ngOnInit(): void {
    this.initializeData();
    this.filterUsers();
    this.setupFormControlSearch();
    this.analyticsService.logPageVisit('user-hub');
  }
  ngAfterViewInit(): void {
    this.openModalRegister();
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  /** Functions  */
  /**
   * Inicializamos data
   */
  initializeData() {
    this.userService
      .getAllUsersInDB()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          if (users) {
            this.allUsers = users;
          }
        },
        error: (error) => {
          //this.loading.set(false);
        },
      });
  }
  /**
   * Filtramos los datos para cada tipo de usuario
   */
  filterUsers() {
    if (this.searchQuery) {
      this.userService
        .searchUsers(this.searchQuery, this.activeTab)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (usersSearch) => {
            if (usersSearch) {
              this.filteredUsers = usersSearch;
            }
          },
          error: (error) => {
            //this.loading.set(false);
          },
        });
    } else {
      this.userService
        .getUsersByType(this.activeTab as any)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (usersByType) => {
            if (usersByType) {
              this.filteredUsers = usersByType;
            }
          },
          error: (error) => {
            //this.loading.set(false);
          },
        });
    }
  }
  // Método para obtener las clases CSS de las tabs
  getTabClasses(tabKey: string): string {
    const baseClasses =
      'flex-shrink-0 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap';

    if (this.activeTab === tabKey) {
      // Tab activa - azul con fondo sólido
      return `${baseClasses} bg-blue-600 text-white shadow-lg transform scale-105`;
    } else {
      // Tab inactiva - gris claro con hover
      return `${baseClasses} bg-gray-200/60 dark:bg-slate-600/60 text-gray-700 dark:text-gray-300 hover:bg-gray-300/80 dark:hover:bg-slate-500/80 hover:text-gray-900 dark:hover:text-white backdrop-blur-sm`;
    }
  }
  /**
   * Selecciona la pestaña para seleccionar el tipo de usuario a mostrar
   * @param tab
   */
  setActiveTab(tab: TypeUser) {
    this.activeTab = tab;
    this.searchControl.setValue('');
    this.filterUsers();
  }
  /***
   * Reacciona al filtro de busqueda
   */
  onSearch() {
    this.filterUsers();
  }
  // MÉTODO 1: FormControl con debounce (RECOMENDADO)
  private setupFormControlSearch() {
    const sub = this.searchControl.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300), // Esperar 300ms después del último cambio
        distinctUntilChanged(), // Solo emitir si el valor cambió
        tap((data) => (this.filteredUsers = [])), // Se vacia para volver a llenarlo con los usuarios buscados
        switchMap((query) =>
          this.userService.searchUsers(query || '', this.activeTab)
        ) // Cambiar a la nueva búsqueda
      )
      .subscribe((results) => {
        // Al parecer los resultados al buscar llegan de uno en uno y por eso toca ir guardandolo mientrás va llegando
        this.filteredUsers.push(results);
      });
  }

  /** Calcula la cantidad de usuarios por tipo de usuario */
  getUserCount(typeUser: string) {
    return this.userService.getCountUserByType(typeUser);
  }
  /**
   * Abre el modal en caso de no tener perfil el usuario
   */
  openModalRegister() {
    this.authStateService.authState$
      .pipe(
        takeUntil(this.destroy$),
        take(1),
        switchMap((user) => {
          if (user && user.uid) {
            return this.workesService.getUserByUserIdAndCollection(
              user.uid,
              'users'
            );
          } else {
            return of(null);
          }
        })
      )
      .subscribe({
        next: (user) => {
          if (
            user &&
            user[0] &&
            user[0].typeUSer &&
            user[0].typeUSer === TypeUser.NO_PROFILE
          ) {
            Swal.fire({
              title: '¡Completa tu perfil!',
              text: 'Para que tu perfil sea visible te recomendamos completarlo y así poder aparecer en las busquedas de otras personas.  ',
              icon: 'info',
              showConfirmButton: true,
              confirmButtonText: 'Completar perfil', // Texto del botón de confirmación
              cancelButtonText: 'Luego lo completo', // Texto del botón de cancelar
              showCancelButton: true,
            }).then((result) => {
              if (result.isConfirmed) {
                this.router.navigate(['/auth/register']);
              }
            });
          }
        },
        error: () => {},
      });
  }
}
