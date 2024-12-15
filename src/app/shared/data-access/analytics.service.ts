import { inject, Injectable } from '@angular/core';
import { Analytics, logEvent } from '@angular/fire/analytics';
import { timestamp } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private _analytics = inject(Analytics);

  constructor() {}

  logPageVisit(pageName: string) {
    try {
      console.log('Intentando registrar página:', pageName);

      // Verificar si analytics está disponible
      if (!this._analytics) {
        console.error('Firebase Analytics no está inicializado');
        console.log('Error en analytics');
        return;
      }

      // Registrar el evento
      logEvent(this._analytics, 'page-visits', {
        pageName: pageName,
        timestamp: new Date().toISOString(),
      });

      console.log('Evento de página registrado exitosamente:', pageName);
    } catch (error) {
      console.error('Error al registrar evento de página:', error);
    }
  }

  logCustomEvent(eventName: string, eventParams: Record<string, any>) {
    try {
      console.log(
        'Intentando registrar evento personalizado:',
        eventName,
        eventParams
      );

      logEvent(this._analytics, eventName, {
        ...eventParams,
        timestamp: new Date().toISOString(),
      });

      console.log('Evento personalizado registrado exitosamente:', eventName);
    } catch (error) {
      console.error('Error al registrar evento personalizado:', error);
    }
  }
}
