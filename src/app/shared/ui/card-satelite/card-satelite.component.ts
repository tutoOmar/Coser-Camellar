import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SateliteUser } from '../../../works/features/models/satelite.model';
import { TallerUSer } from '../../../works/features/models/talleres.model';
import WaButtonComponent from '../wa-button/wa-button.component';
import { AuthStateService } from '../../data-access/auth-state.service';
import { WorksService } from '../../../works/services/works.service';
import { Subject, takeUntil, take } from 'rxjs';

@Component({
  selector: 'app-card-satelite',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, WaButtonComponent],
  templateUrl: './card-satelite.component.html',
  styleUrl: './card-satelite.component.scss',
})
export default class CardSateliteComponent {
  private destroy$: Subject<void> = new Subject<void>();

  // Validamos el estado
  public authState = inject(AuthStateService).currentUser;
  private router = inject(Router);
  // LLega la información del trabajador
  satelite = input<SateliteUser | TallerUSer>();

  // Usando el nuevo decorador output() de signals
  viewMoreComments = output<string | undefined>();

  // Signal para el estado interno
  showMoreSignal = false;
  //
  constructor(
    public authStateService: AuthStateService,
    private workService: WorksService
  ) {}
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

  onViewMoreComments() {
    // Emitimos el evento usando el nuevo método emit() del output signal
    if (this.satelite()) {
      this.viewMoreComments.emit(this.satelite()?.id);
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
  //
  goIndividual() {
    const typeUser = this.satelite() ? this.satelite()?.typeUSer : 'satelite';
    const id = this.satelite() ? this.satelite()?.id : '';
    if (id && typeUser) {
      this.router.navigate([`/works/${typeUser}`, id]);
    }
  }
  /**
   * Acción de clic en el botón de WA
   * Se aumenta un conteo de clic para saber a quienes
   * buscan más seguido
   */
  handleWaButton() {
    const sateliteData = this.satelite();
    const typeUser = sateliteData?.typeUSer;
    if (sateliteData && typeUser) {
      if (sateliteData.countContactViaWa) {
        sateliteData.countContactViaWa++;
      } else {
        sateliteData.countContactViaWa = 1;
      }
      this.workService
        .updateUser(typeUser, sateliteData, null)
        .pipe(takeUntil(this.destroy$), take(1))
        .subscribe();
    }
  }
  /**
   *
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
