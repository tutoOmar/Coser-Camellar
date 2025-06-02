import { Component, HostListener, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Publication } from '../../models/publication.model';
import { WhatsAppService } from '../../../shared/data-access/whats-app.service';
import { CallService } from '../../../shared/data-access/call.service';
import { SocialShareService } from '../../../shared/data-access/social-share.service';

interface Publicacion {
  id: string;
  description: string;
  images: string[]; // máx 5 URLs
  autorId: string;
  timestamp: Date;
  number: string;
  city: string; // obligatorio
  neighborhood: string; // obligatorio
  typeContact: string;
  state: string;
  limiteContactos?: number; // p. ej., 5 semanales
  contacts: number;
}

@Component({
  selector: 'app-publication-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './publication-card.component.html',
  styleUrl: './publication-card.component.scss',
})
export class PublicationCardComponent implements OnInit {
  // Publicaciones que vienen desde el componente padre
  @Input() publicacion!: Publication;

  compartiendo = false; // Para mostrar loading state

  constructor(
    private whatsAppService: WhatsAppService,
    private callService: CallService,
    private socialShareService: SocialShareService
  ) {}

  // Propiedad para controlar la visibilidad del menú
  mostrarMenu = false;
  // Propiedad para verificar si el usuario actual es el autor
  esAutor = false;

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
    } else {
      return `hace ${dias} días`;
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
   * Maneja el click en el botón de llamada
   */
  makeCall(): void {
    if (!this.isPhoneValid()) {
      this.handleInvalidPhone();
      return;
    }

    try {
      this.callService.makePhoneCall(this.publicacion.number);

      // Opcional: Tracking de evento para analytics
      this.trackContactEvent('call');
    } catch (error) {
      console.error('Error al realizar la llamada:', error);
      this.handleContactError('llamada');
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

  // Método para guardar la publicación
  guardar(): void {
    console.log('Guardar publicación', this.publicacion.id);
    // Aquí iría la lógica para guardar la publicación
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

  ngOnInit() {}

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

    console.log(`Evento de contacto registrado: ${eventType}`);
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
    // Aquí puedes agregar tracking de analytics
    //this.trackShareEvent(platform, 'success');
    // Mostrar notificación de éxito (opcional)
    // this.toastService.success(`Compartido en ${platform}`);
  }

  /**
   * Maneja errores al compartir
   * @param platform - Plataforma donde falló
   */
  private onCompartirError(platform: string): void {
    //this.trackShareEvent(platform, 'error');
    // Mostrar notificación de error (opcional)
    // this.toastService.error(`No se pudo compartir en ${platform}`);
  }
}
