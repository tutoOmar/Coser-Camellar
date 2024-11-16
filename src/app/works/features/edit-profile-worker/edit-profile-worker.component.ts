import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormArray,
  FormsModule,
  ReactiveFormsModule,
  FormControl,
  AbstractControl,
  ValidatorFn,
  ValidationErrors,
} from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Machines } from '../models/machines.model';
import { Specialty } from '../models/specialties.model';
import { GenderEnum, WorkerUser } from '../models/worker.model';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { WorksService } from '../../services/works.service';
import { toast } from 'ngx-sonner';
import { Status } from '../models/status.model';
@Component({
  selector: 'app-edit-profile-worker',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './edit-profile-worker.component.html',
  styleUrl: './edit-profile-worker.component.scss',
})
export default class EditProfileWorkerComponent implements OnInit {
  wokerService = inject(WorksService);

  private destroy$ = new Subject<void>();

  selectedForm: string = '';
  workerForm: FormGroup;
  workerSpecialties = Object.values(Specialty);
  machinesExperience = Object.values(Machines);
  genderList = Object.values(GenderEnum);
  availableSpecialties = [...this.workerSpecialties]; // Lista de especialidades disponibles para seleccionar
  availableMachines = [...this.machinesExperience];
  userInfo!: WorkerUser;
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
  isUploading: boolean = false;
  imagePreview = signal<string | ArrayBuffer | null>('');
  machinesSignal = signal<Machines[] | null>(null);
  specialtiesSignal = signal<Specialty[] | null>(null);
  loading = signal<boolean>(false);
  /**
   *
   * @param fb
   * @param router
   * @param currentRoute
   * @param locationService
   */
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private currentRoute: ActivatedRoute
  ) {
    // Inicializar formularios
    this.workerForm = this.fb.group({
      name: ['', Validators.required],
      phone: ['', Validators.required],
      country: ['', Validators.required],
      city: ['', Validators.required],

      experience: this.fb.array(
        [
          this.fb.control('', [
            Validators.required,
            Validators.minLength(1),
            Validators.maxLength(100),
          ]),
        ],
        this.minLengthArray(1)
      ), // Validador personalizado para al menos un elemento

      machines: this.fb.array([], this.minLengthArray(1)), // Validador personalizado para al menos un elemento
      specialty: this.fb.array([], this.minLengthArray(1)), // Validador personalizado para al menos un elemento

      gender: ['', Validators.required],
      photo: [''],
      status: [true, Validators.required],
    });
  }
  // Validador personalizado para asegurarse de que el FormArray tenga al menos un elemento
  minLengthArray(min: number): ValidatorFn {
    return (formArray: AbstractControl): ValidationErrors | null => {
      const array = formArray as FormArray;
      return array && array.length >= min ? null : { minLengthArray: true };
    };
  }
  /**
   *
   */
  ngOnInit(): void {
    const userId = this.currentRoute.snapshot.paramMap.get('id');
    if (userId) {
      this.loadWorker('trabajadores', userId);
    }
  }

  /**
   *
   * @param collectionName
   * @param sateliteId
   */
  loadWorker(collectionName: string, workerId: string) {
    this.wokerService
      .getUserByIdAndCollection(workerId, collectionName)
      .pipe(takeUntil(this.destroy$))
      .subscribe((worker: any) => {
        const validationUser = worker as WorkerUser;
        this.userInfo = validationUser;
        // Usamos patchValue para setear los valores en el formulario
        this.workerForm.patchValue({
          name: validationUser.name,
          phone: validationUser.phone,
          city: validationUser.city,
          country: validationUser.country,
          gender: validationUser.gender,
          photo: validationUser.photo,
          status: validationUser.status === 'libre' ? true : false,
        });
        //Limpiamor los formArray y los setteamos uno a uno
        // Primero, limpia los FormArray para asegurarte de que están vacíos
        const machinesFormArray = this.workerForm.get('machines') as FormArray;
        machinesFormArray.clear();

        const specialtyFormArray = this.workerForm.get(
          'specialty'
        ) as FormArray;
        specialtyFormArray.clear();

        const experienceFormArray = this.workerForm.get(
          'experience'
        ) as FormArray;
        experienceFormArray.clear();

        // Para machines, specialty y experience, añade cada valor al FormArray correspondiente
        validationUser.machines.forEach((machine: string) => {
          machinesFormArray.push(new FormControl(machine));
        });

        validationUser.specialty.forEach((specialty: string) => {
          specialtyFormArray.push(new FormControl(specialty));
        });

        validationUser.experience.forEach((exp: string) => {
          experienceFormArray.push(new FormControl(exp));
        });
        this.imagePreview.set(validationUser.photo);
        this.availableSpecialties = this.availableSpecialties.filter(
          (specialty) => !validationUser.specialty.includes(specialty)
        );
        this.availableMachines = this.availableMachines.filter(
          (machine) => !validationUser.machines.includes(machine)
        );
        this.machinesSignal.set(validationUser.machines);
        this.specialtiesSignal.set(validationUser.specialty);
      });
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Método para seleccionar el tipo de formulario
  selectType(type: string) {
    this.selectedForm = type;
  }

  // Método para agregar una especialidad al FormArray
  addSpecialtyWorker(event: any, specialtySelect: HTMLSelectElement): void {
    const specialty = event.target.value;
    if (
      specialty &&
      this.isSpecialtyEnum(specialty) &&
      !this.workerForm.value.specialty.includes(specialty)
    ) {
      (this.workerForm.get('specialty') as FormArray).push(
        new FormControl(specialty)
      );
      this.availableSpecialties = this.availableSpecialties.filter(
        (item) => item !== specialty
      );
      const specialties = this.workerForm.value.specialty;
      this.specialtiesSignal.set(specialties);
      specialtySelect.value = '';
    }
  }
  /**
   *
   * @param specialty
   */
  removeSpecialtyWorker(specialty: string): void {
    const specialties = this.workerForm.get('specialty') as FormArray;
    const index = specialties.value.indexOf(specialty);
    // Verificar que el índice es válido
    if (index >= 0) {
      // Remover la especialidad del FormArray
      specialties.removeAt(index);
      this.specialtiesSignal.set(specialties.value);

      if (specialties.length === 0) {
        specialties.markAsTouched();
      }
      // Agregar la especialidad de vuelta a la lista de disponibles, si no está ya incluida
      if (
        this.isSpecialtyEnum(specialty) &&
        !this.availableSpecialties.includes(specialty)
      ) {
        this.availableSpecialties.push(specialty);
      }
    }
  }

  // Método para agregar una máquina al FormArray
  addMachineWorker(event: any, machineSelect: HTMLSelectElement): void {
    const machine = event.target.value;
    if (
      machine &&
      this.isMachineEnum(machine) &&
      !this.workerForm.value.machines.includes(machine)
    ) {
      (this.workerForm.get('machines') as FormArray).push(
        new FormControl(machine)
      );
      this.availableMachines = this.availableMachines.filter(
        (item) => item !== machine
      );
      const machines = this.workerForm.value.machines;
      this.machinesSignal.set(machines);
      machineSelect.value = '';
    }
  }

  // Método para quitar una máquina del FormArray
  removeMachineWorker(machine: string): void {
    const machines = this.workerForm.get('machines') as FormArray;
    const index = machines.value.indexOf(machine);
    // Verificar que el índice es válido
    if (index >= 0) {
      // Remover la especialidad del FormArray

      machines.removeAt(index);
      this.machinesSignal.set(machines.value);
      //MArcamos como tocado si se vacia el
      if (machines.length === 0) {
        machines.markAsTouched();
      }
      // Agregar la especialidad de vuelta a la lista de disponibles, si no está ya incluida
      if (
        this.isMachineEnum(machine) &&
        !this.availableMachines.includes(machine)
      ) {
        this.availableMachines.push(machine);
      }
    }
  }

  // Registro de trabajador
  updateWorker() {
    Object.keys(this.workerForm.controls).forEach((key) => {
      const control = this.workerForm.get(key);
      control?.markAsTouched();
    });
    //ToDo: solo deberia validar el formulario pero hay fallas que se coregiran en la siguiente versión
    if (
      this.workerForm.valid &&
      !this.provisionalValidationMaxLenght() &&
      !this.provisionalValidationMinLenght()
    ) {
      this.loading.set(true);
      const newWorker: WorkerUser = this.workerForm.value;
      const status = this.workerForm.value.status
        ? Status.LIBRE
        : Status.OCUPADO;
      const updatedUser: WorkerUser = {
        // VAriables que no se modifican en este update
        id: this.userInfo.id,
        average_score: this.userInfo.average_score,
        typeUSer: this.userInfo.typeUSer,
        userId: this.userInfo.userId,
        comments: this.userInfo.comments,
        // Variables que se modifican en este update
        status: status ? status : Status.LIBRE,
        city: newWorker.city,
        country: newWorker.country,
        experience: newWorker.experience,
        machines: newWorker.machines,
        name: newWorker.name,
        phone: newWorker.phone,
        photo: newWorker.photo,
        specialty: newWorker.specialty,
        gender: newWorker.gender,
      };
      // Validamos el usuario a actualizar
      if (updatedUser && updatedUser.typeUSer) {
        this.wokerService
          .updateUser(updatedUser.typeUSer, updatedUser, this.selectedImage)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (successMessage) => {
              // Mostrar mensaje de éxito en un toast

              toast.success('Ususario actualizado con éxito');
              // Redirigir a otra ruta
              this.loading.set(false);
              this.router.navigate(['/works']);
            },
            error: (error) => {
              // Mostrar mensaje de error en un toast
              this.loading.set(false);
              toast.error('Error al actualizar usuario intente más tarde');
            },
          });
      }
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
      reader.onload = (e) => this.imagePreview.set(reader.result);
      if (this.selectedImage) {
        reader.readAsDataURL(this.selectedImage);
      }
    }
  }
  //Hace un s
  toggleStatus() {
    if (this.status) {
      this.status.setValue(
        this.status.value === Status.LIBRE ? Status.OCUPADO : Status.LIBRE
      );
    }
  }
  // GEtter del status
  get status() {
    if (this.workerForm.get('status')) {
      return this.workerForm.get('status');
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
  // Getter de array de la máquinas
  get machines() {
    if (this.workerForm.get('machines')) {
      return this.workerForm.get('machines')?.value;
    } else {
      return [];
    }
  }

  get machinesArray() {
    return this.workerForm.get('machines') as FormArray;
  }
  get specitaltiesArray() {
    return this.workerForm.get('specialty') as FormArray;
  }
  isMachinesArrayInvalid(): boolean {
    return (
      this.machinesArray.hasError('minLengthArray') &&
      (this.machinesArray.touched || this.machinesArray.dirty)
    );
  }
  isSpecialtiesArrayInvalid(): boolean {
    return (
      this.specitaltiesArray.hasError('minLengthArray') &&
      (this.specitaltiesArray.touched || this.specitaltiesArray.dirty)
    );
  }
  // Getters para el FormArray y validación
  get experienceArray() {
    return this.workerForm.get('experience') as FormArray;
  }

  get experienceControl(): FormControl {
    return this.experienceArray.at(0) as FormControl;
  }

  // Método para verificar errores específicos
  getExperienceErrorMessage(): string {
    const control = this.experienceControl;

    if (control.hasError('required') && control.touched) {
      return 'Este campo es requerido';
    }
    if (control.hasError('minlength')) {
      return 'Debes escribir al menos 1 caracter';
    }
    if (control.hasError('maxlength')) {
      return 'Máximo 100 caracteres';
    }
    return '';
  }

  // Método para verificar si hay error
  //ESte método esta fallando aún porque no se detecta error en el formulario
  hasExperienceError(): boolean {
    return this.experienceControl.invalid && this.experienceControl.touched;
  }
  // Método provisional para mostrar un error
  // ToDo la idea es quitar esto y hacer funcionar los reales, igual quitar en registrar cambio
  provisionalValidationMinLenght(): boolean {
    return this.experienceControl.value.length <= 0;
  }
  provisionalValidationMaxLenght(): boolean {
    return (
      this.experienceControl.value.length > 0 &&
      this.experienceControl.value.length > 100
    );
  }
}
