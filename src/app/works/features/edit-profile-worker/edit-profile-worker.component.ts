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
} from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { LocationService } from '../../../shared/data-access/location.service';
import { Machines } from '../models/machines.model';
import { Specialty } from '../models/specialties.model';
import { GenderEnum, WorkerUser } from '../models/worker.model';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { WorksService } from '../../services/works.service';

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
    private currentRoute: ActivatedRoute,
    private locationService: LocationService
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
    });
  }
  // Validador personalizado para asegurarse de que el FormArray tenga al menos un elemento
  minLengthArray(min: number) {
    return (formArray: AbstractControl) => {
      const array = formArray as FormArray;
      return array && array.length >= min ? null : { minLengthArray: true };
    };
  }
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
    console.log(collectionName, workerId);
    this.wokerService
      .getUserByIdAndCollection(workerId, collectionName)
      .pipe(takeUntil(this.destroy$))
      .subscribe((worker: any) => {
        const validationUser = worker as WorkerUser;
        // Usamos patchValue para setear los valores en el formulario
        console.log('Validando usuario', validationUser);
        this.workerForm.patchValue({
          name: validationUser.name,
          phone: validationUser.phone,
          city: validationUser.city,
          country: validationUser.country,
          gender: validationUser.gender,
          photo: validationUser.photo,
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

        console.log('YA setteado', this.workerForm.value);
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
      !this.workerForm.value.specialties.includes(specialty)
    ) {
      (this.workerForm.get('specialties') as FormArray).push(
        new FormControl(specialty)
      );
      this.availableSpecialties = this.availableSpecialties.filter(
        (item) => item !== specialty
      );
      specialtySelect.value = '';
    }
  }
  /**
   *
   * @param specialty
   */
  removeSpecialtyWorker(specialty: string): void {
    const specialties = this.workerForm.get('specialties') as FormArray;
    const index = specialties.value.indexOf(specialty);
    // Verificar que el índice es válido
    if (index >= 0) {
      // Remover la especialidad del FormArray
      specialties.removeAt(index);
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
      !this.workerForm.value.machine.includes(machine)
    ) {
      (this.workerForm.get('machine') as FormArray).push(
        new FormControl(machine)
      );
      this.availableMachines = this.availableMachines.filter(
        (item) => item !== machine
      );
      machineSelect.value = '';
    }
  }

  // Método para quitar una máquina del FormArray
  removeMachineWorker(machine: string): void {
    const machines = this.workerForm.get('specialties') as FormArray;
    const index = machines.value.indexOf(machine);
    // Verificar que el índice es válido
    if (index >= 0) {
      // Remover la especialidad del FormArray
      machines.removeAt(index);
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
  registerWorker() {
    console.log('aquí llego', this.workerForm.value);

    if (this.workerForm.valid) {
      // this.loading = true;
      const newWorker: WorkerUser = this.workerForm.value;
      console.log(newWorker);
      // this.registerService
      //   .create(newWorker, TypeUser.TRABAJADOR, null)
      //   .pipe(takeUntil(this.destroy$))
      //   .subscribe({
      //     next: () => {
      //       this.loading = false;
      //       this.router.navigate(['/works']);
      //     },
      //     error: () => {
      //       this.loading = false;
      //     },
      //   });
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

  get experienceControl(): FormControl {
    return (this.workerForm.get('experience') as FormArray).at(
      0
    ) as FormControl;
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
  get machines() {
    if (this.workerForm.get('machines')) {
      return this.workerForm.get('machines')?.value;
    } else {
      return [];
    }
  }
}
