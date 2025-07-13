import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import WaButtonComponent from '../wa-button/wa-button.component';
import { Subject, takeUntil, take } from 'rxjs';
import { WorksService } from '../../../works/services/works.service';
import { AuthStateService } from '../../data-access/auth-state.service';
import { EmpresaUser } from '../../../works/features/models/empresa.model';

const PATH_USER = 'users';
@Component({
  selector: 'app-card-empresa',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, WaButtonComponent],
  templateUrl: './card-empresa.component.html',
  styleUrl: './card-empresa.component.scss',
})
export class CardEmpresaComponent {
  private destroy$: Subject<void> = new Subject<void>();

  // Validamos el estado
  public authState = inject(AuthStateService).currentUser;
  // LLega la información del trabajador
  empresa = input<EmpresaUser>();

  // Usando el nuevo decorador output() de signals
  viewMoreComments = output<string | undefined>();

  // Signal para el estado interno
  showMoreSignal = false;
  //=============  Ng Functions   ===================//
  constructor(
    public authStateService: AuthStateService,
    private userService: WorksService
  ) {}
  /**
   *
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  /**==========0 Functions ==============*/
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
    if (this.empresa()) {
      this.viewMoreComments.emit(this.empresa()?.id);
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
  /**
   * Acción de clic en el botón de WA
   * Se aumenta un conteo de clic para saber a quienes
   * buscan más seguido
   */
  handleWaButton() {
    const empresaData = this.empresa();
    if (empresaData) {
      if (empresaData.countContactViaWa) {
        empresaData.countContactViaWa++;
      } else {
        empresaData.countContactViaWa = 1;
      }
      this.userService
        .updateUser(PATH_USER, empresaData, null)
        .pipe(takeUntil(this.destroy$), take(1))
        .subscribe();
    }
  }
}
