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
      // Verificar si analytics está disponible
      if (!this._analytics) {
        return;
      }

      // Registrar el evento
      logEvent(this._analytics, 'page-visits', {
        pageName: pageName,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error al registrar evento de página:', error);
    }
  }

  logCustomEvent(eventName: string, eventParams: Record<string, any>) {
    try {
      logEvent(this._analytics, eventName, {
        ...eventParams,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error al registrar evento personalizado:', error);
    }
  }
}
