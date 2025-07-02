import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  signal,
  Signal,
  SimpleChanges,
} from '@angular/core';
import {
  ImagenSeleccionada,
  ImagesSelectorComponent,
  StateImages,
} from '../../../../shared/ui/images-selector/images-selector.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Publication } from '../../../models/publication.model';
import {
  StateEnum,
  typeContactEnum,
} from '../../../models/publication-db.model';
import { ActionPublicationEnum } from '../../../models/actionPublicationEnum';
// models/enums.ts
export enum TypeContactEnum {
  CALL = 'call',
  WHATSAPP = 'whatsapp',
  AMBAS = 'both',
}
export interface FormularioPublicacion {
  description: string;
  city: string;
  neighborhood: string;
  typeContact: TypeContactEnum | '';
  numberContact: string;
}
// Interfaces para los datos que se envian para crear la publiacion o editarla
interface DatosParaCrearPublicacion {
  formulario: FormularioPublicacion;
  imagenes: ImagenSeleccionada[];
}
interface DatosParaEditarPublicacion {
  formulario: FormularioPublicacion;
  imagenes: ImagenSeleccionada[]; //Files archivos nuevos que se guardarán en el servidor
  imagesInTheServer: string[]; //Links de la imagenes que ya estan en el serividor guardadas,
  imagesEliminatedFromServer: string[]; // Links de la imagenes que estan en el servidor pero se eliminarán
}
@Component({
  selector: 'app-publicaction-modal-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ImagesSelectorComponent,
  ],
  templateUrl: './publicaction-modal-register.component.html',
})
export class PublicactionModalRegisterComponent implements OnChanges {
  @Input() mostrar = false;
  @Input() usuarioActual: any;
  @Input() isSaving = false;
  @Input() publicationToEdit: Publication | null = null; // Publicación que se va a editar
  @Input() actionPublicationModal: ActionPublicationEnum =
    ActionPublicationEnum.CREATE;

  @Output() cerrar = new EventEmitter<void>();
  @Output() crearOEditar = new EventEmitter<
    DatosParaCrearPublicacion | DatosParaEditarPublicacion
  >();
  @Output() actualizar = new EventEmitter<{ id: string; data: any }>(); // Nuevo evento

  photoUser: Signal<string> = signal('');
  modoEdicion = false;
  imagesInTheServer!: string[];
  imagesEliminatedFromServer: string[] = [];

  stateImages: StateImages = StateImages.CREATE;
  /***
   *
   */
  ngOnChanges(changes: SimpleChanges): void {
    /**
     * Opción para cuando se va a crear un publicación
     */
    if (
      this.usuarioActual &&
      //Validamos que este creando un publicacion
      this.actionPublicationModal === 'create'
    ) {
      this.stateImages = StateImages.CREATE;
      // Aquí puedes setear datos iniciales, por ejemplo:
      const phone = this.usuarioActual.phone;
      const city = this.usuarioActual.city;
      const neighborhood = this.usuarioActual.neighborhood;
      const photo = this.usuarioActual.photo;
      if (phone) {
        this.formPublication.numberContact = phone;
      }
      if (city) {
        this.formPublication.city = city;
      }
      if (neighborhood) {
        this.formPublication.neighborhood = neighborhood;
      }
      if (photo) {
        this.photoUser = signal(photo);
      }
    }
    /**
     * Opción usada al editar
     */
    if (
      changes['publicationToEdit'] &&
      this.usuarioActual &&
      // Validamos que esté editando un publicacion
      this.actionPublicationModal === 'edit'
    ) {
      this.stateImages = StateImages.EDIT;
      const photo = this.usuarioActual.photo;
      if (photo) {
        this.photoUser = signal(photo);
      }
      if (this.publicationToEdit) {
        this.cargarDatosParaEdicion();
      } else {
        this.limpiarFormulario();
      }
    }
  }
  /***
   * Formulario de publicación
   */
  formPublication: FormularioPublicacion = {
    description: '',
    city: '',
    neighborhood: '',
    typeContact: '',
    numberContact: '',
  };

  imagenesSeleccionadas: ImagenSeleccionada[] = [];
  /**
   * Cierra el modal y lo cancela
   */
  cerrarModal(): void {
    this.limpiarFormulario();
    this.cerrar.emit();
  }
  /**
   * Envia la información de la publicación
   */
  enviarFormulario(): void {
    if (this.actionPublicationModal === 'create') {
      this.crearOEditar.emit({
        formulario: { ...this.formPublication },
        imagenes: [...this.imagenesSeleccionadas],
      });
    } else if (this.actionPublicationModal === 'edit') {
      //this.crearOEditar.emit();
      this.crearOEditar.emit({
        formulario: { ...this.formPublication },
        imagenes: this.imagenesSeleccionadas,
        imagesInTheServer: this.imagesInTheServer,
        imagesEliminatedFromServer: this.imagesEliminatedFromServer,
      });
    }

    this.limpiarFormulario();
  }
  /**
   * Emite un evento cuando se agregan imagenes para la publicación
   * @param imagenes
   */
  onImagenesChange(imagenes: ImagenSeleccionada[]): void {
    this.imagenesSeleccionadas = imagenes;
  }
  /**
   * Emite un evento cuando se eliminan imagenes en el servidors
   * @param imagenes
   */
  onImagenesServidorChange(data: {
    imagenesActuales: string[];
    imagenesEliminadas: string[];
  }) {
    // Actualizar las imágenes del servidor activas
    this.imagesInTheServer = data.imagenesActuales;

    // Guardar las eliminadas para enviar al backend después
    this.imagesEliminatedFromServer = data.imagenesEliminadas;
  }
  /**
   * Limpia el formulario
   */
  private limpiarFormulario(): void {
    this.formPublication = {
      description: '',
      city: '',
      neighborhood: '',
      typeContact: '',
      numberContact: '',
    };
    this.imagenesSeleccionadas = [];
  }
  /**
   *
   */
  cargarDatosParaEdicion() {
    if (this.publicationToEdit) {
      this.formPublication = {
        description: this.publicationToEdit.description,
        city: this.publicationToEdit.city,
        neighborhood: this.publicationToEdit.neighborhood,
        typeContact: this.validateTypeContact(
          this.publicationToEdit.typeContact
        ),
        numberContact: this.publicationToEdit.number,
      };
      this.imagesInTheServer = this.publicationToEdit.images;
    }
  }
  /**
   * Validar el tipo de contacto
   */
  validateTypeContact(typeContact: string) {
    const validTypes = Object.values(TypeContactEnum);
    return validTypes.includes(typeContact as TypeContactEnum)
      ? (typeContact as TypeContactEnum)
      : '';
  }
}
