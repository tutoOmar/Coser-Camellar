import { inject, Injectable, signal } from '@angular/core';
import {
  addDoc,
  collection,
  doc,
  Firestore,
  getDoc,
  query,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { SateliteUser } from '../../works/features/models/satelite.model';
import { TallerUSer } from '../../works/features/models/talleres.model';
import { AuthStateService } from './auth-state.service';
import { WorkerUser } from '../../works/features/models/worker.model';
import { from, Observable, switchMap } from 'rxjs';
import {
  getDownloadURL,
  ref,
  Storage,
  uploadBytesResumable,
} from '@angular/fire/storage';

@Injectable({
  providedIn: 'root',
})
export class RegisterUserService {
  private _firestore = inject(Firestore);
  private _authState = inject(AuthStateService);
  private _storage = inject(Storage);

  loading = signal<boolean>(true);
  constructor() {}
  /**
   *
   */
  getCurrentUser(path: string, id?: string) {
    const newId = this._authState.currentUser?.uid;
    const _collection = collection(this._firestore, path);
    const docRef = doc(_collection, newId);
    return getDoc(docRef);
    /**
     * esto de momento no se usa, es más para separar listas y solo
      traiga lo que requerimos si hacer peticiones innecesarias, se utilizará en contenido personalizado que aún no tenemos 
    */
    // const _query = query(
    //   _collection,
    //   where('userId', '==', this._authState.currentUser?.uid)
    // );
  }
  /**
   * REgistro de usuarios ya sean talleres, satelites o trabajadores
   * @param userInfo
   * @param path //Esta será la colección
   * @returns
   */
  create(
    userInfo: WorkerUser | SateliteUser | TallerUSer,
    path: string,
    file: File | null
  ): Observable<any> {
    const userInfoWithoutId: any = userInfo;
    delete userInfoWithoutId.id;
    if (file) {
      return this.uploadImage(file).pipe(
        switchMap((imageUrl: string) => {
          const _collection = collection(this._firestore, path);
          return from(
            addDoc(_collection, {
              ...userInfoWithoutId,
              userId: this._authState.currentUser?.uid,
              photo: imageUrl,
              createdAt: new Date(),
            })
          );
        })
      );
    } else {
      const _collection = collection(this._firestore, path);
      return from(
        addDoc(_collection, {
          ...userInfoWithoutId,
          userId: this._authState.currentUser?.uid,
        })
      );
    }
  }

  // Método para subir un archivo (imagen) en la ruta users
  private uploadImage(file: File): Observable<string> {
    const FOLDER = 'users';
    const filepath = `${FOLDER}/${file.name}`;
    const fileRef = ref(this._storage, filepath);
    const uploadTask = uploadBytesResumable(fileRef, file);

    return new Observable<string>((observer) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Progreso de carga', progress);
        },
        (error) => {
          console.error('Error al cargar el archivo', error);
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
   *
   * @param userInfo
   * @param path
   * @param id
   * @returns
   */
  update(
    userInfo: WorkerUser | SateliteUser | TallerUSer,
    path: string,
    id: string
  ) {
    const _collection = collection(this._firestore, path);
    const docRef = doc(_collection, id);
    return updateDoc(docRef, {
      ...userInfo,
      userId: this._authState.currentUser?.uid,
    });
  }
}
