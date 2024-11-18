import { inject, Injectable } from '@angular/core';
import { collection, doc, Firestore, updateDoc } from '@angular/fire/firestore';
import { Observable, switchMap, from } from 'rxjs';
import { SateliteUser } from '../features/models/satelite.model';
import { TallerUSer } from '../features/models/talleres.model';
import { WorkerUser } from '../features/models/worker.model';
import {
  Storage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from '@angular/fire/storage';
import { Position } from '../features/models/position.model';

@Injectable({
  providedIn: 'root',
})
export class PositionsService {
  private firestore = inject(Firestore);

  constructor(private storage: Storage) {}
  // Método para subir un archivo (imagen)
  private uploadImage(file: File): Observable<string> {
    const filepath = `positionsImg/${file.name}`;
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
  // Método para actualizar el usuario en la base de datos de fireStore
  // Dado que las positions están dentro del usuario toca actualizar todo el usuario
  updateUserPosition(
    collectionSelected: string,
    user: TallerUSer | SateliteUser,
    position: Position,
    image: File | null
  ): Observable<any> {
    if (image) {
      // Si hay imagen, la subimos y luego creamos la noticia
      return this.uploadImage(image).pipe(
        switchMap((imageUrl: string) => {
          const positionWithImage = {
            ...position,
            photo: imageUrl,
          };
          user.positions.push(positionWithImage);
          const userUpdated = user;
          const _collection = collection(this.firestore, collectionSelected);
          const docRef = doc(_collection, user.id);
          return from(updateDoc(docRef, { ...userUpdated }));
        })
      );
    } else {
      // Si no hay imagen, solo subimos la noticia sin la URL de imagen
      user.positions.push(position);
      const userWithoutImageInPosition = {
        ...user,
      };
      const _collection = collection(this.firestore, collectionSelected);
      const docRef = doc(_collection, user.id);
      return from(updateDoc(docRef, { ...userWithoutImageInPosition }));
    }
  }
}
