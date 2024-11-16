import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Position, toast } from 'ngx-sonner';
import { Subject } from 'rxjs';
import { Specialty } from '../../models/specialties.model';
import { Router } from '@angular/router';
import { PaymentEnum, StatusPositionEnum } from '../../models/position.model';
@Component({
  selector: 'app-add-position',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './add-position.component.html',
  styleUrl: './add-position.component.scss',
})
export default class AddPositionComponent {
  private destroy$ = new Subject<void>();
  positionForm: FormGroup;
  availableSpecialties = Object.values(Specialty);
  paymentTypes = Object.values(PaymentEnum);
  specialtiesSignal = signal<Specialty[] | null>(null);
  imagePreview = signal<string | ArrayBuffer | null>('');
  loading = signal<boolean>(false);

  // Sample cities array - should be retrieved from a service
  cities: string[] = [
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
  ];

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

  ngOnInit(): void {}

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

  // Image handling
  onImageSelected(event: any) {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => this.imagePreview.set(reader.result);
      reader.readAsDataURL(file);
      // Here you would typically handle the file upload
      // this.positionForm.patchValue({ photo: file });
    }
  }

  // Form submission
  submitPosition() {
    if (this.positionForm.valid) {
      this.loading.set(true);
      const position: Position = {
        ...this.positionForm.value,
        id: crypto.randomUUID(), // You might want to handle this differently
      };

      // Here you would typically call your service to save the position
      console.log('Position to save:', position);
      // Mock success
      toast.success('Posición creada exitosamente');
      this.router.navigate(['/positions']);
      this.loading.set(false);
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
