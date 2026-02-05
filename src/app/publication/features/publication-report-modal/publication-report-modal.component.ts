import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Publication } from '../../models/publication.model';

@Component({
  selector: 'app-publication-report-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './publication-report-modal.component.html',
})
export class PublicationReportModalComponent {
  // Inputs
  @Input() mostrar: boolean = false;
  @Input() publicacion!: Publication;
  @Input() isSubmitting: boolean = false;
  @Input() usuarioActual: any = null;

  // Outputs
  @Output() cerrar = new EventEmitter<void>();
  @Output() enviar = new EventEmitter<{
    publicacion: any;
    razon: string;
    detalles: string;
    usuarioReportador: any;
  }>();

  // Propiedades internas
  razonSeleccionada: string = '';
  detallesReporte: string = '';

  // URL por defecto del avatar
  avatarDefault =
    'https://firebasestorage.googleapis.com/v0/b/tu-chamba-cf127.appspot.com/o/avatarNormal.png?alt=media&token=e99bcd5b-0f98-40ba-a662-c50042122a7d';

  // Getters
  get contadorCaracteres(): number {
    return this.detallesReporte?.length || 0;
  }

  get puedeEnviarReporte(): boolean {
    return this.razonSeleccionada !== '' && this.publicacion !== null;
  }

  // Métodos
  cerrarModal(): void {
    this.limpiarFormulario();
    this.cerrar.emit();
  }

  enviarReporte(): void {
    if (!this.puedeEnviarReporte) return;

    const reporteData = {
      publicacion: this.publicacion,
      razon: this.razonSeleccionada,
      detalles: this.detallesReporte.trim(),
      usuarioReportador: this.usuarioActual,
    };

    this.enviar.emit(reporteData);
  }

  private limpiarFormulario(): void {
    this.razonSeleccionada = '';
    this.detallesReporte = '';
  }

  // Lifecycle hook - se ejecuta cuando cambia el input 'mostrar'
  ngOnChanges(): void {
    if (!this.mostrar) {
      this.limpiarFormulario();
    }
  }
}
