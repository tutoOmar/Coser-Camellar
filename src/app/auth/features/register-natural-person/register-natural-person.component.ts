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
import { NaturalPersonUser } from '../../../works/features/models/natural-person.model';
import { TypeUser } from '../../../works/features/models/type-user.model';
import { CommonModule } from '@angular/common';
import { ImagenSeleccionada } from '../../../shared/models/imagen-seleccionada.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register-natural-person',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register-natural-person.component.html',
})
/**
 * Componente para registrar o editar el perfil de una Persona Natural
 * que no cose, pero desea conectarse con trabajadores, talleres u otros.
 */
export class RegisterNaturalPersonComponent implements OnInit, OnChanges {
  @Input() countries: any[] = []; // Lista de países, enviada desde el componente padre
  @Input() cities: string[] = []; // Lista de ciudades según el país seleccionado
  @Input() loading: boolean = false; // Indica si hay una operación cargando (spinner, etc.)
  // Datos existentes para edición (opcional)
  @Input() existingNaturalUser: NaturalPersonUser | null = null;

  // Configuración del modo
  @Input() mode: 'create' | 'edit' = 'create';

  @Output() formSubmit = new EventEmitter<
    Omit<NaturalPersonUser, 'id'> | NaturalPersonUser
  >(); // Se emite al enviar el formulario
  @Output() imageSelected = new EventEmitter<ImagenSeleccionada>(); // Se emite cuando el usuario selecciona una imagen

  // Datos del usuario que se están editando o creando
  naturalPersonData: Omit<NaturalPersonUser, 'id'> = {
    average_score: 0,
    name: '', // Nombre de la persona
    phone: '', // Teléfono de contacto
    photo: '', // URL de la foto
    city: '', // Ciudad seleccionada
    country: '', // País seleccionado
    neighborhood: '', // Barrio (opcional)
    description: '', // Descripción breve de quién es o qué busca
    typeUSer: TypeUser.PERSONA_NATURAL, // Tipo de usuario: persona natural
    userId: '', // ID del usuario autenticado (opcional)
    countProfileVisits: 0, // Número de visitas al perfil
    countContactViaWa: 0, // Número de veces que han hecho clic en su WhatsApp
  };

  // Vista previa de la imagen seleccionada (para mostrar en el formulario)
  imagePreview: string | null = null;

  // Flags de validación manual para los campos (útiles para mostrar errores)
  nameTouched = false;
  phoneTouched = false;
  countryTouched = false;
  cityTouched = false;
  descriptionTouched = false;
  // ========= Getters =========================  //
  get isEditMode(): boolean {
    return this.mode === 'edit' || !!this.existingNaturalUser;
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
    return this.isEditMode
      ? 'Editar usuario'
      : 'Registro para usuario como persona natural';
  }
  /**  ng Functions */
  ngOnInit() {
    this.initializeForm();
  }
  /**==========   Funciones =========== */
  // Función que se ejecuta cuando el formulario se envía
  onSubmit(form: NgForm) {
    if (form.valid) {
      // Emitimos los datos del formulario al componente padre
      this.formSubmit.emit(this.naturalPersonData);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // Reinicializar cuando cambian los datos existentes
    if (
      changes['existingNaturalUser'] &&
      changes['existingNaturalUser'].currentValue
    ) {
      this.initializeForm();
    }
  }
  /**
   * Se elige la imagen de perfil que el usuario sube
   * @param event
   * @returns
   */
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (!files || files.length === 0) return;

    const file = files[0]; // Solo tomamos la primera imagen
    const maxSize = 5 * 1024 * 1024; // 5MB

    // Validación del tamaño del archivo
    if (file.size > maxSize) {
      Swal.fire({
        title: 'Error',
        text: `La imagen ${file.name} es muy grande (máximo 5MB)`,
        icon: 'warning',
        confirmButtonText: 'Aceptar',
      });
      input.value = ''; // Limpiar el input
      return;
    }

    // Validación del tipo de archivo
    if (!file.type.startsWith('image/')) {
      Swal.fire({
        title: 'Error',
        text: `El archivo ${file.name} no es una imagen válida`,
        icon: 'warning',
        confirmButtonText: 'Aceptar',
      });
      input.value = ''; // Limpiar el input
      return;
    }

    // Crear el FileReader para generar la vista previa
    const reader = new FileReader();
    reader.onload = (e) => {
      // Crear objeto con la estructura similar al código de referencia
      const imagenSeleccionada = {
        file: file,
        preview: e.target?.result as string,
      };

      // Asignar la vista previa
      this.imagePreview = imagenSeleccionada.preview;

      // Emitir el evento hacia el padre con la imagen seleccionada
      this.imageSelected.emit(imagenSeleccionada);
    };

    // Leer el archivo como DataURL
    reader.readAsDataURL(file);

    // Limpiar el input
    input.value = '';
  }

  // FUNCIONES DE VALIDACIÓN PERSONALIZADA

  // Verifica si un campo de texto está vacío
  isFieldEmpty(field: string | undefined): boolean {
    return !field || field.trim() === '';
  }

  // Verifica si un campo que debe ser numérico está vacío
  isNumber(field: string | undefined): boolean {
    return !field || field.toString().trim() === '';
  }

  // Verifica si un campo (ej. teléfono) tiene al menos 10 caracteres
  isLengthCorrect(field: string | undefined): boolean {
    return !field || field.length < 10;
  }
  /**
   * Quita la imagen del usuario
   */
  removeImage() {
    this.imagePreview = null;
    // También resetear el input file si es necesario
    const fileInput = document.getElementById('imageInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }
  /**
   * Inicializa el formulario según el modo (crear/editar)
   */
  private initializeForm(): void {
    if (this.isEditMode && this.existingNaturalUser) {
      // Modo edición: cargar datos existentes
      this.naturalPersonData = { ...this.existingNaturalUser };
      this.imagePreview = this.existingNaturalUser.photo || null;
      this.resetTouchedFlags();
    } else {
      // Modo creación: datos iniciales
      this.naturalPersonData = this.getInitialData();
      this.imagePreview = null;
      this.resetTouchedFlags();
    }
  }
  /**
   * Retorna los datos iniciales para el formulario
   */
  private getInitialData(): Omit<NaturalPersonUser, 'id'> {
    return {
      average_score: 0,
      name: '',
      phone: '',
      photo: '',
      city: '',
      country: '',
      neighborhood: '',
      typeUSer: TypeUser.PERSONA_NATURAL,
      userId: '',
      countProfileVisits: 0,
      countContactViaWa: 0,
    };
  }

  /**
   * Resetea las flags de validación
   */
  private resetTouchedFlags(): void {
    this.nameTouched = false;
    this.phoneTouched = false;
    this.countryTouched = false;
    this.cityTouched = false;
    this.descriptionTouched = false;
  }
}
