import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Status } from '../../../works/features/models/status.model';
import { PaymentEnum } from '../../../works/features/models/position.model';
import { SateliteUser } from '../../../works/features/models/satelite.model';
import { Specialty } from '../../../works/features/models/specialties.model';
import { TallerUSer } from '../../../works/features/models/talleres.model';
import { TypeUser } from '../../../works/features/models/type-user.model';
import { WorkerUser } from '../../../works/features/models/worker.model';
import { SanitizeInputDirective } from '../../../shared/directives/sanitize-input.directive';
import { FormatSpecialtyPipe } from '../../utils/format-specialty.pipe';
import { Router } from '@angular/router';

interface StepValidationMap {
  [key: number]: string;
}

@Component({
  selector: 'app-register-experience',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SanitizeInputDirective,
  ],
  templateUrl: './register-experience.component.html',
  styleUrl: './register-experience.component.scss',
})
export default class RegisterExperienceComponent implements OnInit {
  currentStep = 1;
  readonly totalSteps = 4;
  userType!: TypeUser;
  mainForm!: FormGroup;
  isSubmitting = false;

  // Step form group mapping for validation
  stepGroup: StepValidationMap = {
    1: 'typeSelection', // Added for step 1
    2: 'basicInfo',
    3: 'specificInfo',
    4: 'experienceInfo',
  };

  // Options for selects
  specialties = Object.values(Specialty);
  statusOptions = Object.values(Status);
  paymentOptions = Object.values(PaymentEnum);
  typeUserOptions = Object.values(TypeUser);

  constructor(private fb: FormBuilder, private router: Router) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  // Initialize the form with all necessary form groups and controls
  private initializeForm(): void {
    this.mainForm = this.fb.group({
      typeSelection: this.fb.group({
        type: ['', Validators.required],
      }),
      basicInfo: this.fb.group({
        name: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(100),
          ],
        ],
        phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
        photo: [null],
        city: ['', [Validators.required, Validators.minLength(2)]],
        country: ['', [Validators.required, Validators.minLength(2)]],
      }),
      specificInfo: this.fb.group({}), // Will be dynamically updated based on user type
      experienceInfo: this.fb.group({
        experience: [[], Validators.required],
        machines: [[]],
        specialty: [[], Validators.required],
      }),
    });

    // Listen for user type changes
    this.mainForm.get('typeSelection.type')?.valueChanges.subscribe((type) => {
      if (type) {
        this.userType = type;
        this.updateSpecificInfoForm(type);
      }
    });
  }

  // Dynamically update the specificInfo form group based on user type
  private updateSpecificInfoForm(type: TypeUser): void {
    const specificInfoGroup = this.mainForm.get('specificInfo') as FormGroup;

    // Clear existing controls
    Object.keys(specificInfoGroup.controls).forEach((controlName) => {
      specificInfoGroup.removeControl(controlName);
    });

    // Add new controls based on user type
    switch (type) {
      case TypeUser.TRABAJADOR:
        specificInfoGroup.addControl(
          'gender',
          this.fb.control('', Validators.required)
        );
        break;
      case TypeUser.SATELITE:
      case TypeUser.TALLER:
        specificInfoGroup.addControl(
          'responsible',
          this.fb.control('', Validators.required)
        );
        specificInfoGroup.addControl(
          'neighborhood',
          this.fb.control('', Validators.required)
        );
        specificInfoGroup.addControl(
          'numberEmployees',
          this.fb.control('', [
            Validators.required,
            Validators.pattern(/^[0-9]+$/),
            Validators.min(1),
          ])
        );
        specificInfoGroup.addControl('positions', this.fb.array([]));
        break;
      case TypeUser.EMPRESA:
        specificInfoGroup.addControl(
          'businessName',
          this.fb.control('', Validators.required)
        );
        specificInfoGroup.addControl(
          'nit',
          this.fb.control('', [
            Validators.required,
            Validators.pattern(/^[0-9-]+$/),
          ])
        );
        break;
    }
  }

  // Add a position to the positions FormArray
  addPosition(): void {
    const positions = this.mainForm.get('specificInfo.positions') as FormArray;
    positions.push(this.createPositionFormGroup());
  }

  // Create a position form group
  private createPositionFormGroup(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      payment: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
    });
  }

  // Remove a position from the positions FormArray
  removePosition(index: number): void {
    const positions = this.mainForm.get('specificInfo.positions') as FormArray;
    positions.removeAt(index);
  }

  // Get positions as FormArray for template usage
  get positions(): FormArray {
    return this.mainForm.get('specificInfo.positions') as FormArray;
  }

  // Select user type and move to next step
  selectUserType(type: TypeUser): void {
    this.mainForm.get('typeSelection.type')?.setValue(type);
    this.userType = type;
    this.nextStep();
  }

  // Move to next step if current step is valid
  nextStep(): void {
    const currentStepGroup = this.mainForm.get(
      this.stepGroup[this.currentStep]
    );
    if (currentStepGroup?.valid && this.currentStep < this.totalSteps) {
      this.currentStep++;
    } else if (!currentStepGroup?.valid) {
      this.markFormGroupTouched(currentStepGroup as FormGroup);
    }
  }

  // Move to previous step
  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  // Submit form if valid
  onSubmit(): void {
    if (this.mainForm.valid) {
      this.isSubmitting = true;
      const userData = this.compileFinalData();

      // this.userRegistrationService.registerUser(userData)
      //   .subscribe({
      //     next: (response) => {
      //       console.log('Registration successful', response);
      //       this.router.navigate(['/registro-exitoso']);
      //     },
      //     error: (error) => {
      //       console.error('Registration failed', error);
      //       this.isSubmitting = false;
      //       // Handle error, show message to user
      //     },
      //     complete: () => {
      //       this.isSubmitting = false;
      //     }
      //   });
    } else {
      this.markFormGroupTouched(this.mainForm);
    }
  }

  // Mark all controls in a form group as touched
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else {
        control?.markAsTouched();
      }
    });
  }

  // Compile the final data based on user type
  private compileFinalData(): WorkerUser | SateliteUser | TallerUSer | any {
    const baseData = {
      ...this.mainForm.value.basicInfo,
      ...this.mainForm.value.experienceInfo,
      typeUSer: this.userType,
      status: Status.LIBRE,
    };

    switch (this.userType) {
      case TypeUser.TRABAJADOR:
        return {
          ...baseData,
          gender: this.mainForm.value.specificInfo.gender,
        } as WorkerUser;
      case TypeUser.SATELITE:
      case TypeUser.TALLER:
        return {
          ...baseData,
          responsible: this.mainForm.value.specificInfo.responsible,
          neighborhood: this.mainForm.value.specificInfo.neighborhood,
          numberEmployees: this.mainForm.value.specificInfo.numberEmployees,
          positions: this.mainForm.value.specificInfo.positions || [],
        } as SateliteUser | TallerUSer;
      case TypeUser.EMPRESA:
        return {
          ...baseData,
          businessName: this.mainForm.value.specificInfo.businessName,
          nit: this.mainForm.value.specificInfo.nit,
        };
      default:
        throw new Error('Invalid user type');
    }
  }

  // Helper method to check if a form control has errors
  hasError(controlPath: string, errorType: string): boolean {
    const control = this.mainForm.get(controlPath);
    return (
      ((control?.touched || control?.dirty) && control?.hasError(errorType)) ||
      false
    );
  }

  // Check if current step is valid for UI purposes
  isCurrentStepValid(): boolean {
    const currentStepGroup = this.mainForm.get(
      this.stepGroup[this.currentStep]
    );
    return currentStepGroup?.valid || false;
  }
}
