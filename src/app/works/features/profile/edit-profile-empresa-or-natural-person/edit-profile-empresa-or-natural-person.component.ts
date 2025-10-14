import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RegisterEmpresasComponent } from '../../../../auth/features/register-empresas/register-empresas.component';
import { Specialty } from '../../models/specialties.model';
import { EmpresaUser } from '../../models/empresa.model';
import { Subject, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { WorksService } from '../../../services/works.service';
import { toast } from 'ngx-sonner';
import Swal from 'sweetalert2';
import { NaturalPersonUser } from '../../models/natural-person.model';
import { TypeUser } from '../../models/type-user.model';
import { RegisterNaturalPersonComponent } from '../../../../auth/features/register-natural-person/register-natural-person.component';
import { COLOMBIAN_CITIES } from '../../../../shared/models/cities-harcode';

@Component({
  selector: 'app-edit-profile-empresa-or-natural-person',
  standalone: true,
  imports: [
    CommonModule,
    RegisterEmpresasComponent,
    RegisterNaturalPersonComponent,
  ],
  templateUrl: './edit-profile-empresa-or-natural-person.component.html',
})
export default class EditProfileEmpresaOrNaturalPersonComponent
  implements OnInit
{
  private destroy$ = new Subject<void>();

  specialties = Object.values(Specialty);
  availableSpecialties = [...this.specialties]; // Lista de especialidades disponibles para seleccionar
  loading = signal<boolean>(false);
  imagePreview = signal<string | ArrayBuffer | null>('');
  selectedImage: File | null = null;
  empresaToEdit!: EmpresaUser | null;
  naturalUserToEdit!: NaturalPersonUser | null;
  // Datos prefedinidos para paise sy ciudades
  //ToDo esto deberá estar vacio cuando nos conectemos a un API
  countries: any[] = [{ name: 'Colombia', code: 'CO' }];
  cities = COLOMBIAN_CITIES;
  //=============     ng Functions =========================
  constructor(
    private router: Router,
    private currentRoute: ActivatedRoute,
    private usersService: WorksService
  ) {}

  ngOnInit() {
    const paramUserId = this.currentRoute.snapshot.paramMap.get('id');
    if (paramUserId) {
      this.loadUser('users', paramUserId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  //===============    Functions  ==========================
  loadUser(collectionName: string, userId: string) {
    this.usersService
      .getUserByIdAndCollection(userId, collectionName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (userData: EmpresaUser | NaturalPersonUser) => {
          if (userData && userData.typeUSer === TypeUser.EMPRESA) {
            this.empresaToEdit = userData;
          } else if (
            userData &&
            userData.typeUSer === TypeUser.PERSONA_NATURAL
          ) {
            this.naturalUserToEdit = userData;
          }
        },
        error: (error) => {
          // console.error(error);
          toast.error('Hubo un error al traer al usuario');
        },
      });
  }
  /**
   * Función donde se llama al servicio para actualizar el perfil de la empresa
   * @param empresaUser
   */
  onUpdateEmpresa(empresaUser: Omit<EmpresaUser, 'id'> | EmpresaUser) {
    // Type guard correcto - verifica que tenga la propiedad id
    if ('id' in empresaUser && empresaUser.id) {
      this.loading.set(true);
      const PATH = 'users';
      this.usersService
        .updateUser(PATH, empresaUser, this.selectedImage)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (successMessage) => {
            // Mostrar mensaje de éxito en un toast

            toast.success('Datos de la empresa actualizados con éxito');
            // Redirigir a otra ruta
            this.loading.set(false);
            this.router.navigate(['/works']);
          },
          error: (error) => {
            // Mostrar mensaje de error en un toast
            this.loading.set(false);
            toast.error(
              'Error al actualizar datos de la empresa intente más tarde'
            );
          },
        });
    } else {
      // Opcionalmente mostrar un mensaje de error al usuario
      Swal.fire({
        title: 'Error',
        text: 'No se puede actualizar la empresa porque falta el ID',
        icon: 'error',
        confirmButtonText: 'Aceptar',
      });
    }
  }
  /**
   * Función donde se llama al servicio para actualizar el perfil de la persona natural
   * @param naturalPersonUser
   */
  onUpdateNaturalPerson(
    naturalPersonUser: Omit<NaturalPersonUser, 'id'> | NaturalPersonUser
  ) {
    // Type guard correcto - verifica que tenga la propiedad id
    if ('id' in naturalPersonUser && naturalPersonUser.id) {
      this.loading.set(true);
      const PATH = 'users';
      this.usersService
        .updateUser(PATH, naturalPersonUser, this.selectedImage)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (successMessage) => {
            // Mostrar mensaje de éxito en un toast

            toast.success('Datos de la empresa actualizados con éxito');
            // Redirigir a otra ruta
            this.loading.set(false);
            this.router.navigate(['/works']);
          },
          error: (error) => {
            // Mostrar mensaje de error en un toast
            this.loading.set(false);
            toast.error(
              'Error al actualizar datos de la empresa intente más tarde'
            );
          },
        });
    } else {
      // Opcionalmente mostrar un mensaje de error al usuario
      Swal.fire({
        title: 'Error',
        text: 'No se puede actualizar la empresa porque falta el ID',
        icon: 'error',
        confirmButtonText: 'Aceptar',
      });
    }
  }
  /**
   *
   * @param event
   */
  onImageSelected(event: any) {
    if (event.file) {
      this.selectedImage = event.file;
      // Mostrar una vista previa de la imagen
      const reader = new FileReader();
      reader.onload = (e) => this.imagePreview.set(reader.result);
      if (this.selectedImage) {
        reader.readAsDataURL(this.selectedImage);
      }
    }
  }
}
