import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SocialShareService {
  /**
   * Configuración por defecto para compartir
   */
  private readonly shareConfig = {
    facebook: {
      baseUrl: 'https://www.facebook.com/sharer/sharer.php',
      windowFeatures: 'width=600,height=500,scrollbars=yes,resizable=yes',
    },
    whatsapp: {
      baseUrl: 'https://wa.me',
      webUrl: 'https://web.whatsapp.com/send',
    },
  };

  /**
   * Comparte en Facebook con validaciones y mejor manejo
   * @param url - URL a compartir (opcional, usa la actual por defecto)
   * @param quote - Texto adicional para compartir (opcional)
   */
  compartirPorFacebook(url?: string, quote?: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const urlCompartir = encodeURIComponent(url || window.location.href);
        const quoteParam = quote ? `&quote=${encodeURIComponent(quote)}` : '';

        const facebookUrl = `${this.shareConfig.facebook.baseUrl}?u=${urlCompartir}${quoteParam}`;

        const ventana = window.open(
          facebookUrl,
          'fb-share-dialog',
          this.shareConfig.facebook.windowFeatures
        );

        if (!ventana) {
          console.warn(
            'El popup fue bloqueado. Redirigiendo en la misma ventana...'
          );
          window.location.href = facebookUrl;
          resolve(true);
          return;
        }

        ventana.focus();

        // Verificar si la ventana se cerró (usuario completó o canceló)
        const checkClosed = setInterval(() => {
          if (ventana.closed) {
            clearInterval(checkClosed);
            resolve(true);
          }
        }, 1000);

        // Timeout después de 30 segundos
        setTimeout(() => {
          clearInterval(checkClosed);
          if (!ventana.closed) {
            ventana.close();
          }
          resolve(true);
        }, 30000);
      } catch (error) {
        console.error('Error al compartir en Facebook:', error);
        this.handleShareError('Facebook');
        resolve(false);
      }
    });
  }

  /**
   * Comparte por WhatsApp con detección de dispositivo y validaciones
   * @param phoneNumber - Número de teléfono (opcional)
   * @param message - Mensaje a enviar
   * @param url - URL a incluir en el mensaje (opcional, usa la actual por defecto)
   */
  compartirPorWhatsApp(
    phoneNumber?: string,
    message?: string,
    url?: string
  ): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const urlActual = url || window.location.href;
        const mensajeCompleto = this.construirMensajeWhatsApp(
          message,
          urlActual
        );
        const textoEncoded = encodeURIComponent(mensajeCompleto);

        let whatsappUrl: string;

        if (phoneNumber) {
          // Compartir con número específico
          const numeroLimpio = this.limpiarNumeroTelefono(phoneNumber);
          whatsappUrl = `${this.shareConfig.whatsapp.baseUrl}/${numeroLimpio}?text=${textoEncoded}`;
        } else {
          // Compartir sin número específico (abre selector de contactos)
          if (this.esMobile()) {
            whatsappUrl = `${this.shareConfig.whatsapp.baseUrl}?text=${textoEncoded}`;
          } else {
            whatsappUrl = `${this.shareConfig.whatsapp.webUrl}?text=${textoEncoded}`;
          }
        }

        // Abrir WhatsApp
        const ventana = window.open(
          whatsappUrl,
          '_blank',
          'noopener,noreferrer'
        );

        if (!ventana && !this.esMobile()) {
          // Si el popup fue bloqueado en desktop, intentar redirect
          console.warn('Popup bloqueado, intentando redirect...');
          window.location.href = whatsappUrl;
        }

        resolve(true);
      } catch (error) {
        console.error('Error al compartir por WhatsApp:', error);
        this.handleShareError('WhatsApp');
        resolve(false);
      }
    });
  }

  /**
   * Construye el mensaje completo para WhatsApp
   * @param message - Mensaje base
   * @param url - URL a incluir
   * @returns Mensaje formateado
   */
  private construirMensajeWhatsApp(message?: string, url?: string): string {
    const partes: string[] = [];

    if (message && message.trim()) {
      partes.push(message.trim());
    }

    if (url && url.trim()) {
      partes.push(url.trim());
    }

    return partes.join('\n\n');
  }

  /**
   * Limpia el número de teléfono para WhatsApp
   * @param phoneNumber - Número a limpiar
   * @returns Número limpio con código de país
   */
  private limpiarNumeroTelefono(phoneNumber: string): string {
    if (!phoneNumber) return '';

    // Remover todo excepto números
    let numeroLimpio = phoneNumber.replace(/\D/g, '');

    // Si no tiene código de país, agregar Colombia (57) por defecto
    if (numeroLimpio.length === 10 && numeroLimpio.startsWith('3')) {
      numeroLimpio = '57' + numeroLimpio;
    }

    return numeroLimpio;
  }

  /**
   * Detecta si el dispositivo es móvil
   * @returns true si es móvil
   */
  private esMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  /**
   * Maneja errores de compartir
   * @param platform - Plataforma que falló
   */
  private handleShareError(platform: string): void {
    // Aquí puedes integrar con tu sistema de notificaciones
    console.error(`No se pudo compartir en ${platform}`);

    // Ejemplo con toast o alert
    // this.toastService.error(`Error al compartir en ${platform}`);
  }

  /**
   * Verifica si la API de Web Share está disponible
   * @returns true si está disponible
   */
  isWebShareAvailable(): boolean {
    return 'share' in navigator;
  }

  /**
   * Comparte usando la API nativa de Web Share (si está disponible)
   * @param shareData - Datos para compartir
   */
  async compartirNativo(shareData: {
    title?: string;
    text?: string;
    url?: string;
  }): Promise<boolean> {
    try {
      if (this.isWebShareAvailable()) {
        await navigator.share(shareData);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }
}
