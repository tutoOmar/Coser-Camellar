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
  // Método para actualizar el usuario en la base de datos de fireStore con la nueva oferta laboral
  // Dado que las positions están dentro del usuario toca actualizar todo el usuario
  updateUserNewPosition(
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
  // Método para actualizar el usuario en la base de datos de fireStore con la oferta laboral editada
  // Dado que las positions están dentro del usuario toca actualizar todo el usuario
  updateUserExistPosition(
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

          user.positions = user.positions.map((currentPosition) => {
            if (currentPosition.id === positionWithImage.id) {
              return positionWithImage;
            } else {
              return currentPosition;
            }
          });
          const userUpdated = user;
          const _collection = collection(this.firestore, collectionSelected);
          const docRef = doc(_collection, user.id);
          return from(updateDoc(docRef, { ...userUpdated }));
        })
      );
    } else {
      user.positions = user.positions.map((currentPosition) => {
        if (currentPosition.id === position.id) {
          return position;
        } else {
          return currentPosition;
        }
      });
      // Si no hay imagen, solo subimos la oferta sin la URL de imagen
      const userWithoutImageInPosition = {
        ...user,
      };
      const _collection = collection(this.firestore, collectionSelected);
      const docRef = doc(_collection, user.id);
      return from(updateDoc(docRef, { ...userWithoutImageInPosition }));
    }
  }
  // Método para actualizar el usuario en la base de datos de fireStore
  // Dado que las positions están dentro del usuario toca actualizar todo el usuario
  updateStatusPosition(
    collectionSelected: string,
    user: TallerUSer | SateliteUser
  ): Observable<any> {
    console.log(user);
    const _collection = collection(this.firestore, collectionSelected);
    const docRef = doc(_collection, user.id);
    return from(updateDoc(docRef, { ...user }));
  }
  //Método para eliminar un posición
  deletePosition(
    collectionSelected: string,
    user: TallerUSer | SateliteUser,
    positionId: string
  ): Observable<any> {
    user.positions = user.positions.filter(
      (position) => position.id !== positionId
    );
    const _collection = collection(this.firestore, collectionSelected);
    const docRef = doc(_collection, user.id);
    return from(updateDoc(docRef, { ...user }));
  }
}
