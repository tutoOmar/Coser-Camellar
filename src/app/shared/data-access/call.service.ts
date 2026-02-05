import { Injectable, OnDestroy } from '@angular/core';
import { AuthStateService } from './auth-state.service';
import { Observable, Subject, switchMap, take, takeUntil } from 'rxjs';
import { toast } from 'ngx-sonner';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class CallService implements OnDestroy {
  private callAction$ = new Subject<{
    phoneNumber: string;
  }>();
  private destroy$ = new Subject<void>();

  constructor(
    private authStateService: AuthStateService,
    private router: Router
  ) {
    this.callAction$
      .pipe(
        takeUntil(this.destroy$),
        switchMap(({ phoneNumber }) =>
          this.authStateService.authState$.pipe(
            take(1),
            switchMap((authState: Observable<any>) => {
              if (authState) {
                this.makePhoneCall(phoneNumber);
              } else {
                Swal.fire({
                  title: '¿Quieres llamar a este trabajador(a)?',
                  text: 'Regístrate ahora para poder contactar directamente con los trabajadores y coordinar tus proyectos de confección. ¡Es rápido y fácil! 📞',
                  icon: 'warning',
                  showConfirmButton: true,
                  confirmButtonText: 'Registrarme ahora',
                  cancelButtonText: 'Cancelar',
                  showCancelButton: true,
                }).then((result) => {
                  if (result.isConfirmed) {
                    this.router.navigate(['/auth/sign-up']);
                  }
                });
              }
              return [];
            })
          )
        )
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Método que reciben los componentes para ejecutar la acción de llamada
   * @param phoneNumber - Número de teléfono del trabajador
   */
  initiateCallAction(phoneNumber: string | undefined): void {
    if (phoneNumber && this.isValidPhoneNumber(phoneNumber)) {
      this.callAction$.next({ phoneNumber });
    } else {
      toast.error('Número de teléfono inválido');
    }
  }

  /**
   * Realiza la llamada telefónica
   * @param phoneNumber - Número de teléfono
   */
  private makePhoneCall(phoneNumber: string): void {
    const formattedNumber = this.formatPhoneNumber(phoneNumber);
    const displayNumber = this.getFormattedDisplayNumber(phoneNumber);

    if (!formattedNumber) {
      toast.error('Número de teléfono erróneo');
      return;
    }

    // Si no es dispositivo móvil, mostrar opciones
    if (!this.isMobileDevice()) {
      Swal.fire({
        title: 'Contactar por teléfono',
        html: `
          <p>Para llamar desde tu computadora:</p>
          <div style="background: #f5f5f5; padding: 10px; border-radius: 5px; margin: 10px 0;">
            <strong style="font-size: 18px;">${displayNumber}</strong>
          </div>
          <p><small>Haz clic en "Copiar número" para copiarlo al portapapeles</small></p>
        `,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Copiar número',
        cancelButtonText: 'Cerrar',
        footer:
          '<small>💡 Esta función funciona mejor en dispositivos móviles</small>',
      }).then((result) => {
        if (result.isConfirmed) {
          this.copyToClipboard(displayNumber);
        }
      });
      return;
    }

    // Si es móvil, proceder con la llamada
    const telUrl = `tel:${formattedNumber}`;

    try {
      window.open(telUrl, '_self');
      toast.success('Iniciando llamada...');
    } catch (error) {
      console.error('Error al iniciar la llamada:', error);
      toast.error(
        'No se pudo iniciar la llamada. Verifica que tu dispositivo soporte llamadas.'
      );
    }
  }

  /**
   * Copia texto al portapapeles
   * @param text - Texto a copiar
   */
  private async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Número copiado al portapapeles');
    } catch (error) {
      // Fallback para navegadores más antiguos
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        toast.success('Número copiado al portapapeles');
      } catch (fallbackError) {
        toast.error('No se pudo copiar el número');
      }
      document.body.removeChild(textArea);
    }
  }

  /**
   * Formatea el número de teléfono para Colombia
   * @param phoneNumber - Número a formatear
   * @returns Número formateado o null si es inválido
   */
  private formatPhoneNumber(phoneNumber: string): string | null {
    // Elimina todos los caracteres no numéricos
    let formattedNumber = phoneNumber.trim().replace(/\D/g, '');

    // Agrega el prefijo "+57" de Colombia si no está presente
    if (!formattedNumber.startsWith('57')) {
      formattedNumber = `+57${formattedNumber}`;
    } else {
      formattedNumber = `+${formattedNumber}`;
    }

    // Verifica que el número esté bien formateado (mínimo 12 caracteres con +57)
    if (formattedNumber.length >= 12 && formattedNumber.length <= 16) {
      return formattedNumber;
    }

    return null;
  }

  /**
   * Valida si un número de teléfono tiene un formato básico válido
   * @param phoneNumber - Número a validar
   * @returns true si el formato es válido
   */
  isValidPhoneNumber(phoneNumber: string): boolean {
    if (!phoneNumber) return false;

    // Elimina caracteres no numéricos para validar
    const numbersOnly = phoneNumber.replace(/\D/g, '');

    // Validación para números colombianos (con o sin prefijo 57)
    // Números móviles: 10 dígitos (3XX XXXXXXX)
    // Con prefijo: 12 dígitos (57 3XX XXXXXXX)
    const isValidLength =
      numbersOnly.length === 10 ||
      (numbersOnly.length === 12 && numbersOnly.startsWith('57'));

    // Validación adicional para números móviles colombianos (empiezan con 3)
    const startsWithThree =
      numbersOnly.startsWith('3') ||
      (numbersOnly.startsWith('573') && numbersOnly.length === 12);

    return isValidLength && startsWithThree;
  }

  /**
   * Método utilitario para obtener el número formateado sin hacer la llamada
   * Útil para mostrar el número en la UI
   * @param phoneNumber - Número a formatear
   * @returns Número formateado para mostrar
   */
  getFormattedDisplayNumber(phoneNumber: string): string {
    if (!phoneNumber) return '';

    const numbersOnly = phoneNumber.replace(/\D/g, '');

    // Si tiene 10 dígitos, es un número local
    if (numbersOnly.length === 10) {
      return `+57 ${numbersOnly.substring(0, 3)} ${numbersOnly.substring(
        3,
        6
      )} ${numbersOnly.substring(6)}`;
    }

    // Si tiene 12 dígitos y empieza con 57
    if (numbersOnly.length === 12 && numbersOnly.startsWith('57')) {
      const localNumber = numbersOnly.substring(2);
      return `+57 ${localNumber.substring(0, 3)} ${localNumber.substring(
        3,
        6
      )} ${localNumber.substring(6)}`;
    }

    return phoneNumber; // Retorna el original si no se puede formatear
  }

  /**
   * Detecta si el dispositivo es móvil
   * @returns true si es un dispositivo móvil
   */
  private isMobileDevice(): boolean {
    const userAgent =
      navigator.userAgent || navigator.vendor || (window as any).opera;

    // Detección de dispositivos móviles
    return (
      /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent
      ) ||
      // Detección adicional por características del dispositivo
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0
    );
  }
}
