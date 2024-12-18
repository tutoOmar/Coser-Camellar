import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TypeUser } from '../../../works/features/models/type-user.model';
import { SateliteUser } from '../../../works/features/models/satelite.model';
import { Status } from '../../../works/features/models/status.model';
import {
  GenderEnum,
  WorkerUser,
} from '../../../works/features/models/worker.model';
import { Specialty } from '../../../works/features/models/specialties.model';
import { Machines } from '../../../works/features/models/machines.model';
import { LocationService } from '../../../shared/data-access/location.service';
import { TallerUSer } from '../../../works/features/models/talleres.model';
import { RegisterUserService } from '../../../shared/data-access/register-user.service';
import { toast } from 'ngx-sonner';
import { Subject, switchMap, takeUntil, tap } from 'rxjs';
import { AuthStateService } from '../../../shared/data-access/auth-state.service';
import { WorksService } from '../../../works/services/works.service';
import { AnalyticsService } from '../../../shared/data-access/analytics.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  providers: [LocationService],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export default class RegisterComponent implements OnInit, AfterViewInit {
  // subject para destruir el componente
  private destroy$ = new Subject<void>(); // Controlador de destrucción
  // Estado actual
  private authState = inject(AuthStateService);
  private userService = inject(WorksService);
  private analyticsService = inject(AnalyticsService);
  // Subject para manejar la suscripción
  // Signal de loadging
  loading = signal<boolean>(false);
  // Validaciones
  nameTouched: boolean = false;
  phoneTouched: boolean = false;
  countryTouched: boolean = false;
  cityTouched: boolean = false;
  experienceTouched: boolean = false;
  machinesTouched: boolean = false;
  specialtiesTouched: boolean = false;
  responsibleTouched: boolean = false;
  neiborhoodTouched: boolean = false;
  numberEmployeesTouched: boolean = false;
  typeUserTouched: boolean = false;
  // VAriable para seleccionar una de las dos opciones
  selectedForm: string = '';
  // Obtención de la lista de especialida, maquinas y genreo
  workerSpecialties = Object.values(Specialty); // Lista de especialidades para trabajadores
  machinesExperience = Object.values(Machines); // Lista de máquinas que pueden usar los trabajadores
  genderList = Object.values(GenderEnum);
  // Lista que se present disponible en el select
  availableSpecialties = [...this.workerSpecialties]; // Lista de especialidades disponibles para seleccionar
  availableMachines = [...this.machinesExperience];
  // Datos prefedinidos para paise sy ciudades
  //ToDo esto deberá estar vacio cuando nos conectemos a un API
  countries: any[] = [{ name: 'Colombia', code: 'CO' }];
  cities: any[] = [
    'Bogotá',
    'Medellín',
    'Cali',
    'Barranquilla',
    'Cartagena',
    'Cúcuta',
    'Bucaramanga',
    'Pereira',
    'Santa Marta',
    'Ibagué',
    'Soacha',
    'Chía',
    'Cota',
    'Villavicencio',
    'Manizales',
    'Pasto',
    'Montería',
    'Neiva',
    'Armenia',
    'Sincelejo',
  ];
  // variables para manejar la imagenes
  selectedImage: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  isUploading: boolean = false;
  // Modelo para el formulario de trabajador
  newWorker: WorkerUser = {
    id: '',
    average_score: 0,
    city: '',
    country: '',
    experience: [''],
    machines: [],
    name: '',
    phone: '',
    photo: '',
    specialty: [],
    comments: [],
    status: Status.LIBRE,
    gender: GenderEnum.OTHER,
    typeUSer: TypeUser.TRABAJADOR,
  };

  // Modelo para el formulario de negocio
  newBusiness: SateliteUser | TallerUSer = {
    id: '',
    average_score: 0,
    responsible: '',
    city: '',
    country: '',
    neighborhood: '',
    experience: [''],
    machines: [],
    name: '',
    phone: '',
    photo: '',
    specialty: [],
    comments: [],
    status: Status.LIBRE,
    numberEmployees: 0,
    positions: [],
    typeUSer: TypeUser.SATELITE,
  };

  constructor(
    private router: Router,
    private locationService: LocationService,
    private registerService: RegisterUserService
  ) {}
  /**
   *
   */
  ngOnInit(): void {
    this.authState.isAuthenticated$
      .pipe(
        takeUntil(this.destroy$),
        switchMap((res) => {
          return this.userService.checkUserExists();
        })
      )
      .subscribe((state) => {
        if (state) {
          this.router.navigate(['/works']);
        }
      });
  }
  /**
   *
   */
  ngAfterViewInit() {
    this.analyticsService.logPageVisit('register');
  }
  // Método para seleccionar el tipo de formulario
  selectType(type: string) {
    this.selectedForm = type;
  }

  // Método para registrar un trabajador
  registerWorker(workeForm: any, workerForm: any) {
    this.loading.set(true);
    // Activar estados touched para validación
    this.machinesTouched = !this.isSelectedAtLeastOne(this.newWorker.machines);
    this.specialtiesTouched = !this.isSelectedAtLeastOne(
      this.newWorker.specialty
    );
    this.nameTouched = this.isFieldEmpty(this.newWorker.name);
    this.phoneTouched = this.isFieldEmpty(this.newWorker.phone.toString());
    this.countryTouched = this.isFieldEmpty(this.newWorker.country);
    this.cityTouched = this.isFieldEmpty(this.newWorker.city);
    this.experienceTouched = this.isFieldEmpty(this.newWorker.experience[0]);

    if (
      !this.machinesTouched &&
      !this.experienceTouched &&
      !this.phoneTouched &&
      workerForm.form.valid
    ) {
      this.newWorker.phone = `${this.newWorker.phone}`;
      const newWorker: WorkerUser = this.newWorker;
      const path = this.newWorker.typeUSer ? this.newWorker.typeUSer : '';

      this.registerService
        .create(newWorker, path, this.selectedImage)
        .pipe(takeUntil(this.destroy$)) // Detener la suscripción en la destrucción
        .subscribe({
          next: () => {
            toast.success('Registro exitoso');
            this.loading.set(false);
            this.router.navigate(['/works']);
          },
          error: (error) => {
            toast.error('Hubo un problema en el registro');
            this.loading.set(false);
          },
        });
    } else {
      this.loading.set(false);
      toast.error('Debes llenar todos los campos');
    }
  }
  /* ===========================================================================================
   * Funciones para añadir opciones a los trabajadores
   =============================================================================================*/

  // Método para manejar cambios en la selección
  addSpecialtyWorker(event: any) {
    const selectElement = event.target as HTMLSelectElement;
    const selectedOptions = Array.from(selectElement.selectedOptions).map(
      (option) => option.value
    );

    // Filtrar nuevas selecciones que no sean válidas según Specialty
    const validSelections = selectedOptions.filter((option) =>
      this.isSpecialtyEnum(option)
    ) as Specialty[]; // Confirmar el tipo Specialty después de la validación

    // Filtrar opciones que ya estén seleccionadas para evitar duplicados
    const newSelections = validSelections.filter(
      (option) => !this.newWorker.specialty.includes(option)
    );

    // Agregar nuevas especialidades válidas a la lista seleccionada
    this.newWorker.specialty.push(...newSelections);

    // Actualizar las especialidades disponibles, excluyendo las seleccionadas
    this.availableSpecialties = this.availableSpecialties.filter(
      (item) => !newSelections.includes(item)
    );

    // Reiniciar la selección para evitar confusión visual
    selectElement.selectedIndex = -1;
  }
  // Método para quitar una especialidad
  removeSpecialtyWorker(specialty: string) {
    this.newWorker.specialty = this.newWorker.specialty.filter(
      (item) => item !== specialty
    ); // Remover de la lista de seleccionadas
    if (this.isSpecialtyEnum(specialty)) {
      this.availableSpecialties.push(specialty); // Añadir de nuevo a la lista de disponibles
    }
  }

  // Método para agregar una especialidad
  addMachineWorker(event: any) {
    const selectElement = event.target as HTMLSelectElement;
    const selectedOptions = Array.from(selectElement.selectedOptions).map(
      (option) => option.value
    );
    // Filtrar nuevas selecciones que no sean válidas según Specialty
    const validSelections = selectedOptions.filter((option) =>
      this.isMachineEnum(option)
    ) as Machines[]; // Confirmar el tipo Specialty después de la validación
    // Filtrar opciones que ya estén seleccionadas para evitar duplicados
    const newSelections = validSelections.filter(
      (option) => !this.newWorker.machines.includes(option)
    );
    // Agregar nuevas especialidades válidas a la lista seleccionada
    this.newWorker.machines.push(...newSelections);
    // Actualizar las especialidades disponibles, excluyendo las seleccionadas
    this.availableMachines = this.availableMachines.filter(
      (item) => !newSelections.includes(item)
    );
    // Reiniciar la selección para evitar confusión visual
    selectElement.selectedIndex = -1;
  }
  // Método para quitar una especialidad
  removeMachineWorker(machine: string) {
    this.newWorker.machines = this.newWorker.machines.filter(
      (item) => item !== machine
    ); // Remover de la lista de seleccionadas
    if (this.isMachineEnum(machine)) {
      this.availableMachines.push(machine); // Añadir de nuevo a la lista de disponibles
    }
  }
  /* ===========================================================================================
   * Funciones para añadir opciones a los negocios como satelites o talleres
   =============================================================================================*/

  // Método para registrar un negocio
  registerBusiness(businessForm: any) {
    this.loading.set(true);
    // Trigger touched states for validation
    this.machinesTouched = !this.isSelectedAtLeastOne(
      this.newBusiness.machines
    );
    this.specialtiesTouched = !this.isSelectedAtLeastOne(
      this.newBusiness.specialty
    );
    this.nameTouched = this.isFieldEmpty(this.newBusiness.name);
    this.phoneTouched = this.isFieldEmpty(this.newBusiness.phone.toString());
    this.countryTouched = this.isFieldEmpty(this.newBusiness.country);
    this.cityTouched = this.isFieldEmpty(this.newBusiness.city);
    this.experienceTouched = this.isFieldEmpty(this.newBusiness.experience[0]);
    this.responsibleTouched = this.isFieldEmpty(this.newBusiness.responsible);
    this.neiborhoodTouched = this.isFieldEmpty(this.newBusiness.neighborhood);

    if (
      !this.machinesTouched &&
      !this.experienceTouched &&
      !this.phoneTouched &&
      businessForm.form.valid
    ) {
      this.newBusiness.phone = `${this.newBusiness.phone}`;
      const newBusiness = this.newBusiness;
      const path = this.newBusiness.typeUSer ? this.newBusiness.typeUSer : '';
      this.registerService
        .create(newBusiness, path, this.selectedImage)
        .pipe(takeUntil(this.destroy$)) // Detener la suscripción en la destrucción
        .subscribe({
          next: () => {
            toast.success('Registro exitoso');
            this.loading.set(false);
            this.router.navigate(['/works']);
          },
          error: (error) => {
            toast.error('Hubo un problema en el registro');
            this.loading.set(false);
          },
        });
    } else {
      this.loading.set(false);
      toast.error('Debes llenar todos los campos');
    }
  }
  // Se añade especialidad temporal
  addSpecialtyBusiness(event: any) {
    const selectElement = event.target as HTMLSelectElement;
    const selectedOptions = Array.from(selectElement.selectedOptions).map(
      (option) => option.value
    );
    // Filtrar nuevas selecciones que no sean válidas según Specialty
    const validSelections = selectedOptions.filter((option) =>
      this.isSpecialtyEnum(option)
    ) as Specialty[]; // Confirmar el tipo Specialty después de la validación
    // Filtrar opciones que ya estén seleccionadas para evitar duplicados
    const newSelections = validSelections.filter(
      (option) => !this.newBusiness.specialty.includes(option)
    );
    // Agregar nuevas especialidades válidas a la lista seleccionada
    this.newBusiness.specialty.push(...newSelections);
    // Actualizar las especialidades disponibles, excluyendo las seleccionadas
    this.availableSpecialties = this.availableSpecialties.filter(
      (item) => !newSelections.includes(item)
    );
    // Reiniciar la selección para evitar confusión visual
    selectElement.selectedIndex = -1;
  }

  // Modified remove method
  removeSpecialtyBusiness(specialty: string) {
    this.newBusiness.specialty = this.newBusiness.specialty.filter(
      (item) => item !== specialty
    );
    // Add back to available specialties if it's a valid specialty
    if (this.isSpecialtyEnum(specialty)) {
      this.availableSpecialties.push(specialty);
    }
  }

  // Método para agregar una especialidad
  addMachineBusiness(event: any) {
    const selectElement = event.target as HTMLSelectElement;
    const selectedOptions = Array.from(selectElement.selectedOptions).map(
      (option) => option.value
    );
    // Filtrar nuevas selecciones que no sean válidas según Specialty
    const validSelections = selectedOptions.filter((option) =>
      this.isMachineEnum(option)
    ) as Machines[]; // Confirmar el tipo Specialty después de la validación
    // Filtrar opciones que ya estén seleccionadas para evitar duplicados
    const newSelections = validSelections.filter(
      (option) => !this.newBusiness.machines.includes(option)
    );
    // Agregar nuevas especialidades válidas a la lista seleccionada
    this.newBusiness.machines.push(...newSelections);
    // Actualizar las especialidades disponibles, excluyendo las seleccionadas
    this.availableMachines = this.availableMachines.filter(
      (item) => !newSelections.includes(item)
    );
    // Reiniciar la selección para evitar confusión visual
    selectElement.selectedIndex = -1;
  }
  // Método para quitar una especialidad
  removeMachineBusiness(machine: string) {
    this.newBusiness.machines = this.newBusiness.machines.filter(
      (item) => item !== machine
    ); // Remover de la lista de seleccionadas
    if (this.isMachineEnum(machine)) {
      this.availableMachines.push(machine); // Añadir de nuevo a la lista de disponibles
    }
  }
  /**Remueve guiónes de las palabras que normalmente las lleva*/
  removeHyphens(wordWithHyphens: string | undefined): string {
    if (wordWithHyphens) {
      const wordUpperCase =
        wordWithHyphens[0].toUpperCase() + wordWithHyphens.substring(1);
      return wordUpperCase.replace(/-/g, ' ');
    } else {
      return '';
    }
  }
  // Función de validación para el enum Specialty
  isSpecialtyEnum(value: string): value is Specialty {
    return Object.values(Specialty).includes(value as Specialty);
  }
  // Función de validación para el enum Specialty
  isMachineEnum(value: string): value is Machines {
    return Object.values(Machines).includes(value as Machines);
  }
  // Carga la lista de paises
  loadCountries() {
    this.locationService.getCountries().subscribe((data) => {
      this.countries = data
        .map((country) => ({
          name: country.name.common,
          code: country.cca2,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    });
  }
  // Carga la lista de ciudades
  onCountryChange() {
    if (this.newWorker.country) {
      this.locationService
        .getCities(this.newWorker.country)
        .subscribe((data) => {
          this.cities = data.data.map((city: any) => city.name);
        });
    } else {
      this.cities = [];
    }
  }
  // Traducir genero
  translateGender(gender: string) {
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
  // Seleccionar y validar imagen
  onImageSelected(event: any) {
    if (event.target.files && event.target.files[0]) {
      this.selectedImage = event.target.files[0];
      // Mostrar una vista previa de la imagen
      const reader = new FileReader();
      reader.onload = (e) => (this.imagePreview = reader.result);
      if (this.selectedImage) {
        reader.readAsDataURL(this.selectedImage);
      }
    }
  }
  // Es un campo requerido
  isFieldEmpty(fieldValue: string | undefined): boolean {
    return !fieldValue || fieldValue.trim() === '';
  }
  // Validación de al menos haber 1
  isSelectedAtLeastOne(field: any[]) {
    return field.length > 0;
  }
  // Es un campo de numero
  isNumber(fieldValue: string | number | undefined): boolean {
    return !(typeof fieldValue === 'number');
  }
  // Valida que tenga la cantidad indicada de caracteres
  isLengthCorrect(fieldValue: string) {
    return (
      !fieldValue || !(fieldValue.length > 0) || !(fieldValue.length < 100)
    );
  }
  // Método OnDestroy para completar el Subject cuando el componente se destruya
  ngOnDestroy(): void {
    this.destroy$.next(); // Emite un valor para finalizar las suscripciones
    this.destroy$.complete(); // Completa el Subject
  }
}
