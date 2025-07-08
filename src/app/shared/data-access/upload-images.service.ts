import { Injectable } from '@angular/core';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  Storage,
  StorageReference,
  getStorage,
  deleteObject,
} from '@angular/fire/storage';
import { catchError, forkJoin, from, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UploadImagesService {
  constructor(private storage: Storage) {}

  /**
   * Método para subir imagenes incialmente, aunque como está programado se puede subir de todo en el momento
   * @param file
   * @returns
   */
  uploadImage(file: File, pathToSave = 'post'): Observable<string> {
    const filepath = this.generateUniqueName(file, pathToSave);
    const fileRef = ref(this.storage, filepath);
    const uploadTask = uploadBytesResumable(fileRef, file);
    return new Observable<string>((observer) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        },
        (error) => {
          observer.error(error);
        },
        async () => {
          const url = await getDownloadURL(fileRef);
          observer.next(url); // Emitir la URL de la imagen
          observer.complete();
        }
      );
    });
  }
  /**
   * Subir varios archivos al tiempo
   */
  uploadImages(files: File[]): Observable<string[]> {
    // Si no hay archivos, retornar array vacío
    if (!files || files.length === 0) {
      return new Observable((observer) => {
        observer.next([]);
        observer.complete();
      });
    }
    // Mapear cada archivo a su observable de upload
    const uploadObservables = files.map((file: File) => this.uploadImage(file));
    // Combinar todos los observables y esperar a que terminen
    return forkJoin(uploadObservables);
  }
  /**
   * Generar un nombre único
   * @param file
   * @returns
   */
  generateUniqueName(file: File, pathToSave: string): string {
    const timestamp = new Date().getTime(); // o usar Date.now()
    const extension = file.name.split('.').pop(); // para conservar la extensión
    const baseName = file.name.split('.').slice(0, -1).join('.'); // sin la extensión

    return `${pathToSave}/${baseName}_${timestamp}.${extension}`;
  }
  /**
   * Elimina una imagen del Firebase Storage
   * @param imageUrl - URL de la imagen a eliminar
   */
  deleteImageFromStorage(imageUrl: string): Observable<void> {
    const storage = getStorage();
    const path = this.getPathFromUrl(imageUrl);

    if (!path) {
      console.error('No se pudo extraer el path del URL');
      return of(void 0);
    }

    const imageRef = ref(storage, path);

    return from(deleteObject(imageRef)).pipe(
      // Aquí puedes agregar un log si quieres
      catchError((err) => {
        console.error('Error al borrar la imagen:', err);
        return of(void 0); // sigue el flujo sin lanzar error
      })
    );
  }

  /**
   * Extrae el path de la imagen desde la URL de Firebase Storage
   * @param url - URL completa de la imagen
   * @returns Path de la imagen en el storage
   */
  private getPathFromUrl(url: string): string | null {
    try {
      const decodedUrl = decodeURIComponent(url);
      const matches = decodedUrl.match(/\/o\/(.*?)\?/);
      return matches ? matches[1] : null;
    } catch (e) {
      console.error('Error parsing URL:', e);
      return null;
    }
  }
}
