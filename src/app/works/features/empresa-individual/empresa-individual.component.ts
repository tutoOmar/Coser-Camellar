import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { toast } from 'ngx-sonner';
import { Subject, first, takeUntil, tap, switchMap, take } from 'rxjs';
import { AnalyticsService } from '../../../shared/data-access/analytics.service';
import { AuthStateService } from '../../../shared/data-access/auth-state.service';
import WaButtonComponent from '../../../shared/ui/wa-button/wa-button.component';
import { WorksService } from '../../services/works.service';
import { TypeUser } from '../models/type-user.model';
import { Comment } from '../models/comment.model';
import { EmpresaUser } from '../models/empresa.model';

const PATH_USERS = 'users';
@Component({
  selector: 'app-empresa-individual',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    WaButtonComponent,
  ],
  templateUrl: './empresa-individual.component.html',
  styleUrl: './empresa-individual.component.scss',
})
export default class EmpresaIndividualComponent {
  // inyeccion de servicios
  private authState = inject(AuthStateService);
  private analyticsService = inject(AnalyticsService);

  // Crear signal para guardar el usuario individual
  empresaSignal = signal<EmpresaUser | null>(null);
  //
  private destroy$: Subject<void> = new Subject<void>();
  /**  */
  currentCommentPage: number = 1;
  commentsPerPage: number = 5;
  paginatedComments: Comment[] = [];
  empresaId!: string | null;
  empresa!: EmpresaUser;
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
    this.empresaId = this.route.snapshot.paramMap.get('id');
    if (this.empresaId) {
      this.loadWorker(PATH_USERS, this.empresaId);
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
      if (this.empresaSignal() && this.empresaSignal()?.comments) {
        const startIndex = (this.currentCommentPage - 1) * this.commentsPerPage;
        const endIndex = this.currentCommentPage * this.commentsPerPage;
        const comments = this.empresaSignal()?.comments;
        if (comments) {
          this.paginatedComments = comments.slice(startIndex, endIndex);
        }
      }
    }, 0);
  }

  // Avanzar a la siguiente página de comentarios
  nextCommentsPage() {
    if (
      this.empresa.comments &&
      this.currentCommentPage * this.commentsPerPage <
        this.empresa.comments.length
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
    this.empresaId = this.route.snapshot.paramMap.get('id');
    if (this.commentForm.valid) {
      const idCurrentUser = this.authState.currentUser?.uid;

      if (idCurrentUser && this.empresaId && idCurrentUser !== this.empresaId) {
        const newComment: Comment = {
          comment: this.commentForm.value.comment,
          id_person: idCurrentUser, // Puedes reemplazar esto con el id de la persona actual
          score: this.commentForm.value.score,
        };
        this.paginateComments(); // Volvemos a paginar los comentarios
        this.commentForm.reset(); // Reiniciar el formulario
        const empresaData = this.empresaSignal();
        if (empresaData && empresaData.comments) {
          //VAlidamos que este usario no haya comentado
          if (
            !empresaData.comments.some(
              (comment) => comment.id_person === idCurrentUser
            )
          ) {
            empresaData.comments.push(newComment);
            empresaData.average_score = Number(
              this.countAverageScore(empresaData.comments).toFixed(2)
            );
            this.worksService.addComment(
              PATH_USERS,
              empresaData,
              this.empresaId
            );
            toast.success('Calificación hecho con éxito ');
          } else {
            toast.error(
              'Ya has calificado a este usuario, no puedes calificarlo 2 veces'
            );
          }
        }
      } else if (idCurrentUser === this.empresaId) {
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
   * @param empresaId
   */
  loadWorker(collectionName: string, empresaId: string) {
    this.worksService
      .getUserByIdAndCollection(empresaId, collectionName)
      .pipe(
        first(),
        takeUntil(this.destroy$),
        tap((empresa: any) => {
          const validationUSer = empresa as EmpresaUser;
          this.empresaSignal.set(validationUSer);
          this.empresa = empresa;
          this.analyticsService.logCustomEvent('page-visit', {
            page: 'empresa-individual',
            empresaData: validationUSer,
          });
          this.paginateComments();
        }),
        switchMap((empresa: EmpresaUser) => {
          if (empresa.countProfileVisits) {
            empresa.countProfileVisits++;
          } else {
            empresa.countProfileVisits = 1;
          }
          return this.worksService.updateUser(PATH_USERS, empresa, null);
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
    const empresaData = this.empresaSignal();
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
