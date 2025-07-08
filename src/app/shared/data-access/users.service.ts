import { inject, Injectable, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Firestore,
  collection,
  addDoc,
  collectionData,
  updateDoc,
  doc,
  docData,
  query,
  where,
  limit,
  getDocs,
} from '@angular/fire/firestore';
import {
  Storage,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from '@angular/fire/storage';
import {
  catchError,
  combineLatest,
  from,
  map,
  Observable,
  of,
  switchMap,
} from 'rxjs';
import { EmpresaUser } from '../../works/features/models/empresa.model';
import { NaturalPersonUser } from '../../works/features/models/natural-person.model';
import { NoProfileUser } from '../../works/features/models/no-profile.model';
import { SateliteUser } from '../../works/features/models/satelite.model';
import { TallerUSer } from '../../works/features/models/talleres.model';
import { WorkerUser } from '../../works/features/models/worker.model';
import { AuthStateService } from './auth-state.service';
import { UploadImagesService } from './upload-images.service';
import { TypeUser } from '../../works/features/models/type-user.model';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private newsSignal = signal<any[]>([]);
  private sateliteSignal = signal<any[]>([]);
  flag = true;

  constructor(private storage: Storage) {}

  private _auth = inject(AuthStateService);
  private firestore = inject(Firestore);
  private _imageService = inject(UploadImagesService);
  // Método para actualizar el comentario en la base de datos de fireStore
  addComment(
    collectionSelected: string,
    user: WorkerUser | TallerUSer | SateliteUser,
    idUser: string
  ): Observable<any> {
    const _collection = collection(this.firestore, collectionSelected);
    const docRef = doc(_collection, idUser);
    return from(updateDoc(docRef, { ...user }));
  }
  /**
   * Método para verificar si el usuario ya existe en alguna de las colecciones
   * @returns TRue o false si el usuario ya tiene un perfil como trabajador o satelite o taller.
   */
  checkUserHaveProfile(): Observable<boolean> {
    const currentUserId = this._auth.currentUser?.uid;
    if (!currentUserId) {
      return of(false); // Si el usuario no está autenticado, devolvemos false
    }
    // En esta colección están todos los usuarios
    const collectionName = 'users';
    // Creamos un array de observables que consulta cada colección

    const userCollection = collection(this.firestore, collectionName);
    const userQuery = query(
      userCollection,
      where('userId', '==', currentUserId)
    );
    return collectionData(userQuery).pipe(
      map((data: any) => {
        return data.length > 0 || data.typeUSer === TypeUser.NO_PROFILE;
      }), // Devuelve true si encuentra un documento
      catchError(() => of(false)) // En caso de error, devuelve false
    );
  }
  /**
   * Método para actualizar el usuario en la base de datos de fireStore
   * Este actualización se hace con base al userId que es adquirido al crear un usuario
   */
  updateByUserIdTheUser(
    collectionSelected: string,
    user: WorkerUser | TallerUSer | SateliteUser,
    image: File | null
  ): Observable<any> {
    if (image) {
      // Si hay imagen, la subimos y luego actualizamos el usuario
      return this._imageService.uploadImage(image).pipe(
        switchMap((imageUrl: string) => {
          const userWithImage = {
            ...user,
            photo: imageUrl,
          };
          return this.updateUserByUserId(collectionSelected, userWithImage);
        })
      );
    } else {
      // Si no hay imagen, solo actualizamos el usuario
      const userWithoutImage = {
        ...user,
      };
      return this.updateUserByUserId(collectionSelected, userWithoutImage);
    }
  }

  // Método auxiliar para actualizar por userId
  private updateUserByUserId(
    collectionSelected: string,
    user: WorkerUser | TallerUSer | SateliteUser
  ): Observable<any> {
    const _collection = collection(this.firestore, collectionSelected);
    // Crear query para buscar por userId
    const q = query(_collection, where('userId', '==', user.userId));

    return from(getDocs(q)).pipe(
      switchMap((querySnapshot) => {
        if (querySnapshot.empty) {
          throw new Error('No se encontró ningún usuario con ese userId');
        }
        // Obtener el primer documento que coincida
        const docSnap = querySnapshot.docs[0];
        const docRef = doc(this.firestore, collectionSelected, docSnap.id);
        // Actualizar el documento
        return from(updateDoc(docRef, { ...user }));
      })
    );
  }
}
