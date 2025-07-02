import { inject, Injectable, signal } from '@angular/core';
import { addDoc, collection, Firestore } from '@angular/fire/firestore';
import { AuthStateService } from './auth-state.service';
import { from, Observable } from 'rxjs';
import { Storage } from '@angular/fire/storage';

const PATH = 'reports';

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  private _firestore = inject(Firestore);
  private _authState = inject(AuthStateService);
  private _storage = inject(Storage);

  loading = signal<boolean>(false);

  constructor() {}

  /**
   * Crea un reporte de publicación en la colección 'reports'
   * @param reporteData - Datos del reporte que viene del modal
   * @returns Observable con el documento creado
   */
  crearReporte(reporteData: any): Observable<any> {
    const _collection = collection(this._firestore, PATH);

    return from(
      addDoc(_collection, {
        ...reporteData,
        createdAt: new Date(),
      })
    );
  }

  /**
   * Método para procesar y crear reporte desde el modal
   * @param reporteModalData - Datos que vienen del modal (detalles, publicacion, razon, usuarioReportador)
   * @returns Observable con el documento creado
   */
  procesarYCrearReporte(reporteModalData: any): Observable<any> {
    const details = reporteModalData.detalles as string;
    const publication = reporteModalData.publicacion;
    const reason = reporteModalData.razon as string;
    const userReporter = reporteModalData.usuarioReportador;

    if (!details && !publication && !reason && !userReporter) {
      throw new Error('Datos del reporte incompletos');
    }

    // Crear el objeto del reporte con la estructura que ya tienes
    const reporte = {
      publicacionAutor: {
        id: publication.autorId,
        name: publication.autor.name,
        number: publication.number,
      },
      reportadoPor: {
        id: userReporter.id,
        name: userReporter.name,
        number: userReporter.phone,
      },
      razon: reason,
      detalles: details,
      fechaReporte: new Date(),
      estado: 'pendiente',
    };

    return this.crearReporte(reporte);
  }
}
