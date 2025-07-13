import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnChanges,
  OnInit,
  signal,
  SimpleChanges,
} from '@angular/core';
import { PublicationDemandService } from '../../../../publication/services/publication-demand.services';
import { map, of, Subject, switchMap, takeUntil } from 'rxjs';
import { Publication } from '../../../../publication/models/publication.model';
import { PublicationCardComponent } from '../../../../publication/features/publication-card/publication-card.component';
import { toast } from 'ngx-sonner';
import Swal from 'sweetalert2';
import { ActionPublicationEnum } from '../../../../publication/models/actionPublicationEnum';
import { AnalyticsService } from '../../../../shared/data-access/analytics.service';
import { AuthStateService } from '../../../../shared/data-access/auth-state.service';
import { ReportsService } from '../../../../shared/data-access/reports.service';
import { WorksService } from '../../../services/works.service';
import { Router } from '@angular/router';
import { PublicactionModalRegisterComponent } from '../../../../publication/features/publication-demand/publicaction-modal-register/publicaction-modal-register.component';
import { PublicationModalData } from '../../../../publication/features/publication-demand/publication-demand.component';
import {
  PublicationDB,
  StateEnum,
} from '../../../../publication/models/publication-db.model';
import { TypeUser } from '../../models/type-user.model';

@Component({
  selector: 'app-own-publications',
  standalone: true,
  imports: [
    CommonModule,
    PublicationCardComponent,
    PublicactionModalRegisterComponent,
  ],
  templateUrl: './own-publications.component.html',
  styleUrl: './own-publications.component.scss',
})
export class OwnPublicationsComponent implements OnInit, OnChanges {
  /**====== Inputs  */
  @Input() userId: string | undefined = undefined;
  /**======== Variables ================= */
  private destroy$ = new Subject<void>();
  loading = false;
  hasMore = false;
  publicationsData: Publication[] = [];
  publicationToEdit!: Publication | null;
  actionPublication!: ActionPublicationEnum;
  mostrarModalEditar = false;
  estaEditandoPublicacion = false;

  userData = signal<any>(null);

  /**
   * Publicación vacias
   */
  EMPTY_PUBLICATION: PublicationDB = {
    id: '',
    description: '',
    images: [],
    autorId: '',
    autorType: TypeUser.TRABAJADOR,
    timestamp: '',
    number: '',
    city: '',
    neighborhood: '',
    typeContact: '',
    state: StateEnum.ACTIVE,
    limiteContactos: 0,
    contacts: 0,
  };
  /**======= Ng Functions ================ */
  constructor(
    private publicationService: PublicationDemandService,
    private authStateService: AuthStateService,
    private userService: WorksService,
    private _router: Router,
    private reportService: ReportsService,
    private analyticsService: AnalyticsService
  ) {}
  ngOnInit(): void {}
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userId'] && changes['userId'].currentValue) {
      this.loadPublications();
    }
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  /***========== Functions ============== */
  private loadPublications() {
    if (this.userId) {
      this.userService
        .getUserByUserIdAndCollection(this.userId, 'users')
        .pipe(
          takeUntil(this.destroy$),
          map((userInfo) => {
            this.userData.set(userInfo[0]);
            return userInfo[0];
          }),
          switchMap(() => {
            if (this.userId) {
              return this.publicationService.getUsersPublicationsByUserId(
                this.userId
              );
            } else {
              return of();
            }
          })
        )
        .subscribe({
          next: (publications: Publication[]) => {
            this.publicationsData = publications;
          },
          error: (erro) => {},
        });
    }
  }
  /**
   * Método para eliminar una publicación en cuestión
   * OJO para esto debe ser el mismo autor, de resto no puede borrar publicaciones
   * de otros.
   * @param id
   */
  eliminatePublication(id: string) {
    this.publicationService
      .eliminatePublication(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (eliminado) => {
          if (eliminado) {
            // Mostrar mensaje de éxito
            toast.success('Publicación eliminada con éxito');
            this.refreshPublications();
            this.analyticsService.logCustomEvent('elimnate-a-publication', {});
          }
        },
        error: (error) => {
          toast.error('Hubo un error al eliminar la publicación');
        },
        complete: () => {},
      });
  }
  /**
   * Método para abrir el modal que permite editar unas publicación
   * @param publication
   */
  editPublication(publication: Publication) {
    this.analyticsService.logCustomEvent('open-modal-edit-publication', {
      pubication: this.userId,
    });
    this.actionPublication = ActionPublicationEnum.EDIT;
    this.publicationToEdit = publication;
    this.mostrarModalEditar = true;
  }
  /**
   * cierra el modal de editar o crear publicación sin genera acción
   */
  cerrarModalCrearPublicacion(): void {
    this.analyticsService.logCustomEvent('close-modal-ṕublication', {
      pubication: this.userData().id,
    });
    this.publicationToEdit = null;
    this.mostrarModalEditar = false;
  }
  /**
   * Función para crear la publicación
   * @param event
   * @returns
   */
  editarPublicacion(event: any): void {
    if (!this.validarFormulario(event)) {
      return;
    }

    // Opción para editar la pulicacoón
    if (this.actionPublication === 'edit') {
      this.estaEditandoPublicacion = true;
      // convierte a formato publicacion
      const publication = this.convertToEditForms(event);
      const imagesEliminatedFromServer = event.imagesEliminatedFromServer;
      const newImages = event.imagenes.map(
        (fileAndPreview: any) => fileAndPreview.file as File
      );
      this.publicationService
        .updatePublicationEdit(
          publication,
          newImages,
          imagesEliminatedFromServer
        )
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (result) => {
            toast.success('Publicación actualizada con éxito');
            this.estaEditandoPublicacion = false;
            this.cerrarModalCrearPublicacion();
            this.refreshPublications();
            this.analyticsService.logCustomEvent('edit-a-publication', {
              pubication: publication,
            });
          },
          error: (error) => {
            console.error('Error:', error);
          },
        });
      // Elminar imagenes del servidor,
      // Añade publicaciones con nuevas imagenes --TODO crear nuevo método
      //
    }
  }
  /**
   * Función que valida los datos que vienen del formulario
   * @param data
   * @returns
   */
  private validarFormulario(data: any): boolean {
    if (!data) {
      return false;
    } else {
      const formulario = data.formulario;
      const images = data.imagenes;
      if (
        !formulario.description &&
        formulario.city &&
        formulario.neighborhood &&
        formulario.typeContact &&
        formulario.numberContact &&
        images.length <= 5
      ) {
        return false;
      }
    }
    return true;
  }
  /**
   * Metodo usado para crear el formulario inicial para crear una publicación.
   * ToDo: Me enredé haciendo esta función
   */
  convertToEditForms(data: PublicationModalData): PublicationDB {
    // Valida la existencia de los datos
    if (!this.publicationToEdit || !data.imagesInTheServer) {
      return this.EMPTY_PUBLICATION;
    } else {
      const currentPublication = data.formulario;
      const previewPublication = this.publicationToEdit;
      const currentImages = data.imagesInTheServer;
      return {
        id: previewPublication.id,
        description: currentPublication.description,
        images: currentImages,
        autorId: previewPublication.autorId,
        autorType: previewPublication.autorType,
        timestamp: previewPublication.timestamp,
        number: currentPublication.numberContact,
        city: currentPublication.city,
        neighborhood: currentPublication.neighborhood,
        typeContact: currentPublication.typeContact,
        state: previewPublication.state,
        limiteContactos: previewPublication.limiteContactos,
        contacts: previewPublication.contacts,
      };
    }
  }
  /*** ============================================================================
   *
   *
   *                Propiedades para el modal de reporte
   *
   *
   * ===========================================================================*/
  mostrarModalReporte = false;
  publicacionAReportar: any = null;
  enviandoReporte = false;

  // Método público para refrescar las publicaciones
  refreshPublications(): void {
    this.loadPublications();
  }
}
