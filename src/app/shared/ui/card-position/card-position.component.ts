import {
  Component,
  inject,
  input,
  output,
  WritableSignal,
} from '@angular/core';
import { Position } from '../../../works/features/models/position.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import WaButtonComponent from '../wa-button/wa-button.component';
import { AuthService } from '../../../auth/data-access/auth.service';
import { AuthStateService } from '../../data-access/auth-state.service';

@Component({
  selector: 'app-card-position',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, WaButtonComponent],
  templateUrl: './card-position.component.html',
  styleUrl: './card-position.component.scss',
})
export default class CardPositionComponent {
  // Validamos el estado
  public authState = inject(AuthStateService).currentUser;
  // Input para recibir la posición desde el padre
  position = input<Position>();

  // Output para emitir eventos relacionados con la posición
  viewMoreDetails = output<string | undefined>();

  // Signal para controlar el estado de ver más/menos detalles
  showMoreSignal = false;

  // Función para alternar la visualización de detalles adicionales
  toggleShowMore() {
    this.showMoreSignal = !this.showMoreSignal;
  }

  // Función que emite el evento para ver más detalles de la posición
  onViewMoreDetails() {
    if (this.position()) {
      this.viewMoreDetails.emit(this.position()?.id);
    }
  }
  //
  constructor(public authStateService: AuthStateService) {}
  // Función para mostrar el tipo de pago con formato
  getPaymentType(paymentType: string): string {
    switch (paymentType) {
      case 'destajo':
        return 'Pago por destajo';
      case 'salario':
        return 'Salario mensual';
      case 'contrato':
        return 'Pago por contrato';
      default:
        return 'Método de pago no definido';
    }
  }

  // Función para formatear las especialidades removiendo guiones
  removeHyphens(specialtyList: string[] | undefined): string {
    if (specialtyList) {
      const formattedSpecialties = specialtyList.map((specialty: string) => {
        const formatted =
          specialty[0].toUpperCase() + specialty.substring(1).toLowerCase();
        return formatted.replace(/-/g, ' ');
      });
      return formattedSpecialties.join(', ');
    } else {
      return 'N/A';
    }
  }

  // Función para mostrar la imagen predeterminada si no hay foto
  getPositionPhoto(): string {
    if (this.position()?.photo) {
      return this.position()?.photo!;
    } else {
      return 'https://example.com/default-position-image.jpg';
    }
  }

  // Función para traducir el estado de la posición
  getPositionStatus(status: string): string {
    return status === 'activo' ? 'Posición Activa' : 'Posición Inactiva';
  }
}
