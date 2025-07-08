import { Component, HostListener, signal, Signal } from '@angular/core';
import { PublicationCardComponent } from '../publication-card/publication-card.component';
import { CommonModule } from '@angular/common';
import { Publication } from '../../models/publication.model';
import { Subject, takeUntil, finalize, tap, switchMap, map } from 'rxjs';
import { PublicationDemandService } from '../../services/publication-demand.services';
import { TypeUser } from '../../../works/features/models/type-user.model';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PublicactionModalRegisterComponent } from './publicaction-modal-register/publicaction-modal-register.component';
import { AuthStateService } from '../../../shared/data-access/auth-state.service';
import { WorksService } from '../../../works/services/works.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import {
  OfferOrSearchJobEnum,
  PublicationDB,
  StateEnum,
} from '../../models/publication-db.model';
import { toast } from 'ngx-sonner';
import { ActionPublicationEnum } from '../../models/actionPublicationEnum';
import { PublicationReportModalComponent } from '../publication-report-modal/publication-report-modal.component';
import { TallerUSer } from '../../../works/features/models/talleres.model';
import { WorkerUser } from '../../../works/features/models/worker.model';
import { SateliteUser } from '../../../works/features/models/satelite.model';
import { ReportsService } from '../../../shared/data-access/reports.service';
import { AnalyticsService } from '../../../shared/data-access/analytics.service';

export interface PublicationModalData {
  formulario: {
    description: string;
    city: string;
    neighborhood: string;
    typeContact: string;
    numberContact: string;
    offerOrSearchJob: string;
  };
  imagenes: [];
  imagesInTheServer?: string[];
  imagesEliminatedFromServer?: string[];
}
@Component({
  selector: 'app-publication-demand',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PublicationCardComponent,
    PublicactionModalRegisterComponent,
    PublicationReportModalComponent,
  ],
  templateUrl: './publication-demand.component.html',
})
export default class PublicationDemandComponent {
  publications: Publication[] = [];
  userData = signal<any>(null);
  loading = false;
  initialLoading = true;
  hasMore = true;
  private destroy$ = new Subject<void>();

  constructor(
    private publicationService: PublicationDemandService,
    private authStateService: AuthStateService,
    private userService: WorksService,
    private _router: Router,
    private reportService: ReportsService,
    private analyticsService: AnalyticsService
  ) {}

  ngOnInit(): void {
    this.loadInitialPublications();
    this.loadUserData();
    this.analyticsService.logCustomEvent('page-visit', {
      page: 'publication-demand',
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Detectar scroll para cargar más contenido
  @HostListener('window:scroll', ['$event'])
  onScroll(): void {
    // Verificar si estamos cerca del final de la página
    const threshold = window.innerHeight * 0.8;
    const position = window.pageYOffset + window.innerHeight;
    const height = document.documentElement.scrollHeight;

    if (position > height - threshold && !this.loading && this.hasMore) {
      this.loadMorePublications();
    }
  }

  private loadInitialPublications(): void {
    this.initialLoading = true;
    this.loading = true;
    this.publications = [];

    this.publicationService
      .getInitialPublications()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
          this.initialLoading = false;
        })
      )
      .subscribe({
        next: (publications) => {
          this.publications = publications;
          this.hasMore = publications.length === 10; // Si trajo menos de 10, no hay más
        },
        error: (error) => {
          console.error('Error al cargar publicaciones:', error);
          this.hasMore = false;
        },
      });
  }

  private loadMorePublications(): void {
    if (!this.publicationService.hasMorePublications()) {
      this.hasMore = false;
      return;
    }

    this.loading = true;

    this.publicationService
      .getMorePublications()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: (newPublications) => {
          if (newPublications.length > 0) {
            this.publications = [...this.publications, ...newPublications];
            this.hasMore = newPublications.length === 10; // Si trajo menos de 10, no hay más
          } else {
            this.hasMore = false;
          }
        },
        error: (error) => {
          console.error('Error al cargar más publicaciones:', error);
          this.hasMore = false;
        },
      });
  }

  // Método público para refrescar las publicaciones
  refreshPublications(): void {
    this.publicationService.resetPagination();
    this.hasMore = true;
    this.loadInitialPublications();
  }
  /**
   * Carga y asigna los datos del usuario autenticado a una signal reactiva (`userData`).
   *
   * 1. Escucha el estado de autenticación a través de `authStateService.authState$`.
   * 2. Obtiene el `uid` del usuario autenticado.
   * 3. Usa el `uid` para buscar al usuario en cualquier colección disponible (trabajador, satélite o taller).
   * 4. Extrae el primer resultado de la base de datos y lo asigna como valor a la signal `userData`.
   * 5. Si no se encuentra el usuario en la base de datos, se asigna `null` por defecto.
   *
   * La función utiliza programación reactiva con `toSignal`, permitiendo que `userData` se actualice automáticamente
   * si el observable fuente cambia (ideal para integrarse con signals y `computed` en Angular moderno).
   *
   */
  loadUserData() {
    this.authStateService.authState$
      .pipe(
        switchMap((userDataAuth) =>
          /**busca en la collection de users */
          this.userService.getUserByUserIdAndCollection(
            userDataAuth.uid,
            'users'
          )
        ),
        map((userDataInDB) => userDataInDB[0] || null)
      )
      .subscribe((userDataInDB) => this.userData.set(userDataInDB));
  }
  //============================================================================
  /**
   *          Variables para el modal de crear y editar publicación
   *
   *
   * ============================================================================ */
  mostrarModalCrear = false;
  mostrarModalEditar = false;
  estaCreandoPublicacion = false;
  estaEditandoPublicacion = false;
  // Manejo de imágenes
  imagenesSeleccionadas: Array<{ file: File; preview: string }> = [];
  publicationToEdit!: Publication | null;
  actionPublication!: ActionPublicationEnum;
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
  // Métodos del modal
  abrirModalCrearPublicacion(): void {
    if (!this.userData()) {
      Swal.fire({
        title: '¡No tienes cuenta!',
        text: 'Para poder publicar debes tener cuenta y crear tu perfil',
        icon: 'info',
        showCancelButton: true, // Muestra el botón de cancelar
        confirmButtonText: 'Crear perfil', // Texto del botón de confirmación
        cancelButtonText: 'Luego lo completo', // Texto del botón de cancelar
      }).then((result) => {
        if (result.isConfirmed) {
          this._router.navigate(['/auth/register']);
        } else if (result.isDismissed) {
          Swal.close();
        }
      });
      return;
    }
    this.analyticsService.logCustomEvent('open-modal-create-publication', {
      pubication: this.userData().id,
    });
    this.actionPublication = ActionPublicationEnum.CREATE;
    this.mostrarModalCrear = true;
  }
  /**
   * cierra el modal de editar o crear publicación sin genera acción
   */
  cerrarModalCrearPublicacion(): void {
    this.analyticsService.logCustomEvent('close-modal-ṕublication', {
      pubication: this.userData().id,
    });
    this.publicationToEdit = null;
    this.mostrarModalCrear = false;
    this.mostrarModalEditar = false;
  }
  // Métodos para manejo de imágenes
  onImagenesSeleccionadas(event: any): void {
    const files = Array.from(event.target.files) as File[];

    if (this.imagenesSeleccionadas.length + files.length > 5) {
      alert('Máximo 5 imágenes permitidas');
      return;
    }

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB
        alert(`La imagen ${file.name} excede el tamaño máximo de 5MB`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagenesSeleccionadas.push({
          file: file,
          preview: e.target.result,
        });
      };
      reader.readAsDataURL(file);
    });

    // Limpiar input
    event.target.value = '';
  }

  eliminarImagen(index: number): void {
    this.imagenesSeleccionadas.splice(index, 1);
  }
  /**
   * Función para crear la publicación
   * @param event
   * @returns
   */
  crearOEditarPublicacion(event: any): void {
    if (!this.validarFormulario(event)) {
      return;
    }
    /**
     *
     */
    if (this.actionPublication === 'create') {
      this.estaCreandoPublicacion = true;
      const publication = this.convertToCreateForms(event);
      /**
       * ESto es importante porque al servicio debe llegar un archivo tipo File,
       * esta event.images tiene un array con un tipo que tiene un
       * {
       *  file: File
       *  previewImage: string
       * }
       *
       * Y solo se debe procesar file
       */
      const images = event.imagenes.map(
        (fileAndPreview: any) => fileAndPreview.file as File
      );
      this.publicationService
        .addPublication(publication, images)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (publications) => {
            toast.success('Publicación creada con éxito');
            this.estaCreandoPublicacion = false;
            this.cerrarModalCrearPublicacion();
            this.refreshPublications();
            this.analyticsService.logCustomEvent('create-a-new-publication', {
              pubication: publication,
            });
          },
          error: (error) => {
            toast.error('Erro al crear tu publicación');
          },
        });
    }
    // Opción para editar la pulicacoón
    else if (this.actionPublication === 'edit') {
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
   * Metodo usado para crear el formulario inicial para crear una publicación.
   * ToDo: Me enredé haciendo esta función
   */
  convertToCreateForms(data: PublicationModalData): Omit<PublicationDB, 'id'> {
    // Retorna el json listo para enviar a publicaiones en firebase
    const userType = this.userData().typeUSer;
    const userId = this.userData().userId;
    return {
      description: data.formulario.description,
      images: [],
      autorId: userId,
      autorType: userType,
      timestamp: new Date().toISOString(),
      number: data.formulario.numberContact,
      city: data.formulario.city,
      neighborhood: data.formulario.neighborhood,
      typeContact: data.formulario.typeContact,
      state: StateEnum.ACTIVE,
      limiteContactos: 5,
      contacts: 0,
      offerOrSearchJob: data.formulario
        .offerOrSearchJob as OfferOrSearchJobEnum,
    };
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
    if (!this.userData()) {
      Swal.fire({
        title: '¡No tienes cuenta!',
        text: 'Para poder publicar debes tener cuenta y crear tu perfil',
        icon: 'info',
        showCancelButton: true, // Muestra el botón de cancelar
        confirmButtonText: 'Crear perfil', // Texto del botón de confirmación
        cancelButtonText: 'Luego lo completo', // Texto del botón de cancelar
      }).then((result) => {
        if (result.isConfirmed) {
          this._router.navigate(['/auth/register']);
        } else if (result.isDismissed) {
          Swal.close();
        }
      });
      return;
    }
    this.analyticsService.logCustomEvent('open-modal-edit-publication', {
      pubication: this.userData().id,
    });
    this.actionPublication = ActionPublicationEnum.EDIT;
    this.publicationToEdit = publication;
    this.mostrarModalEditar = true;
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

  // Método que se ejecuta cuando se hace clic en reportar desde publication-card
  reportPublication(publicacion: any): void {
    this.publicacionAReportar = publicacion;
    this.mostrarModalReporte = true;
    this.analyticsService.logCustomEvent('open-modal-report-publication', {
      pubication: this.userData().id,
    });
  }

  // Método para cerrar el modal de reporte
  cerrarModalReporte(): void {
    this.mostrarModalReporte = false;
    this.publicacionAReportar = null;
    this.enviandoReporte = false;
  }

  // Método para procesar el reporte enviado desde el modal
  procesarReporte(reporteData: any): void {
    this.enviandoReporte = true;
    const details = reporteData.detalles as string;
    const publication = reporteData.publicacion as Publication;
    const reason = reporteData.razon as string;
    const userReporter = reporteData.usuarioReportador as
      | WorkerUser
      | TallerUSer
      | SateliteUser;

    if (!details && !publication && !reason && !userReporter) {
      return;
    }
    // Crear el objeto del reporte con toda la información
    const reporte = {
      publicacionAutor: {
        id: publication.autorId,
        publicationId: publication.id,
        name: publication.autor.name,
        number: publication.number,
      },
      reportadoPor: {
        id: userReporter.id,
        name: userReporter.name,
        number: userReporter.phone,
      },
      razon: reason,
      detalles: details,
      fechaReporte: new Date(),
      estado: 'pendiente',
    };
    this.reportService
      .crearReporte(reporte)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.onReporteExitoso();
          this.analyticsService.logCustomEvent('create-a-report-publication', {
            pubication: publication.id,
          });
        },
        error: (error) => {
          this.onReporteError(error);
          this.analyticsService.logCustomEvent(
            'error-to-create-a-report-publication',
            {
              pubication: publication.id,
            }
          );
        },
      });
  }

  // Método para manejar el éxito del reporte
  private onReporteExitoso(): void {
    this.enviandoReporte = false;
    this.cerrarModalReporte();
    toast.success(
      'Reporte creando con éxito, estaremos revisando tu reporte ¡Gracias!'
    );
  }

  // Método para manejar errores del reporte
  private onReporteError(error: any): void {
    this.enviandoReporte = false;
    toast.error('Error al enviar el reporte');
  }
}
