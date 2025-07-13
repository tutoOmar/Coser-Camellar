import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import WaButtonComponent from '../../../shared/ui/wa-button/wa-button.component';
import { first, Subject, switchMap, take, takeUntil, tap } from 'rxjs';
import { toast } from 'ngx-sonner';
import { AnalyticsService } from '../../../shared/data-access/analytics.service';
import { AuthStateService } from '../../../shared/data-access/auth-state.service';
import { WorksService } from '../../services/works.service';
import { TypeUser } from '../models/type-user.model';
import { NaturalPersonUser } from '../models/natural-person.model';
import { Comment } from '../models/comment.model';

const PATH_USERS = 'users';

@Component({
  selector: 'app-persona-natural-individual',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    WaButtonComponent,
  ],
  templateUrl: './persona-natural-individual.component.html',
  styleUrl: './persona-natural-individual.component.scss',
})
export default class PersonaNaturalIndividualComponent {
  // inyeccion de servicios
  private authState = inject(AuthStateService);
  private analyticsService = inject(AnalyticsService);

  // Crear signal para guardar el usuario individual
  naturalPersonSignal = signal<NaturalPersonUser | null>(null);
  //
  private destroy$: Subject<void> = new Subject<void>();
  /**  */
  currentCommentPage: number = 1;
  commentsPerPage: number = 5;
  paginatedComments: Comment[] = [];
  naturalPersonId!: string | null;
  naturalPerson!: NaturalPersonUser;
  // Formulario para agregar un nuevo comentario
  commentForm!: FormGroup;
  /** =========================================
   * Ng functions
   */
  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private worksService: WorksService,
    public authStateService: AuthStateService
  ) {}
  ngOnInit(): void {
    this.naturalPersonId = this.route.snapshot.paramMap.get('id');
    if (this.naturalPersonId) {
      this.loadWorker(PATH_USERS, this.naturalPersonId);
    }
    this.initializeForm();
    this.paginateComments(); // Cargar los primeros comentarios
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  /** =================   Functions   ======================= */
  // Método para paginar los comentarios en grupos de 5
  paginateComments() {
    setTimeout(() => {
      if (this.naturalPersonSignal() && this.naturalPersonSignal()?.comments) {
        const startIndex = (this.currentCommentPage - 1) * this.commentsPerPage;
        const endIndex = this.currentCommentPage * this.commentsPerPage;
        const comments = this.naturalPersonSignal()?.comments;
        if (comments) {
          this.paginatedComments = comments.slice(startIndex, endIndex);
        }
      }
    }, 0);
  }

  // Avanzar a la siguiente página de comentarios
  nextCommentsPage() {
    if (
      this.naturalPerson.comments &&
      this.currentCommentPage * this.commentsPerPage <
        this.naturalPerson.comments.length
    ) {
      this.currentCommentPage++;
      this.paginateComments();
    }
  }

  // Inicializar el formulario de comentarios
  initializeForm() {
    this.commentForm = this.fb.group({
      comment: ['', Validators.required],
      score: [
        null,
        [Validators.required, Validators.min(1), Validators.max(5)],
      ],
    });
  }

  // Agregar un nuevo comentario
  addComment() {
    this.naturalPersonId = this.route.snapshot.paramMap.get('id');
    if (this.commentForm.valid) {
      const idCurrentUser = this.authState.currentUser?.uid;

      if (
        idCurrentUser &&
        this.naturalPersonId &&
        idCurrentUser !== this.naturalPersonId
      ) {
        const newComment: Comment = {
          comment: this.commentForm.value.comment,
          id_person: idCurrentUser, // Puedes reemplazar esto con el id de la persona actual
          score: this.commentForm.value.score,
        };
        this.paginateComments(); // Volvemos a paginar los comentarios
        this.commentForm.reset(); // Reiniciar el formulario
        const naturalPersonData = this.naturalPersonSignal();
        if (naturalPersonData && naturalPersonData.comments) {
          //VAlidamos que este usario no haya comentado
          if (
            !naturalPersonData.comments.some(
              (comment) => comment.id_person === idCurrentUser
            )
          ) {
            naturalPersonData.comments.push(newComment);
            naturalPersonData.average_score = Number(
              this.countAverageScore(naturalPersonData.comments).toFixed(2)
            );
            this.worksService.addComment(
              PATH_USERS,
              naturalPersonData,
              this.naturalPersonId
            );
            toast.success('Calificación hecho con éxito ');
          } else {
            toast.error(
              'Ya has calificado a este usuario, no puedes calificarlo 2 veces'
            );
          }
        }
      } else if (idCurrentUser === this.naturalPersonId) {
        toast.error('No puedes calificarte a ti mismo 😅');
      } else {
        toast.error('No puedes calificar sin iniciar sesión');
      }
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
   *
   * @param collectionName
   * @param naturalPersonId
   */
  loadWorker(collectionName: string, naturalPersonId: string) {
    this.worksService
      .getUserByIdAndCollection(naturalPersonId, collectionName)
      .pipe(
        first(),
        takeUntil(this.destroy$),
        tap((naturalPerson: any) => {
          const validationUSer = naturalPerson as NaturalPersonUser;
          this.naturalPersonSignal.set(validationUSer);
          this.naturalPerson = naturalPerson;
          this.analyticsService.logCustomEvent('page-visit', {
            page: 'natural-person-individual',
            empresaData: validationUSer,
          });
          this.paginateComments();
        }),
        switchMap((naturalPersonal: NaturalPersonUser) => {
          if (naturalPersonal.countProfileVisits) {
            naturalPersonal.countProfileVisits++;
          } else {
            naturalPersonal.countProfileVisits = 1;
          }
          return this.worksService.updateUser(
            TypeUser.PERSONA_NATURAL,
            naturalPersonal,
            null
          );
        })
      )
      .subscribe();
  }
  /**
   *
   * @param comments
   * @returns
   */
  countAverageScore(comments: Comment[]): number {
    let count = 0;
    const sizeComments = comments.length;
    comments.forEach((comment: Comment) => {
      count = count + comment.score;
    });
    return count / sizeComments;
  }
  /**
   *
   * @param position
   */
  countPosition(position: any[] | undefined) {
    // console.log(position);
  }
  /**
   * Acción de clic en el botón de WA
   * Se aumenta un conteo de clic para saber a quienes
   * buscan más seguido
   */
  handleWaButton() {
    const empresaData = this.naturalPersonSignal();
    const typeUser = empresaData?.typeUSer;
    if (empresaData && typeUser) {
      if (empresaData.countContactViaWa) {
        empresaData.countContactViaWa++;
      } else {
        empresaData.countContactViaWa = 1;
      }
      this.worksService
        .updateUser(typeUser, empresaData, null)
        .pipe(takeUntil(this.destroy$), take(1))
        .subscribe();
    }
  }
}
