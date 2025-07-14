import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, signal } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { first, Subject, switchMap, take, takeUntil, tap } from 'rxjs';
import { WorksService } from '../../services/works.service';
import { WorkerUser } from '../models/worker.model';
import { Comment } from '../models/comment.model';
import { SateliteUser } from '../models/satelite.model';
import CardPositionComponent from '../../../shared/ui/card-position/card-position.component';
import WaButtonComponent from '../../../shared/ui/wa-button/wa-button.component';
import { AuthStateService } from '../../../shared/data-access/auth-state.service';
import { toast } from 'ngx-sonner';
import { AnalyticsService } from '../../../shared/data-access/analytics.service';
import { TypeUser } from '../models/type-user.model';

const PATH_USERS = 'users';
@Component({
  selector: 'app-satelite-individual',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    WaButtonComponent,
  ],
  templateUrl: './satelite-individual.component.html',
  styleUrl: './satelite-individual.component.scss',
})
export default class SateliteIndividualComponent {
  // inyeccion de servicios
  private authState = inject(AuthStateService);
  private analyticsService = inject(AnalyticsService);

  // Crear signal para guardar el usuario individual
  sateliteSignal = signal<SateliteUser | null>(null);
  //
  private destroy$: Subject<void> = new Subject<void>();
  /**  */
  currentCommentPage: number = 1;
  commentsPerPage: number = 5;
  paginatedComments: Comment[] = [];
  sateliteId!: string | null;
  satelite!: WorkerUser;
  // Formulario para agregar un nuevo comentario
  commentForm!: FormGroup;
  /**
   *
   * @param route
   */
  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private worksService: WorksService,
    public authStateService: AuthStateService
  ) {}
  /**
   *
   */
  ngOnInit(): void {
    this.sateliteId = this.route.snapshot.paramMap.get('id');
    if (this.sateliteId) {
      this.loadWorker(PATH_USERS, this.sateliteId);
    }
    this.initializeForm();
    this.paginateComments(); // Cargar los primeros comentarios
  }
  // Método para paginar los comentarios en grupos de 5
  paginateComments() {
    setTimeout(() => {
      if (this.sateliteSignal() && this.sateliteSignal()?.comments) {
        const startIndex = (this.currentCommentPage - 1) * this.commentsPerPage;
        const endIndex = this.currentCommentPage * this.commentsPerPage;
        const comments = this.sateliteSignal()?.comments;
        if (comments) {
          this.paginatedComments = comments.slice(startIndex, endIndex);
        }
      }
    }, 0);
  }

  // Avanzar a la siguiente página de comentarios
  nextCommentsPage() {
    if (
      this.currentCommentPage * this.commentsPerPage <
      this.satelite.comments.length
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
    this.sateliteId = this.route.snapshot.paramMap.get('id');
    if (this.commentForm.valid) {
      const idCurrentUser = this.authState.currentUser?.uid;

      if (
        idCurrentUser &&
        this.sateliteId &&
        idCurrentUser !== this.sateliteId
      ) {
        const newComment: Comment = {
          comment: this.commentForm.value.comment,
          id_person: idCurrentUser, // Puedes reemplazar esto con el id de la persona actual
          score: this.commentForm.value.score,
        };
        this.paginateComments(); // Volvemos a paginar los comentarios
        this.commentForm.reset(); // Reiniciar el formulario
        const sateliteUserData = this.sateliteSignal();
        if (sateliteUserData) {
          //VAlidamos que este usario no haya comentado
          if (
            !sateliteUserData.comments.some(
              (comment) => comment.id_person === idCurrentUser
            )
          ) {
            sateliteUserData.comments.push(newComment);
            sateliteUserData.average_score = Number(
              this.countAverageScore(sateliteUserData.comments).toFixed(2)
            );
            this.worksService.addComment(
              PATH_USERS,
              sateliteUserData,
              this.sateliteId
            );
            toast.success('Calificación hecho con éxito ');
          } else {
            toast.error(
              'Ya has calificado a este usuario, no puedes calificarlo 2 veces'
            );
          }
        }
      } else if (idCurrentUser === this.sateliteId) {
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
   * @param sateliteId
   */
  loadWorker(collectionName: string, sateliteId: string) {
    this.worksService
      .getUserByIdAndCollection(sateliteId, collectionName)
      .pipe(
        first(),
        takeUntil(this.destroy$),
        tap((satelite: any) => {
          const validationUSer = satelite as SateliteUser;
          this.sateliteSignal.set(validationUSer);
          this.analyticsService.logCustomEvent('page-visit', {
            page: 'satelite-individual',
            sateliteData: validationUSer,
          });
          this.paginateComments();
        }),
        switchMap((satelite: SateliteUser) => {
          if (satelite.countProfileVisits) {
            satelite.countProfileVisits++;
          } else {
            satelite.countProfileVisits = 1;
          }
          return this.worksService.updateUser(PATH_USERS, satelite, null);
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
    const sateliteData = this.sateliteSignal();
    const typeUser = sateliteData?.typeUSer;
    if (sateliteData && typeUser) {
      if (sateliteData.countContactViaWa) {
        sateliteData.countContactViaWa++;
      } else {
        sateliteData.countContactViaWa = 1;
      }
      this.worksService
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
