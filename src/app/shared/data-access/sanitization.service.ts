import { Injectable } from '@angular/core';
import {
  DomSanitizer,
  SafeHtml,
  SafeUrl,
  SafeResourceUrl,
  SafeScript,
  SafeStyle,
} from '@angular/platform-browser';

@Injectable({
  providedIn: 'root',
})
/**
 * Esta clase servicio se crea debido a la necesidad de limpiar las entradas de datos,
 * este se usará en diversos componentes que requieren validar datos indebidos.
 *
 *
 */
export class SanitizationService {
  /**
   *
   * @param sanitizer
   */
  constructor(private sanitizer: DomSanitizer) {}

  // Sanitiza HTML (útil para mostrar contenido HTML de forma segura)
  sanitizeHtml(content: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }

  // Sanitiza URL (útil para enlaces dinámicos)
  sanitizeUrl(url: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  // Sanitiza recursos (útil para URLs de recursos)
  sanitizeResourceUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  // Sanitiza scripts (útil cuando necesitas ejecutar scripts - usado con precaución)
  sanitizeScript(script: string): SafeScript {
    return this.sanitizer.bypassSecurityTrustScript(script);
  }

  // Sanitiza estilos (útil para estilos dinámicos)
  sanitizeStyle(style: string): SafeStyle {
    return this.sanitizer.bypassSecurityTrustStyle(style);
  }

  // Método para limpiar texto simple (elimina etiquetas HTML)
  stripHtml(html: string): string {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }
}
