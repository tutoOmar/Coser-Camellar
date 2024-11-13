import {
  Component,
  inject,
  input,
  OnInit,
  output,
  WritableSignal,
} from '@angular/core';
import { WorkerUser } from '../../../works/features/models/worker.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import WaButtonComponent from '../wa-button/wa-button.component';
import { AuthStateService } from '../../data-access/auth-state.service';

@Component({
  selector: 'app-card-calification',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, WaButtonComponent],
  templateUrl: './card-calification.component.html',
  styleUrl: './card-calification.component.scss',
})
export default class CardCalificationComponent {
  // Validamos el estado
  public authState = inject(AuthStateService).currentUser;
  // LLega la información del trabajador
  worker = input<WorkerUser>();

  // Usando el nuevo decorador output() de signals
  viewMoreComments = output<string | undefined>();

  // Signal para el estado interno
  showMoreSignal = false;
  //
  constructor(public authStateService: AuthStateService) {}
  /**
   *
   */
  toggleShowMore() {
    if (this.showMoreSignal) {
      this.showMoreSignal = false;
    } else {
      this.showMoreSignal = true;
    }
  }
  /**
   *
   */
  onViewMoreComments() {
    // Emitimos el evento usando el nuevo método emit() del output signal
    if (this.worker()) {
      this.viewMoreComments.emit(this.worker()?.id);
    }
  }
  /**Remueve guiónes de las palabras que normalmente las lleva*/
  removeHyphens(wordWithHyphens: string[] | undefined): string {
    if (wordWithHyphens) {
      const newMap = wordWithHyphens.map((specialty: String) => {
        const wordUpperCase =
          specialty[0].toUpperCase() + specialty.substring(1);
        return wordUpperCase.replace(/-/g, ' ');
      });
      const specialtiesComplete = newMap.join(', ');
      return specialtiesComplete;
    } else {
      return '';
    }
  }
}
