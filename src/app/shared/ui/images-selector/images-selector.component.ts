import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import Swal from 'sweetalert2';

export enum StateImages {
  CREATE = 'create',
  EDIT = 'edit',
}

export interface ImagenSeleccionada {
  file: File;
  preview: string;
}

@Component({
  selector: 'app-images-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './images-selector.component.html',
})
export class ImagesSelectorComponent {
  @Input() imagenesSeleccionadas: ImagenSeleccionada[] = [];
  @Input() imagenesSubidasAlServidor: string[] = [];
  @Input() state: StateImages = StateImages.CREATE;

  @Output() imagenesChange = new EventEmitter<ImagenSeleccionada[]>();
  @Output() imagenesServidorChange = new EventEmitter<{
    imagenesActuales: string[];
    imagenesEliminadas: string[];
  }>();

  @ViewChild('inputImagenes') inputImagenes!: ElementRef<HTMLInputElement>;
  imagesServerEliminated: string[] = [];
  /**
   *  Se elige la imagen que el usuario sube
   * @param event
   * @returns
   */
  onImagenesSeleccionadas(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (!files) return;
    const filesLength = files.length;
    const nuevasImagenes: ImagenSeleccionada[] = [];
    //Se coloca un máximo de imagenes 5 por publicación
    const maxImagenes = 5;
    const maxSize = 5 * 1024 * 1024; // 5MB
    /**
     * Caso que se este creando una publicación de trabajo o market place
     * este método solo recibe archivos que vienen del dipositivo del usuario
     */
    if (this.state === 'create') {
      for (let i = 0; i < files.length; i++) {
        if (
          this.imagenesSeleccionadas.length + nuevasImagenes.length >=
          maxImagenes
        ) {
          break;
        }
        const file = files[i];
        if (file.size > maxSize) {
          Swal.fire({
            title: 'Error',
            text: `La imagen ${file.name} es muy grande (máximo 5MB)`,
            icon: 'warning',
            confirmButtonText: 'Aceptar',
          });
          continue;
        }
        if (!file.type.startsWith('image/')) {
          Swal.fire({
            title: 'Error',
            text: `El archivo ${file.name} no es una imagen válida`,
            icon: 'warning',
            confirmButtonText: 'Aceptar',
          });
          continue;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          nuevasImagenes.push({
            file: file,
            preview: e.target?.result as string,
          });
          if (
            nuevasImagenes.length ===
            Math.min(
              filesLength,
              maxImagenes - this.imagenesSeleccionadas.length
            )
          ) {
            const todasLasImagenes = [
              ...this.imagenesSeleccionadas,
              ...nuevasImagenes,
            ];
            this.imagenesChange.emit(todasLasImagenes);
          }
        };
        reader.readAsDataURL(file);
      }
      // Limpiar el input
      input.value = '';
    } else if (this.state === 'edit') {
      /**
       * Aquí se separa la logica porque en edit pueden venir imagenes que ya estan en el servidor y las nuevas que se agreguen,
       * Por esto se requiere generar esta nueva lógica para separar ambas tipos de imagenes.
       */
      const totalImagenesActuales = this.getTotalImagenesActuales();
      const espacioDisponible = maxImagenes - totalImagenesActuales;
      if (espacioDisponible <= 0) {
        Swal.fire({
          title: 'Límite alcanzado',
          text: `Ya tienes el máximo de ${maxImagenes} imágenes permitidas`,
          icon: 'info',
          confirmButtonText: 'Aceptar',
        });
        input.value = '';
        return;
      }

      let procesadas = 0;
      const archivosAProcesar = Math.min(files.length, espacioDisponible);
      /**Verificacion si quieren subir más de 5 imagenes*/
      if (espacioDisponible < files.length) {
        Swal.fire({
          title: 'Sólo puedes subir 5 imagenes máximo',
          text: `Estas intentado subir más de ${maxImagenes} imágenes, sólo se subiran las 5 imagenes que subiste primero. Sí deseas subir otra imagen debes eliminar una de la que ya subiste.`,
          icon: 'info',
          confirmButtonText: 'Aceptar',
        });
      }
      for (
        let i = 0;
        i < files.length && nuevasImagenes.length < espacioDisponible;
        i++
      ) {
        const file = files[i];
        if (file.size > maxSize) {
          procesadas++;
          Swal.fire({
            title: 'Error',
            text: `La imagen ${file.name} es muy grande (máximo 5MB)`,
            icon: 'warning',
            confirmButtonText: 'Aceptar',
          });
          continue;
        }

        if (!file.type.startsWith('image/')) {
          procesadas++;
          Swal.fire({
            title: 'Error',
            text: `El archivo ${file.name} no es una imagen válida`,
            icon: 'warning',
            confirmButtonText: 'Aceptar',
          });
          continue;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          nuevasImagenes.push({
            file: file,
            preview: e.target?.result as string,
          });
          procesadas++;

          // Cuando se han procesado todos los archivos válidos
          if (
            procesadas === archivosAProcesar ||
            nuevasImagenes.length === espacioDisponible
          ) {
            const todasLasImagenes = [
              ...this.imagenesSeleccionadas,
              ...nuevasImagenes,
            ];
            this.imagenesChange.emit(todasLasImagenes);
          }
        };
        reader.readAsDataURL(file);
      }
      input.value = '';
    }
  }
  /**
   * Se borra la imagen
   * @param index
   */
  eliminarImagen(index: number): void {
    const nuevasImagenes = this.imagenesSeleccionadas.filter(
      (_, i) => i !== index
    );
    this.imagenesChange.emit(nuevasImagenes);
  }
  /**
   * Se marca para borrar la imagen del servidor
   * @param index
   */
  eliminarImagenDelServidor(index: number): void {
    const imagenAEliminar = this.imagenesSubidasAlServidor[index];

    // Agregar a la lista de eliminadas si no está ya
    if (!this.imagesServerEliminated.includes(imagenAEliminar)) {
      this.imagesServerEliminated.push(imagenAEliminar);
    }

    // Calcular las imágenes del servidor que quedan activas
    const imagenesServidorActivas = this.imagenesSubidasAlServidor.filter(
      (imagen) => !this.imagesServerEliminated.includes(imagen)
    );
    // Emitir los cambios al componente padre
    this.imagenesServidorChange.emit({
      imagenesActuales: imagenesServidorActivas,
      imagenesEliminadas: this.imagesServerEliminated,
    });
  }
  /**
   * Calcula el total de imágenes actuales (servidor + seleccionadas - eliminadas)
   */
  private getTotalImagenesActuales(): number {
    return (
      this.imagenesSubidasAlServidor.length + this.imagenesSeleccionadas.length
    );
  }
}
