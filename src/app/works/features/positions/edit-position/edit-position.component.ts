import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { toast } from 'ngx-sonner';
import { catchError, of, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { Specialty } from '../../models/specialties.model';
import { ActivatedRoute, Router } from '@angular/router';
import {
  PaymentEnum,
  Position,
  StatusPositionEnum,
} from '../../models/position.model';
import { WorksService } from '../../../services/works.service';
import { AuthStateService } from '../../../../shared/data-access/auth-state.service';
import { SateliteUser } from '../../models/satelite.model';
import { TallerUSer } from '../../models/talleres.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { PositionsService } from '../../../services/positions.service';
import { AnalyticsService } from '../../../../shared/data-access/analytics.service';
import { COLOMBIAN_CITIES } from '../../../../shared/models/cities-harcode';
@Component({
  selector: 'app-edit-position',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './edit-position.component.html',
  styleUrl: './edit-position.component.scss',
})
export default class EditPositionComponent implements AfterViewInit {
  // Inyeccion de los servicios
  private authService = inject(AuthStateService);
  private worksService = inject(WorksService);
  private positionsService = inject(PositionsService);
  private currentRoute = inject(ActivatedRoute);
  private analyticsService = inject(AnalyticsService);
  // Subject para desturir componente
  private destroy$ = new Subject<void>();
  // Variables de control
  positionForm: FormGroup;
  availableSpecialties = Object.values(Specialty);
  paymentTypes = Object.values(PaymentEnum);
  specialtiesSignal = signal<Specialty[] | null>(null);
  loading = signal<boolean>(false);
  userData = signal<SateliteUser | TallerUSer | null>(null);
  positionData = signal<Position | null>(null);
  currentPositionId = '';
  // variables para manejar la imagenes
  selectedImage: File | null = null;
  imagePreview = signal<string | ArrayBuffer | null>('');
  isUploading: boolean = false;
  //ToDo esto deberá estar vacio cuando nos conectemos a un API
  cities = COLOMBIAN_CITIES;

  constructor(private fb: FormBuilder, private router: Router) {
    this.positionForm = this.fb.group({
      name: ['', [Validators.required]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      specialty: this.fb.array(
        [],
        [Validators.required, Validators.minLength(1)]
      ),
      experience: ['', [Validators.required, Validators.maxLength(100)]],
      photo: [''],
      typePayment: ['', Validators.required],
      city: ['', Validators.required],
      neighborhood: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      statusPosition: [StatusPositionEnum.ACTIVO],
    });
  }

  ngOnInit(): void {
    const positionId = this.currentRoute.snapshot.paramMap.get('id');
    this.authService.authState$
      .pipe(
        takeUntil(this.destroy$),
        switchMap((state) => {
          if (state) {
            const id = state.uid;
            if (id) {
              return this.worksService.getUserByUserIdInAnyCollection(id);
            } else {
              return of(null);
            }
          } else {
            return of(null);
          }
        }),
        tap((userData) => {
          if (userData) {
            const userUniqueData: SateliteUser | TallerUSer | null =
              userData[0] as SateliteUser | TallerUSer;
            if (userUniqueData) {
              const positionToEdit = userUniqueData.positions.filter(
                (position) => position.id === positionId
              );
              if (positionToEdit) {
                this.positionData.set(positionToEdit[0]);
                const positionDatas = positionToEdit[0];
                if (positionDatas) {
                  this.userData.set(userUniqueData);
                  this.positionForm.patchValue({
                    name: positionDatas.name,
                    description: positionDatas.description,
                    experience: positionDatas.experience,
                    photo: positionDatas.photo,
                    typePayment: positionDatas.typePayment,
                    city: positionDatas.city,
                    neighborhood: positionDatas.neighborhood,
                    phone: positionDatas.phone,
                    statusPosition: positionDatas.statusPosition,
                  });
                  //Limpiamor los formArray y los setteamos uno a uno
                  // Primero, limpia los FormArray para asegurarte de que están vacíos
                  const specialtyFormArray = this.positionForm.get(
                    'specialty'
                  ) as FormArray;
                  specialtyFormArray.clear();
                  // Para machines, specialty y experience, añade cada valor al FormArray correspondiente
                  positionDatas.specialty.forEach((specialty: string) => {
                    specialtyFormArray.push(new FormControl(specialty));
                  });
                  if (positionDatas.photo) {
                    this.imagePreview.set(positionDatas.photo);
                  }
                  this.availableSpecialties = this.availableSpecialties.filter(
                    (specialty) => !positionDatas.specialty.includes(specialty)
                  );

                  if (positionDatas.specialty) {
                    this.specialtiesSignal.set(positionDatas.specialty);
                  }
                  this.currentPositionId = positionDatas.id;
                }
              }
            }
          }
        })
      )
      .subscribe();
  }
  /**
   *
   */
  ngAfterViewInit() {
    this.analyticsService.logPageVisit('editar-oferta-laboral');
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Specialty handling methods
  addSpecialty(event: any, specialtySelect: HTMLSelectElement): void {
    const specialty = event.target.value;
    if (specialty && !this.positionForm.value.specialty.includes(specialty)) {
      (this.positionForm.get('specialty') as FormArray).push(
        new FormControl(specialty)
      );
      this.availableSpecialties = this.availableSpecialties.filter(
        (item) => item !== specialty
      );
      const specialties = this.positionForm.value.specialty;
      this.specialtiesSignal.set(specialties);
      specialtySelect.value = '';
    }
  }

  removeSpecialty(specialty: string): void {
    const specialties = this.positionForm.get('specialty') as FormArray;
    const index = specialties.value.indexOf(specialty);
    if (index >= 0) {
      specialties.removeAt(index);
      this.specialtiesSignal.set(specialties.value);
      if (
        this.isSpecialtyEnum(specialty) &&
        !this.availableSpecialties.includes(specialty)
      ) {
        this.availableSpecialties.push(specialty);
      }
    }
  }
  // Seleccionar y validar imagen
  onImageSelected(event: any) {
    if (event.target.files && event.target.files[0]) {
      this.selectedImage = event.target.files[0];
      // Mostrar una vista previa de la imagen
      const reader = new FileReader();
      reader.onload = (e) => this.imagePreview.set(reader.result);
      if (this.selectedImage) {
        reader.readAsDataURL(this.selectedImage);
      }
    }
  }
  // Se actualiza la posición
  submitPosition() {
    this.loading.set(true);

    if (this.positionForm.valid) {
      const updatedPosition: Position = {
        ...this.positionForm.value,
        id: this.currentPositionId,
      };
      const currentUser = this.userData();
      if (currentUser && currentUser.typeUSer) {
        //currentUser.positions.push(newPosition);
        this.positionsService
          .updateUserExistPosition(
            currentUser.typeUSer,
            currentUser,
            updatedPosition,
            this.selectedImage
          )
          .pipe(
            catchError((error) => {
              this.loading.set(false);
              toast.error('Error al editar la oferta, intenta más tarde');
              return of(null);
            })
          )
          .subscribe({
            next: (successMessage) => {
              toast.success('Oferta editada con éxito ');
              // Redirigir a otra ruta
              this.loading.set(false);
              this.router.navigate(['/works/profile']);
            },
            error: (error) => {
              // Mostrar mensaje de error en un toast
              this.loading.set(false);
              toast.error(
                'Error al crear la nueva oferta usuario intente más tarde'
              );
            },
          });
      } else {
        this.loading.set(false);
        toast.error('Completa toda la información de la posición');
      }
    } else {
      Object.keys(this.positionForm.controls).forEach((key) => {
        const control = this.positionForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
    }
  }

  // Helper methods
  removeHyphens(text: string): string {
    return text
      ? text.charAt(0).toUpperCase() + text.slice(1).replace(/-/g, ' ')
      : '';
  }

  get specialtiesArray() {
    return this.positionForm.get('specialty') as FormArray;
  }

  isSpecialtiesArrayInvalid(): boolean {
    return (
      this.specialtiesArray.hasError('required') &&
      this.specialtiesArray.touched
    );
  }
  // Función de validación para el enum Specialty
  isSpecialtyEnum(value: string): value is Specialty {
    return Object.values(Specialty).includes(value as Specialty);
  }
}
