import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import {
  EmpresaUser,
  Search,
} from '../../../works/features/models/empresa.model';
import { Specialty } from '../../../works/features/models/specialties.model';
import { Status } from '../../../works/features/models/status.model';
import { TypeUser } from '../../../works/features/models/type-user.model';
import Swal from 'sweetalert2';
import { ImagenSeleccionada } from '../../../shared/models/imagen-seleccionada.model';
import { Country } from '../../../works/features/models/country.model';

@Component({
  selector: 'app-register-empresas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register-empresas.component.html',
})
/**
 * Componente Angular para gestionar el formulario de registro o edición
 * de un perfil de empresa dentro de la plataforma.
 */
export class RegisterEmpresasComponent implements OnInit, OnChanges {
  @Input() countries: Country[] = [];
  @Input() cities: string[] = [];
  @Input() availableSpecialties: Specialty[] = [];
  @Input() loading: boolean = false;

  // Datos existentes para edición (opcional)
  @Input() existingEmpresa: EmpresaUser | null = null;

  // Configuración del modo
  @Input() mode: 'create' | 'edit' = 'create';

  @Output() formSubmit = new EventEmitter<
    Omit<EmpresaUser, 'id'> | EmpresaUser
  >();
  @Output() imageSelected = new EventEmitter<ImagenSeleccionada>();

  // Datos del formulario
  empresaData: Omit<EmpresaUser, 'id'> = this.getInitialData();

  imagePreview: string | null = null;
  Search = Search;

  // Flags de validación
  nameTouched = false;
  responsableTouched = false;
  phoneTouched = false;
  countryTouched = false;
  cityTouched = false;
  neighborhoodTouched = false;
  specialtiesTouched = false;
  buscaTouched = false;

  // Getters para facilitar el uso en el template
  get isEditMode(): boolean {
    return this.mode === 'edit' || !!this.existingEmpresa;
  }

  get buttonText(): string {
    return this.loading
      ? this.isEditMode
        ? 'Actualizando...'
        : 'Registrando...'
      : this.isEditMode
      ? 'Actualizar Empresa'
      : 'Registrar Empresa';
  }

  get formTitle(): string {
    return this.isEditMode ? 'Editar Empresa' : 'Registro para Empresa';
  }
  /** ============== Funciones ng ============== */
  ngOnInit() {
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Reinicializar cuando cambian los datos existentes
    if (changes['existingEmpresa'] && changes['existingEmpresa'].currentValue) {
      this.initializeForm();
    }
  }
  /** ====================== Funciones ===================*/
  /**
   * Inicializa el formulario según el modo (crear/editar)
   */
  private initializeForm(): void {
    if (this.isEditMode && this.existingEmpresa) {
      // Modo edición: cargar datos existentes
      this.empresaData = { ...this.existingEmpresa };
      this.imagePreview = this.existingEmpresa.photo || null;
      this.resetTouchedFlags();
    } else {
      // Modo creación: datos iniciales
      this.empresaData = this.getInitialData();
      this.imagePreview = null;
      this.resetTouchedFlags();
    }
  }

  /**
   * Retorna los datos iniciales para el formulario
   */
  private getInitialData(): Omit<EmpresaUser, 'id'> {
    return {
      average_score: 0,
      name: '',
      nit: '',
      responsable: '',
      phone: '',
      photo: '',
      city: '',
      country: '',
      neighborhood: '',
      typeUSer: TypeUser.EMPRESA,
      specialties: [],
      busca: Search.WORKERS,
      comments: [],
      status: Status.LIBRE,
      userId: '',
      website: '',
      countProfileVisits: 0,
      countContactViaWa: 0,
    };
  }

  /**
   * Resetea las flags de validación
   */
  private resetTouchedFlags(): void {
    this.nameTouched = false;
    this.responsableTouched = false;
    this.phoneTouched = false;
    this.countryTouched = false;
    this.cityTouched = false;
    this.neighborhoodTouched = false;
    this.specialtiesTouched = false;
    this.buscaTouched = false;
  }

  /**
   * Maneja el envío del formulario
   */
  onSubmit(form: NgForm): void {
    if (form.valid && this.empresaData.specialties.length > 0) {
      // En modo edición, incluir el ID si existe
      const dataToEmit =
        this.isEditMode && this.existingEmpresa?.id
          ? { ...this.empresaData, id: this.existingEmpresa.id }
          : this.empresaData;

      this.formSubmit.emit(dataToEmit);
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      this.markAllAsTouched();
    }
  }

  /**
   * Marca todos los campos como tocados para mostrar errores de validación
   */
  private markAllAsTouched(): void {
    this.nameTouched = true;
    this.responsableTouched = true;
    this.phoneTouched = true;
    this.countryTouched = true;
    this.cityTouched = true;
    this.neighborhoodTouched = true;
    this.specialtiesTouched = true;
    this.buscaTouched = true;
  }

  /**
   * Maneja la selección de imagen
   */
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (!files || files.length === 0) return;

    const file = files[0];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (file.size > maxSize) {
      Swal.fire({
        title: 'Error',
        text: `La imagen ${file.name} es muy grande (máximo 5MB)`,
        icon: 'warning',
        confirmButtonText: 'Aceptar',
      });
      input.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      Swal.fire({
        title: 'Error',
        text: `El archivo ${file.name} no es una imagen válida`,
        icon: 'warning',
        confirmButtonText: 'Aceptar',
      });
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imagenSeleccionada = {
        file: file,
        preview: e.target?.result as string,
      };

      this.imagePreview = imagenSeleccionada.preview;
      this.imageSelected.emit(imagenSeleccionada);
    };

    reader.readAsDataURL(file);
    input.value = '';
  }

  /**
   * Agrega una especialidad seleccionada
   */
  addSpecialty(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const specialty = select.value as Specialty;

    if (specialty && !this.empresaData.specialties.includes(specialty)) {
      this.empresaData.specialties.push(specialty);
    }

    select.value = '';
  }

  /**
   * Remueve una especialidad de la lista
   */
  removeSpecialty(specialty: Specialty): void {
    this.empresaData.specialties = this.empresaData.specialties.filter(
      (s) => s !== specialty
    );
  }

  /**
   * Remueve la imagen seleccionada
   */
  removeImage(): void {
    this.imagePreview = null;
    this.empresaData.photo = '';

    const fileInput = document.getElementById('imageInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  // Métodos de validación
  isFieldEmpty(field: string | undefined): boolean {
    return !field || field.trim() === '';
  }

  isNumber(field: string | undefined): boolean {
    return !field || field.toString().trim() === '';
  }

  isSelectedAtLeastOne(array: any[]): boolean {
    return array && array.length > 0;
  }

  removeHyphens(text: string): string {
    return text.replace(/-/g, ' ');
  }
}
