import { Component, inject, OnInit, signal } from '@angular/core';
import { WorkerUser } from '../models/worker.model';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Comment } from '../models/comment.model';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { WorksService } from '../../services/works.service';
import { first, of, Subject, switchMap, take, takeUntil, tap } from 'rxjs';
import WaButtonComponent from '../../../shared/ui/wa-button/wa-button.component';
import { AuthStateService } from '../../../shared/data-access/auth-state.service';
import { toast } from 'ngx-sonner';
import { TypeUser } from '../models/type-user.model';

const PATH_USERS = 'users';
@Component({
  selector: 'app-worker-individual',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    WaButtonComponent,
  ],
  templateUrl: './worker-individual.component.html',
  styleUrl: './worker-individual.component.scss',
})
export default class WorkerIndividualComponent implements OnInit {
  //Current User
  private authState = inject(AuthStateService);
  // Crear signal para guardar el usuario individual
  workerSignal = signal<WorkerUser | null>(null);
  stateAuth = signal<boolean>(false);
  private hasUpdatedVisitCount = false; // Flag para prevenir múltiples actualizaciones
  //
  private destroy$: Subject<void> = new Subject<void>();
  /**  */
  currentCommentPage: number = 1;
  commentsPerPage: number = 5;
  paginatedComments: Comment[] = [];
  workerId!: string | null;
  worker!: WorkerUser;
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
    this.workerId = this.route.snapshot.paramMap.get('id');
    if (this.workerId) {
      this.loadWorker(PATH_USERS, this.workerId);
    }
    this.authState.isAuthenticated$
      .pipe(
        takeUntil(this.destroy$),
        tap((state) => this.stateAuth.set(state))
      )
      .subscribe();
    this.initializeForm();
    this.paginateComments(); // Cargar los primeros comentarios
  }

  // Método para paginar los comentarios en grupos de 5
  paginateComments() {
    setTimeout(() => {
      if (this.workerSignal() && this.workerSignal()?.comments) {
        const startIndex = (this.currentCommentPage - 1) * this.commentsPerPage;
        const endIndex = this.currentCommentPage * this.commentsPerPage;
        const comments = this.workerSignal()?.comments;
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
      this.worker.comments.length
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
    this.workerId = this.route.snapshot.paramMap.get('id');
    if (this.commentForm.valid) {
      const idCurrentUser = this.authState.currentUser?.uid;

      if (idCurrentUser && this.workerId && idCurrentUser !== this.workerId) {
        const newComment: Comment = {
          comment: this.commentForm.value.comment,
          id_person: idCurrentUser, // Puedes reemplazar esto con el id de la persona actual
          score: this.commentForm.value.score,
        };
        this.paginateComments(); // Volvemos a paginar los comentarios
        this.commentForm.reset(); // Reiniciar el formulario
        const workerUserData = this.workerSignal();
        if (workerUserData) {
          //VAlidamos que este usario no haya comentado
          if (
            !workerUserData.comments.some(
              (comment) => comment.id_person === idCurrentUser
            )
          ) {
            workerUserData.comments.push(newComment);
            workerUserData.average_score = Number(
              this.countAverageScore(workerUserData.comments).toFixed(2)
            );
            this.worksService
              .addComment(PATH_USERS, workerUserData, this.workerId)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (res) => res,
                error: (err) => toast.error('Error al actualizar el documento'),
              });

            toast.success('Calificación hecho con éxito ');
          } else {
            toast.error(
              'Ya has calificado a este usuario, no puedes calificarlo 2 veces'
            );
          }
        }
      } else if (idCurrentUser === this.workerId) {
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
   * @param workerId
   */
  loadWorker(collectionName: string, workerId: string) {
    this.worksService
      .getUserByIdAndCollection(workerId, collectionName)
      .pipe(
        first(),
        takeUntil(this.destroy$),
        tap((worker: any) => {
          const validationUSer = worker as WorkerUser;
          this.workerSignal.set(validationUSer);
          this.paginateComments();
        }),
        switchMap((worker: WorkerUser) => {
          if (worker.countProfileVisits) {
            worker.countProfileVisits++;
          } else {
            worker.countProfileVisits = 1;
          }
          return this.worksService.updateUser(PATH_USERS, worker, null);
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
   * Acción de clic en el botón de WA
   * Se aumenta un conteo de clic para saber a quienes
   * buscan más seguido
   */
  handleWaButton() {
    const sateliteData = this.workerSignal();
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
