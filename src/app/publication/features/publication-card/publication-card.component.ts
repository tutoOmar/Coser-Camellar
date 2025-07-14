import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Publication } from '../../models/publication.model';
import { WhatsAppService } from '../../../shared/data-access/whats-app.service';
import { CallService } from '../../../shared/data-access/call.service';
import { SocialShareService } from '../../../shared/data-access/social-share.service';
import WaButtonComponent from '../../../shared/ui/wa-button/wa-button.component';
import { AuthService } from '../../../auth/data-access/auth.service';
import { AuthStateService } from '../../../shared/data-access/auth-state.service';
import { CallButtonComponent } from '../../../shared/ui/call-button/call-button.component';
import { AnalyticsService } from '../../../shared/data-access/analytics.service';
import { TypeUser } from '../../../works/features/models/type-user.model';
@Component({
  selector: 'app-publication-card',
  standalone: true,
  imports: [CommonModule, RouterModule, WaButtonComponent, CallButtonComponent],
  templateUrl: './publication-card.component.html',
  styleUrl: './publication-card.component.scss',
})
export class PublicationCardComponent implements OnInit {
  // Publicaciones que vienen desde el componente padre
  @Input() publicacion!: Publication;
  // Acción que suceden dentro del componente
  @Output() eliminate = new EventEmitter<string>();
  @Output() edit = new EventEmitter<Publication>();
  @Output() report = new EventEmitter<Publication>();

  compartiendo = false; // Para mostrar loading state
  // Propiedad para controlar la visibilidad del menú
  mostrarMenu = false;
  // Propiedad para verificar si el usuario actual es el autor
  esAutor = false;
  isLogged = false;
  /***===============  Ng functions ==============*/
  constructor(
    private whatsAppService: WhatsAppService,
    private callService: CallService,
    private socialShareService: SocialShareService,
    private userAuthService: AuthStateService,
    private analyticsService: AnalyticsService,
    private router: Router
  ) {}

  ngOnInit() {
    const user = this.userAuthService.currentUser;
    if (user?.uid === this.publicacion.autorId) {
      this.esAutor = true;
    }
    if (user && user.uid) {
      this.isLogged = true;
    }
  }

  /****************      Funcitions ================= */
  // Método para calcular tiempo transcurrido desde la publicación
  getTiempoTranscurrido(): string {
    if (!this.publicacion.timestamp) return 'Hace un momento';

    const ahora = new Date();
    const publicacion = new Date(this.publicacion.timestamp);
    const diferencia = ahora.getTime() - publicacion.getTime();

    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

    if (minutos < 60) {
      return `hace ${minutos} minutos`;
    } else if (horas < 24) {
      return `hace ${horas} horas`;
    } else if (dias < 30) {
      return `hace ${dias} días`;
    } else {
      return `Hace ${this.convertDaysToYearsMonths(dias)}`;
    }
  }
  /**
   * Convierte días en una representación de años, meses y días
   * @param days - Número de días a convertir
   * @param format - Formato de salida: 'object' | 'string' | 'short'
   * @returns Conversión en el formato especificado
   */
  convertDaysToYearsMonths(days: number): string {
    if (days < 0) {
      throw new Error('El número de días no puede ser negativo');
    }
    // Constantes para cálculo aproximado
    const DAYS_PER_YEAR = 365.25; // Incluye años bisiestos
    const DAYS_PER_MONTH = 30.44; // Promedio de días por mes (365.25/12)
    // Cálculos
    const years = Math.floor(days / DAYS_PER_YEAR);
    const remainingDaysAfterYears = days - years * DAYS_PER_YEAR;
    const months = Math.floor(remainingDaysAfterYears / DAYS_PER_MONTH);
    const remainingDays = Math.floor(
      remainingDaysAfterYears - months * DAYS_PER_MONTH
    );
    const stringParts = [];
    if (years > 0) {
      stringParts.push(`${years} ${years === 1 ? 'año' : 'años'}`);
    }
    if (months > 0) {
      stringParts.push(`${months} ${months === 1 ? 'mes' : 'meses'}`);
    }
    if (remainingDays > 0) {
      stringParts.push(
        `${remainingDays} ${remainingDays === 1 ? 'día' : 'días'}`
      );
    }
    if (stringParts.length === 0) {
      return '0 días';
    } else if (stringParts.length === 1) {
      return stringParts[0];
    } else if (stringParts.length === 2) {
      return stringParts.join(' y ');
    } else {
      return (
        stringParts.slice(0, -1).join(', ') +
        ' y ' +
        stringParts[stringParts.length - 1]
      );
    }
  }
  /**
   * Maneja el click en el botón de WhatsApp
   */
  contactWhatsApp(): void {
    if (!this.isPhoneValid()) {
      this.handleInvalidPhone();
      return;
    }

    // Mensaje predeterminado personalizable
    const defaultMessage = `Hola, me interesa "${this.publicacion.description}". ¿Podrías darme más información?`;

    try {
      this.whatsAppService.openWhatsAppAction(
        this.publicacion.number,
        defaultMessage
      );

      // Opcional: Tracking de evento para analytics
      this.trackContactEvent('whatsapp');
    } catch (error) {
      console.error('Error al abrir WhatsApp:', error);
      this.handleContactError('WhatsApp');
    }
  }
  /**
   * Valida si el número de teléfono es válido
   * @returns true si el número es válido
   */
  private isPhoneValid(): boolean {
    return this.callService.isValidPhoneNumber(this.publicacion.number);
  }

  /**
   * Maneja el caso cuando el número de teléfono no es válido
   */
  private handleInvalidPhone(): void {
    console.warn('Número de teléfono no válido:', this.publicacion.number);

    // Podrías mostrar un toast, modal o mensaje de error aquí
    // Ejemplo con alert (reemplaza por tu sistema de notificaciones)
    alert('El número de teléfono no está disponible en este momento.');
  }

  /**
   * Maneja errores de contacto
   * @param contactType - Tipo de contacto que falló
   */
  private handleContactError(contactType: string): void {
    // Podrías mostrar un toast, modal o mensaje de error aquí
    // Ejemplo con alert (reemplaza por tu sistema de notificaciones)
    alert(`No se pudo abrir ${contactType}. Por favor, inténtalo de nuevo.`);
  }
  /**
   * Funciones para el slider carrusel
   */
  currentSlideIndex = 0;
  imagenAmpliada: string | null = null;

  // Métodos del carrusel
  previousSlide(): void {
    if (this.currentSlideIndex > 0) {
      this.currentSlideIndex--;
    }
  }

  nextSlide(): void {
    const maxIndex = Math.min(this.publicacion.images.length, 5) - 1;
    if (this.currentSlideIndex < maxIndex) {
      this.currentSlideIndex++;
    }
  }

  // Métodos para el visor de imágenes
  verImagenAmpliada(imagen: string): void {
    this.imagenAmpliada = imagen;
  }

  cerrarImagenAmpliada(): void {
    this.imagenAmpliada = null;
  }

  /***
   *
   */
  // Método para abrir el menú de opciones
  toggleMenu(): void {
    this.mostrarMenu = !this.mostrarMenu;
  }

  /**
   * Métodos para compartir en redes sociales
   */
  mostrarOpcionesSociales = false;

  compartir() {
    if (navigator.share) {
      // Usar Web Share API nativa
      navigator.share({
        title: 'Título del post',
        text: 'Descripción del post',
        url: window.location.href,
      });
    } else {
      // Mostrar opciones sociales
      this.mostrarOpcionesSociales = !this.mostrarOpcionesSociales;
      this.mostrarMenu = !this.mostrarMenu;
    }
  }
  /**
   * Opcional: Tracking de eventos para analytics
   * @param eventType - Tipo de evento (whatsapp, call)
   */
  private trackContactEvent(eventType: 'whatsapp' | 'call'): void {
    // Aquí puedes integrar con Google Analytics, Mixpanel, etc.
    // Ejemplo:
    // gtag('event', 'contact_action', {
    //   contact_method: eventType,
    //   phone_number: this.publicacion.phone
    // });
  }
  /**
   * Comparte en Facebook con mejor manejo y loading state
   */
  async compartirPorFacebook(): Promise<void> {
    if (this.compartiendo) return;

    this.compartiendo = true;

    try {
      // Preparar datos para compartir
      const url = window.location.href;
      const quote = `${this.publicacion.description}`;

      const success = await this.socialShareService.compartirPorFacebook(
        url,
        quote
      );

      if (success) {
        this.onCompartirExitoso('Facebook');
      } else {
        this.onCompartirError('Facebook');
      }
    } catch (error) {
      this.onCompartirError('Facebook');
    } finally {
      this.compartiendo = false;
      this.mostrarOpcionesSociales = false;
    }
  }

  /**
   * Comparte por WhatsApp con mejor manejo
   * @param tipoCompartir - 'contacto' para enviar al número de la publicación, 'general' para compartir libremente
   */
  async compartirPorWhatsApp(
    tipoCompartir: 'contacto' | 'general' = 'general'
  ): Promise<void> {
    if (this.compartiendo) return;

    this.compartiendo = true;

    try {
      const mensaje = this.construirMensajeCompartir();
      const url = window.location.href;

      let phoneNumber: string | undefined;

      if (tipoCompartir === 'contacto' && this.publicacion.number) {
        phoneNumber = this.publicacion.number;
      }

      const success = await this.socialShareService.compartirPorWhatsApp(
        phoneNumber,
        mensaje,
        url
      );

      if (success) {
        this.onCompartirExitoso('WhatsApp');
      } else {
        this.onCompartirError('WhatsApp');
      }
    } catch (error) {
      this.onCompartirError('WhatsApp');
    } finally {
      this.compartiendo = false;
      this.mostrarOpcionesSociales = false;
    }
  }

  /**
   * Intenta compartir usando la API nativa primero, luego fallback a métodos específicos
   */
  async compartirInteligente(): Promise<void> {
    const shareData = {
      text: this.publicacion.description,
      url: window.location.href,
    };

    // Intentar con API nativa primero
    const nativeShareSuccess = await this.socialShareService.compartirNativo(
      shareData
    );

    if (!nativeShareSuccess) {
      // Si no funciona, mostrar opciones sociales
      this.mostrarOpcionesSociales = true;
    }
  }

  /**
   * Construye el mensaje para compartir
   * @returns Mensaje formateado
   */
  private construirMensajeCompartir(): string {
    const partes = [];

    if (this.publicacion.description) {
      partes.push(this.publicacion.description);
    }

    partes.push('👆 Más información en el enlace');

    return partes.join('\n\n');
  }

  /**
   * Maneja el éxito al compartir
   * @param platform - Plataforma donde se compartió
   */
  private onCompartirExitoso(platform: string): void {
    this.analyticsService.logCustomEvent('shared-in-' + platform, {
      pubication: this.publicacion.id,
    });
  }

  /**
   * Maneja errores al compartir
   * @param platform - Plataforma donde falló
   */
  private onCompartirError(platform: string): void {
    this.analyticsService.logCustomEvent('error-share-in-' + platform, {
      pubication: this.publicacion.id,
    });
  }
  /**
   * Mensaje personalizado
   */
  messagePersonalized(descriptionMessage: string): string {
    return (
      'Hola, vi tu publicación en Coser & Camellar sobre *' +
      descriptionMessage +
      '* quiero obtener más información'
    );
  }
  /**
   * Método que emita la acción de eliminar publicación
   */
  onEliminate() {
    this.eliminate.emit(this.publicacion.id);
    this.mostrarMenu = !this.mostrarMenu;
  }
  /**
   * Método que emite la acción de editar la publicación
   */
  onEdit() {
    this.mostrarMenu = !this.mostrarMenu;
    this.edit.emit(this.publicacion);
  }
  /**
   * Emite para generar un reporte
   */
  onReport() {
    this.mostrarMenu = !this.mostrarMenu;
    this.report.emit(this.publicacion);
  }
  /**
   * ToDo no puedo hacer esto porque no tengo el id original el usuario, esto sirve si se tiene un id y no un userId, evaluar como hacerlo
   */
  goToProfile() {
    if (this.isLogged) {
      switch (this.publicacion.autorType) {
        case TypeUser.TRABAJADOR:
          //this.router.navigate(['/aplication/marketplace']);

          break;
        case TypeUser.SATELITE:
          break;
        case TypeUser.TALLER:
          break;
        case TypeUser.EMPRESA:
          break;
        case TypeUser.PERSONA_NATURAL:
          break;
        default:
          break;
      }
    }
  }
}
