import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CallService {
  /**
   * Inicia una llamada telefónica
   * @param phoneNumber - Número de teléfono
   */
  makePhoneCall(phoneNumber: string): void {
    if (!phoneNumber) {
      console.error('Número de teléfono es requerido para realizar la llamada');
      return;
    }

    // Limpiar el número de teléfono
    const cleanPhone = this.cleanPhoneNumber(phoneNumber);

    // Crear el enlace tel:
    const telUrl = `tel:${cleanPhone}`;

    // En dispositivos móviles, esto abrirá la aplicación de llamadas
    // En escritorio, dependerá del sistema operativo
    window.location.href = telUrl;
  }

  /**
   * Limpia el número de teléfono removiendo caracteres no numéricos
   * excepto el signo + al inicio
   * @param phoneNumber - Número de teléfono a limpiar
   * @returns Número de teléfono limpio
   */
  private cleanPhoneNumber(phoneNumber: string): string {
    if (!phoneNumber) return '';

    // Mantener el + al inicio si existe, remover todo lo demás excepto números
    const startsWithPlus = phoneNumber.trim().startsWith('+');
    const numbersOnly = phoneNumber.replace(/\D/g, '');

    return startsWithPlus ? `+${numbersOnly}` : numbersOnly;
  }

  /**
   * Valida si un número de teléfono tiene un formato básico válido
   * @param phoneNumber - Número a validar
   * @returns true si el formato es válido
   */
  isValidPhoneNumber(phoneNumber: string): boolean {
    if (!phoneNumber) return false;

    const cleanPhone = this.cleanPhoneNumber(phoneNumber);

    // Validación básica: debe tener entre 7 y 15 dígitos
    const phoneRegex = /^\+?[1-9]\d{6,14}$/;
    return phoneRegex.test(cleanPhone);
  }
}
