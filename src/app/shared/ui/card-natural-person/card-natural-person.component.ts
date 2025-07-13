import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, take } from 'rxjs';
import { WorksService } from '../../../works/services/works.service';
import { AuthStateService } from '../../data-access/auth-state.service';
import WaButtonComponent from '../wa-button/wa-button.component';
import { NaturalPersonUser } from '../../../works/features/models/natural-person.model';
const PATH_USER = 'users';

@Component({
  selector: 'app-card-natural-person',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, WaButtonComponent],
  templateUrl: './card-natural-person.component.html',
  styleUrl: './card-natural-person.component.scss',
})
export class CardNaturalPersonComponent {
  private destroy$: Subject<void> = new Subject<void>();

  // Validamos el estado
  public authState = inject(AuthStateService).currentUser;
  // LLega la información del trabajador
  naturalPerson = input<NaturalPersonUser>();

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
  /** Functions */
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
    if (this.naturalPerson()) {
      this.viewMoreComments.emit(this.naturalPerson()?.id);
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
    const naturalPersonData = this.naturalPerson();
    if (naturalPersonData) {
      if (naturalPersonData.countContactViaWa) {
        naturalPersonData.countContactViaWa++;
      } else {
        naturalPersonData.countContactViaWa = 1;
      }
      this.userService
        .updateUser(PATH_USER, naturalPersonData, null)
        .pipe(takeUntil(this.destroy$), take(1))
        .subscribe();
    }
  }
}
