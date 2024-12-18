import {
  AfterViewInit,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { WorksService } from '../../services/works.service';
import { SateliteUser } from '../models/satelite.model';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import CardSateliteComponent from '../../../shared/ui/card-satelite/card-satelite.component';
import { TallerUSer } from '../models/talleres.model';
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { WorkerUser } from '../models/worker.model';
import { Comment } from '../models/comment.model';
import WaButtonComponent from '../../../shared/ui/wa-button/wa-button.component';
import CardPositionComponent from '../../../shared/ui/card-position/card-position.component';
import { AuthStateService } from '../../../shared/data-access/auth-state.service';
import { toast } from 'ngx-sonner';
import { AnalyticsService } from '../../../shared/data-access/analytics.service';

const COLLECTION_DATA = 'talleres';

@Component({
  selector: 'app-taller-individual',
  standalone: true,
  imports: [
    CardPositionComponent,
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    WaButtonComponent,
  ],
  templateUrl: './taller-individual.component.html',
  styleUrl: './taller-individual.component.scss',
})
export default class TallerIndividualComponent {
  // Services
  private authState = inject(AuthStateService);
  private analyticsService = inject(AnalyticsService);

  // Crear signal para guardar el usuario individual
  tallerSignal = signal<TallerUSer | null>(null);
  //
  private destroy$: Subject<void> = new Subject<void>();
  /**  */
  currentCommentPage: number = 1;
  commentsPerPage: number = 5;
  paginatedComments: Comment[] = [];
  tallerId!: string | null;
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
    private worksService: WorksService
  ) {}
  /**
   *
   */
  ngOnInit(): void {
    this.tallerId = this.route.snapshot.paramMap.get('id');
    if (this.tallerId) {
      this.loadWorker(COLLECTION_DATA, this.tallerId);
    }
    this.initializeForm();
    this.paginateComments(); // Cargar los primeros comentarios
  }
  // Método para paginar los comentarios en grupos de 5
  paginateComments() {
    setTimeout(() => {
      if (this.tallerSignal() && this.tallerSignal()?.comments) {
        const startIndex = (this.currentCommentPage - 1) * this.commentsPerPage;
        const endIndex = this.currentCommentPage * this.commentsPerPage;
        const comments = this.tallerSignal()?.comments;
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
    this.tallerId = this.route.snapshot.paramMap.get('id');
    if (this.commentForm.valid) {
      const idCurrentUser = this.authState.currentUser?.uid;

      if (idCurrentUser && this.tallerId) {
        const newComment: Comment = {
          comment: this.commentForm.value.comment,
          id_person: idCurrentUser, // Puedes reemplazar esto con el id de la persona actual
          score: this.commentForm.value.score,
        };
        this.paginateComments(); // Volvemos a paginar los comentarios
        this.commentForm.reset(); // Reiniciar el formulario
        const tallerUserData = this.tallerSignal();
        if (tallerUserData) {
          //VAlidamos que este usario no haya comentado
          if (
            !tallerUserData.comments.some(
              (comment) => comment.id_person === idCurrentUser
            )
          ) {
            tallerUserData.comments.push(newComment);
            tallerUserData.average_score = Number(
              this.countAverageScore(tallerUserData.comments).toFixed(2)
            );
            this.worksService.addComment(
              'talleres',
              tallerUserData,
              this.tallerId
            );
            toast.success('Calificación hecho con éxito ');
          } else {
            toast.error(
              'Ya has calificado a este usuario, no puedes calificarlo 2 veces'
            );
          }
        }
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
   * @param tallerId
   */
  loadWorker(collectionName: string, tallerId: string) {
    this.worksService
      .getUserByIdAndCollection(tallerId, collectionName)
      .pipe(takeUntil(this.destroy$))
      .subscribe((worker: any) => {
        const validationUSer = worker as TallerUSer;
        this.tallerSignal.set(validationUSer);
        this.analyticsService.logCustomEvent('page-visit', {
          page: 'taller-individual',
          sateliteData: validationUSer,
        });
        this.paginateComments();
      });
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
    //console.log(position);
  }
  /**
   *
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
