import { Directive, ElementRef, HostListener, inject } from '@angular/core';
import { SanitizationService } from '../data-access/sanitization.service';

@Directive({
  selector: '[appSanitizeInput]',
  standalone: true,
})
export class SanitizeInputDirective {
  private el = inject(ElementRef);
  private sanitizer = inject(SanitizationService);

  @HostListener('input', ['$event'])
  onInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const sanitizedValue = this.sanitizer.stripHtml(input.value);

    // Solo actualiza el valor si ha cambiado
    if (sanitizedValue !== input.value) {
      input.value = sanitizedValue;
      // Disparar un evento de input para que Angular actualice el modelo
      const evt = new Event('input', { bubbles: true });
      input.dispatchEvent(evt);
    }
  }
}
