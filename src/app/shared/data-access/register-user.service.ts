import { inject, Injectable, signal } from '@angular/core';
import {
  addDoc,
  collection,
  collectionData,
  doc,
  Firestore,
  getDoc,
  query,
  updateDoc,
  where,
  getDocs,
} from '@angular/fire/firestore';
import { SateliteUser } from '../../works/features/models/satelite.model';
import { TallerUSer } from '../../works/features/models/talleres.model';
import { AuthStateService } from './auth-state.service';
import { WorkerUser } from '../../works/features/models/worker.model';
import { catchError, from, map, Observable, of, switchMap } from 'rxjs';
import {
  getDownloadURL,
  ref,
  Storage,
  uploadBytesResumable,
} from '@angular/fire/storage';
import { UploadImagesService } from './upload-images.service';
import { EmpresaUser } from '../../works/features/models/empresa.model';
import { NaturalPersonUser } from '../../works/features/models/natural-person.model';
@Injectable({
  providedIn: 'root',
})
export class RegisterUserService {
  private _firestore = inject(Firestore);
  private _authState = inject(AuthStateService);
  private _storage = inject(Storage);
  private _imageService = inject(UploadImagesService);

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
   * Actualiza un usuario por id
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
  /**
   * Funcion encargada de recibir los datos del modal
   */
  sendCommentsUsers(dataUser: any) {
    const _collection = collection(this._firestore, 'commentsUsers');
    return from(
      addDoc(_collection, {
        ...dataUser,
        timeStamp: new Date().toISOString(),
      })
    );
  }
  /**
   * Crea usuario que ya se registró con email y contraseña
   * y se un usuario con telefono para poder contactarlo después si
   * no creó un perfil
   */
  createUserWithNameAndPhoneNoProfile(dataUser: any) {
    const _collection = collection(this._firestore, 'users');
    return from(
      addDoc(_collection, {
        ...dataUser,
        timeStamp: new Date().toISOString(),
      })
    );
  }
  /**
   * Método para verificar si el usuario ya existe en alguna de las colecciones
   * @returns TRue o false si el usuario ya tiene un perfil como trabajador o satelite o taller.
   */
  checkUserHadLeftTheNumberButNoProfileComplete(): Observable<boolean> {
    const currentUserId = this._authState.currentUser?.uid;
    if (!currentUserId) {
      return of(false); // Si el usuario no está autenticado, devolvemos false
    }

    // Definimos las colecciones a verificar
    const collectionToCheck = 'userNoProfile';
    const userCollection = collection(this._firestore, collectionToCheck);
    const userQuery = query(
      userCollection,
      where('userId', '==', currentUserId)
    );
    return collectionData(userQuery).pipe(
      map((data: any) => data.length > 0), // Devuelve true si encuentra un documento
      catchError(() => of(false)) // En caso de error, devuelve false
    );
  }
  /**
   * Método para actualizar el usuario en la base de datos de fireStore
   * Este actualización se hace con base al userId que es adquirido al crear un usuario
   */
  updateByUserIdTheUser(
    collectionSelected: string,
    user:
      | Omit<WorkerUser, 'id'>
      | Omit<TallerUSer, 'id'>
      | Omit<SateliteUser, 'id'>
      | Omit<EmpresaUser, 'id'>
      | Omit<NaturalPersonUser, 'id'>,
    image: File | null
  ): Observable<any> {
    if (image) {
      // Si hay imagen, la subimos y luego actualizamos el usuario
      return this._imageService.uploadImage(image).pipe(
        switchMap((imageUrl: string) => {
          const userWithImage = {
            ...user,
            photo: imageUrl,
            userId: this._authState.currentUser?.uid,
          };
          return this.updateUserByUserId(collectionSelected, userWithImage);
        })
      );
    } else {
      // Si no hay imagen, solo actualizamos el usuario
      const userWithoutImage = {
        ...user,
        userId: this._authState.currentUser?.uid,
      };
      return this.updateUserByUserId(collectionSelected, userWithoutImage);
    }
  }

  // Método auxiliar para actualizar por userId
  private updateUserByUserId(
    collectionSelected: string,
    user:
      | Omit<WorkerUser, 'id'>
      | Omit<TallerUSer, 'id'>
      | Omit<SateliteUser, 'id'>
      | Omit<EmpresaUser, 'id'>
      | Omit<NaturalPersonUser, 'id'>
  ): Observable<any> {
    const _collection = collection(this._firestore, collectionSelected);
    // Crear query para buscar por userId
    const q = query(_collection, where('userId', '==', user.userId));
    return from(getDocs(q)).pipe(
      switchMap((querySnapshot) => {
        if (querySnapshot.empty) {
          throw new Error('No se encontró ningún usuario con ese userId');
        }
        // Obtener el primer documento que coincida
        const docSnap = querySnapshot.docs[0];
        const docRef = doc(this._firestore, collectionSelected, docSnap.id);
        // Actualizar el documento
        return from(updateDoc(docRef, { ...user }));
      })
    );
  }
}
