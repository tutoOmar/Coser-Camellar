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
  first,
  forkJoin,
  from,
  map,
  merge,
  Observable,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { WorkerUser } from '../features/models/worker.model';
import { AuthStateService } from '../../shared/data-access/auth-state.service';
import { TallerUSer } from '../features/models/talleres.model';
import { SateliteUser } from '../features/models/satelite.model';

@Injectable({
  providedIn: 'root',
})
export class WorksService {
  private newsSignal = signal<any[]>([]);
  private sateliteSignal = signal<any[]>([]);
  flag = true;

  constructor(private storage: Storage) {}

  private _auth = inject(AuthStateService);
  private firestore = inject(Firestore);

  // Método para subir un archivo (imagen)
  private uploadImage(file: File): Observable<string> {
    const filepath = `news/${file.name}`;
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
   *
   * @param file
   * @param newsData
   * @param collectionSelected
   * @returns
   */
  uploadUser(
    file: File | null,
    newsData: any,
    collectionSelected: string
  ): Observable<any> {
    // Se quita el id debido a que Firebase crea su propio id
    const newDataWithoutId: any = newsData;
    delete newDataWithoutId.id;
    if (file) {
      // Si hay imagen, la subimos y luego creamos la noticia
      return this.uploadImage(file).pipe(
        switchMap((imageUrl: string) => {
          const newsWithImage = {
            ...newDataWithoutId,
            photo: imageUrl,
            createdAt: new Date(),
          };
          const newsCollection = collection(this.firestore, collectionSelected);
          return from(addDoc(newsCollection, newsWithImage)); // Subimos la noticia
        })
      );
    } else {
      // Si no hay imagen, solo subimos la noticia sin la URL de imagen
      const newsWithoutImage = {
        ...newDataWithoutId,
        createdAt: new Date(),
      };
      const newsCollection = collection(this.firestore, collectionSelected);
      return from(addDoc(newsCollection, newsWithoutImage)); // Subimos la noticia
    }
  }
  /**
   * En esta función se obtiene la lista en la colección de 'news'
   *  para obtener la noticias, y luego se setea el signal
   */
  private getUSersByCollection(collectionSelected: string): void {
    const currentUserId = this._auth.currentUser?.uid;
    const userCollection = collection(this.firestore, collectionSelected);
    let queryCollection;
    if (currentUserId) {
      queryCollection = query(
        userCollection
        /**Se hace un filtro el cual trae todos los perfiles excepto el propio de nosotros */
        /*** Esto se retira por petición de los usuarios porque querian ver como quedaba su perfil  */
        // where('userId', '!=', currentUserId)
      );
    } else {
      // Si no hay usuario autenticado, simplemente obtén todos los documentos de la colección
      queryCollection = query(userCollection);
    }

    collectionData(queryCollection, { idField: 'id' }).subscribe(
      (data: any[]) => {
        this.newsSignal.set(data as any[]);
      }
    );
  }
  /**
   * En esta función se obtiene la lista en la colección de 'news'
   *  para obtener la noticias, y luego se setea el signal
   */
  private getSateliteByCollection(collectionSelected: string): void {
    const newsCollection = collection(this.firestore, collectionSelected);
    collectionData(newsCollection, { idField: 'id' }).subscribe(
      (data: any[]) => {
        this.sateliteSignal.set(data as any[]);
      }
    );
  }
  /**
   *
   * @param id
   * @param collectionSelected
   * @returns
   */
  public getUserByIdAndCollection(
    id: string,
    collectionSelected: string
  ): Observable<any> {
    const docRef = doc(this.firestore, `${collectionSelected}/${id}`);
    return docData(docRef, { idField: 'id' }).pipe(
      catchError((error) => {
        return of(null);
      })
    );
  }
  /**
   *
   * @param userid
   * @param collectionSelected
   * @returns
   */
  public getUserByUserIdAndCollection(
    userId: string,
    collectionSelected: string
  ): Observable<any> {
    const userCollection = collection(this.firestore, collectionSelected);
    const userQuery = query(
      userCollection,
      where('userId', '==', userId),
      limit(1) // Limita a solo un documento
    );

    return collectionData(userQuery, { idField: 'id' }).pipe(
      catchError((error) => {
        return of(null);
      }) // Si hay un error (usuario no encontrado), retorna null
    );
  }
  /**
   * Obtiene cualquier usuario en cualquier coleccion de las actuales, pero usando el filtro de userId y no el ID directo
   * @param userId
   * @returns
   */
  getUserByUserIdInAnyCollection(
    userId: string
  ): Observable<WorkerUser[] | TallerUSer[] | SateliteUser[] | null[]> {
    const workerQuery = this.getUserByUserIdAndCollection(
      userId,
      'trabajadores'
    );
    const tallerQuery = this.getUserByUserIdAndCollection(userId, 'talleres');
    const sateliteQuery = this.getUserByUserIdAndCollection(userId, 'satelite');
    return combineLatest([workerQuery, tallerQuery, sateliteQuery]).pipe(
      map(([workers, tallers, satelites]) => [
        ...workers,
        ...tallers,
        ...satelites,
      ]),
      catchError((error) => {
        return of([]);
      })
    );
  }
  /**
   * Obtiene cualquier usuario en cualquier coleccion de las actuales,  usando el filtro ID directo
   * @param userId
   * @returns
   */
  getUserByIdInAnyCollection(
    userId: string
  ): Observable<WorkerUser[] | TallerUSer[] | SateliteUser[] | null[]> {
    const workerQuery = this.getUserByIdAndCollection(userId, 'trabajadores');
    const tallerQuery = this.getUserByIdAndCollection(userId, 'talleres');
    const sateliteQuery = this.getUserByIdAndCollection(userId, 'satelite');
    return merge(
      workerQuery.pipe(map((worker) => worker as WorkerUser[])),
      tallerQuery.pipe(map((taller) => taller as TallerUSer[])),
      sateliteQuery.pipe(map((satelite) => satelite as SateliteUser[]))
    ).pipe(catchError(() => of([])));
  }
  /**
   * Se obtiene el signal de trabajadores
   * @returns
   */
  getWorkersSignal(collectionSelected: string) {
    this.getUSersByCollection(collectionSelected);
    return this.newsSignal;
  }
  /**
   *
   * @param collectionSelected
   */
  getSateliteSignal(collectionSelected: string) {
    this.getSateliteByCollection(collectionSelected);
    return this.sateliteSignal;
  }
  // Aumenta los likes en las publicaciónes
  incrementLike() {
    const newsCollection = collection(this.firestore, 'news');
    //return from(updateDoc())
  }
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
  // Método para verificar si el usuario ya existe en alguna de las colecciones
  checkUserExists(): Observable<boolean> {
    const currentUserId = this._auth.currentUser?.uid;
    if (!currentUserId) {
      return of(false); // Si el usuario no está autenticado, devolvemos false
    }

    // Definimos las colecciones a verificar
    const collectionsToCheck = ['satelite', 'talleres', 'trabajadores'];

    // Creamos un array de observables que consulta cada colección
    const checkObservables = collectionsToCheck.map((collectionName) => {
      const userCollection = collection(this.firestore, collectionName);
      const userQuery = query(
        userCollection,
        where('userId', '==', currentUserId)
      );
      return collectionData(userQuery).pipe(
        map((data: any) => data.length > 0), // Devuelve true si encuentra un documento
        catchError(() => of(false)) // En caso de error, devuelve false
      );
    });

    // Usamos combineLatest para esperar los resultados de todas las colecciones
    return combineLatest(checkObservables).pipe(
      map((results) => results.some((exists) => exists)) // Devuelve true si algún resultado es true
    );
  }
  // Método para actualizar el usuario en la base de datos de fireStore
  updateUser(
    collectionSelected: string,
    user: WorkerUser | TallerUSer | SateliteUser,
    image: File | null
  ): Observable<any> {
    if (image) {
      // Si hay imagen, la subimos y luego creamos la noticia
      return this.uploadImage(image).pipe(
        switchMap((imageUrl: string) => {
          const userWithImage = {
            ...user,
            photo: imageUrl,
          };
          const _collection = collection(this.firestore, collectionSelected);
          const docRef = doc(_collection, user.id);
          return from(updateDoc(docRef, { ...userWithImage }));
        })
      );
    } else {
      // Si no hay imagen, solo subimos la noticia sin la URL de imagen
      const userWithoutImage = {
        ...user,
      };
      const _collection = collection(this.firestore, collectionSelected);
      const docRef = doc(_collection, user.id);
      return from(updateDoc(docRef, { ...userWithoutImage }));
    }
  }
  //
}
