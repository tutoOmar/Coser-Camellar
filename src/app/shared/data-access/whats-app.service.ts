import { Injectable } from '@angular/core';
import { AuthStateService } from './auth-state.service';
import { Observable, Subject, switchMap, take } from 'rxjs';
import { toast } from 'ngx-sonner';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
@Injectable({
  providedIn: 'root',
})
export class WhatsAppService {
  private whatsAppAction$ = new Subject<{
    phoneNumber: string;
    message: string;
  }>();

  constructor(
    private authStateService: AuthStateService,
    private router: Router
  ) {
    this.whatsAppAction$
      .pipe(
        switchMap(({ phoneNumber, message }) =>
          this.authStateService.authState$.pipe(
            take(1),
            switchMap((authState: Observable<any>) => {
              if (authState) {
                this.openWhatsApp(phoneNumber, message);
              } else {
                Swal.fire({
                  title: '¿Quieres contactar a este trabajador(a)?',
                  text: 'Regístrate ahora para enviarle mensajes por WhatsApp y empezar a trabajar juntos en tus proyectos de confección. ¡Es rápido y fácil! 😊',
                  icon: 'warning', // Puedes usar 'success', 'error', 'warning', 'info', 'question'
                  showConfirmButton: true, // Opcional: Oculta el botón de confirmación
                  confirmButtonText: 'Registrarme ahora', // Personaliza el botón
                });
                this.router.navigate(['/auth/sign-up']);
              }
              return [];
            })
          )
        )
      )
      .subscribe();
  }
  // Método que reciben los componentes para ejecutar la acción
  openWhatsAppAction(phoneNumber: string | undefined, message: string) {
    if (phoneNumber) {
      this.whatsAppAction$.next({ phoneNumber, message });
    } else {
      toast.error('Número invalido');
    }
  }

  private openWhatsApp(phoneNumber: string, message: string) {
    // Elimina todos los caracteres no numéricos-
    let formattedNumber = phoneNumber.trim().replace(/\D/g, '');

    // Agrega el prefijo "57" de Colombia si no está presente al inicio del número
    if (!formattedNumber.startsWith('57')) {
      formattedNumber = `57${formattedNumber}`;
    }

    // Verifica que el número esté bien formateado después de agregar el prefijo
    if (formattedNumber.length >= 12 && formattedNumber.length <= 15) {
      // Longitud ajustada para incluir "57"
      // Forma la URL de WhatsApp y abre en una nueva pestaña
      const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(
        message
      )}`;
      window.open(whatsappUrl, '_blank');
    } else {
      toast.error('Número de teléfono erróneo');
    }
  }
}
