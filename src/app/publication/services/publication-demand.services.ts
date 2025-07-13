import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  orderBy,
  limit,
  getDocs,
  getDoc,
  doc,
  query,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  addDoc,
  where,
  deleteDoc,
  updateDoc,
} from '@angular/fire/firestore';
import {
  from,
  switchMap,
  map,
  forkJoin,
  Observable,
  of,
  catchError,
  throwError,
  tap,
} from 'rxjs';
import { Publication } from '../models/publication.model';
import { PublicationDB } from '../models/publication-db.model';
import { UploadImagesService } from '../../shared/data-access/upload-images.service';
import { toast } from 'ngx-sonner';

const PATH = 'posts';
const PATH_USER = 'users';
@Injectable({
  providedIn: 'root',
})
export class PublicationDemandService {
  private lastVisible: QueryDocumentSnapshot<DocumentData> | null = null;
  private readonly PAGE_SIZE = 10;

  constructor(
    private firestore: Firestore,
    private uploadImagesService: UploadImagesService
  ) {}

  // Método para obtener la primera página de publicaciones
  getInitialPublications(): Observable<Publication[]> {
    this.lastVisible = null; // Reiniciar para nueva consulta
    return this.getPublications(true);
  }

  // Método para obtener más publicaciones (paginación)
  getMorePublications(): Observable<Publication[]> {
    if (!this.lastVisible) {
      return from([]);
    }
    return this.getPublications(false);
  }
  /**
   * Método para obtener las publicaciones
   * @param isInitial
   * @returns
   */
  private getPublications(isInitial: boolean): Observable<Publication[]> {
    const postsRef = collection(this.firestore, PATH);

    let q;
    if (isInitial || !this.lastVisible) {
      // Primera consulta
      q = query(postsRef, orderBy('timestamp', 'desc'), limit(this.PAGE_SIZE));
    } else {
      // Consulta con paginación
      q = query(
        postsRef,
        orderBy('timestamp', 'desc'),
        startAfter(this.lastVisible),
        limit(this.PAGE_SIZE)
      );
    }

    return from(getDocs(q)).pipe(
      switchMap((snapshot) => {
        // Actualizar el último documento visible para paginación
        if (snapshot.docs.length > 0) {
          this.lastVisible = snapshot.docs[snapshot.docs.length - 1];
        }

        const posts: PublicationDB[] = snapshot.docs.map(
          (docSnap) =>
            ({
              id: docSnap.id,
              ...docSnap.data(),
              // Convertir timestamp de Firestore a Date si es necesario
              timestamp:
                docSnap.data()['timestamp']?.toDate?.() ||
                docSnap.data()['timestamp'],
            } as PublicationDB)
        );
        // Si no hay posts, retornar array vacío
        if (posts.length === 0) {
          return from([]);
        }
        // Para cada post, obtener el autor
        const postsWithAuthor$ = posts.map((post) => {
          const userQuery = query(
            collection(this.firestore, PATH_USER),
            where('userId', '==', post.autorId),
            limit(1)
          );
          return from(getDocs(userQuery)).pipe(
            map((querySnapshot) => {
              const authorDoc =
                querySnapshot.docs.length > 0 ? querySnapshot.docs[0] : null;
              const authorData = authorDoc ? authorDoc.data() : null;
              return {
                ...post,
                autor: authorData
                  ? {
                      name: authorData['name'] || 'Usuario desconocido',
                      imageAvatarUrl: authorData['photo'] || '',
                    }
                  : {
                      name: 'Usuario desconocido',
                      imageAvatarUrl: '',
                    },
              } as Publication;
            })
          );
        });

        return forkJoin(postsWithAuthor$);
      })
    );
  }

  /**
   * Método optimizado para obtener las publicaciones de un usuario específico
   * @param userId - ID del usuario del cual queremos obtener las publicaciones
   * @returns Observable con las publicaciones del usuario incluyendo datos del autor
   */
  getUsersPublicationsByUserId(userId: string): Observable<Publication[]> {
    const postsRef = collection(this.firestore, PATH);
    if (userId) {
      // Query para obtener las publicaciones del usuario
      const q = query(
        postsRef,
        where('autorId', '==', userId), // Corregido: autorId en lugar de userId
        orderBy('timestamp', 'desc')
      );
      return from(getDocs(q)).pipe(
        switchMap((snapshot) => {
          // Si no hay publicaciones, retornar array vacío
          if (snapshot.docs.length === 0) {
            return of([]);
          }

          const posts: PublicationDB[] = snapshot.docs.map(
            (docSnap) =>
              ({
                id: docSnap.id,
                ...docSnap.data(),
                timestamp:
                  docSnap.data()['timestamp']?.toDate?.() ||
                  docSnap.data()['timestamp'],
              } as PublicationDB)
          );
          // Obtener el tipo de autor de la primera publicación
          // (todas tendrán el mismo autorId y autorType)
          const firstPost = posts[0];
          const authorType = firstPost.autorType;
          const authorId = firstPost.autorId;

          // Una sola consulta para obtener los datos del autor
          const userQuery = query(
            collection(this.firestore, PATH_USER),
            where('userId', '==', authorId),
            limit(1)
          );

          return from(getDocs(userQuery)).pipe(
            map((querySnapshot) => {
              const authorDoc =
                querySnapshot.docs.length > 0 ? querySnapshot.docs[0] : null;
              const authorData = authorDoc ? authorDoc.data() : null;

              // Datos del autor que se reutilizarán para todas las publicaciones
              const autor = authorData
                ? {
                    name: authorData['name'] || 'Usuario desconocido',
                    imageAvatarUrl: authorData['photo'] || '',
                  }
                : {
                    name: 'Usuario desconocido',
                    imageAvatarUrl: '',
                  };

              // Aplicar los mismos datos del autor a todas las publicaciones
              return posts.map((post) => ({
                ...post,
                autor,
              })) as Publication[];
            }),
            catchError((error) => {
              console.error('Error fetching author data:', error);
              // En caso de error, retornar publicaciones sin datos del autor
              return of(
                posts.map((post) => ({
                  ...post,
                  autor: {
                    name: 'Usuario desconocido',
                    imageAvatarUrl: '',
                  },
                })) as Publication[]
              );
            })
          );
        }),
        catchError((error) => {
          console.error('Error fetching publications:', error);
          return of([]);
        })
      );
    } else {
      return of([]);
    }
  }
  // Método para verificar si hay más publicaciones disponibles
  hasMorePublications(): boolean {
    const hasMore = this.lastVisible !== null;
    return hasMore;
  }
  // Método para resetear la paginación
  resetPagination(): void {
    this.lastVisible = null;
  }
  /**
   * Se crea una publicaciónn
   * @param publication
   * @param files
   * @returns
   */
  addPublication(
    publication: Omit<PublicationDB, 'id'>,
    files: File[]
  ): Observable<string> {
    if (files && files.length > 0) {
      return this.uploadImagesService.uploadImages(files).pipe(
        switchMap((imagesUrls: string[]) => {
          const postsRef = collection(this.firestore, PATH);
          const docData = {
            ...publication,
            timestamp: new Date(), // Asegurar timestamp actual
            contacts: publication.contacts || 0,
            images: imagesUrls,
          };

          return from(addDoc(postsRef, docData)).pipe(
            map((docRef) => {
              return docRef.id;
            })
          );
        })
      );
    } else {
      const postsRef = collection(this.firestore, PATH);
      const docData = {
        ...publication,
        timestamp: new Date(), // Asegurar timestamp actual
        contacts: publication.contacts || 0,
      };

      return from(addDoc(postsRef, docData)).pipe(
        map((docRef) => {
          return docRef.id;
        })
      );
    }
  }
  /**
   * Método que elimina en firebase la publicación del id enviado
   * @param id
   */
  eliminatePublication(id: string) {
    const postCollection = collection(this.firestore, PATH);
    const docRef = doc(postCollection, id);
    return from(deleteDoc(docRef)).pipe(
      map(() => true) // Eliminación exitosa
    );
  }
  /**
   *
   * @param publicationToEdit
   * @param images
   * @param imagesToDelete
   * @returns
   */
  updatePublicationEdit(
    publicationToEdit: PublicationDB,
    images: File[],
    imagesToDelete: string[]
  ): Observable<any> {
    return of(null).pipe(
      //1. Verificamos si toca subir imagenes
      switchMap(() => {
        if (images && images.length > 0) {
          return this.uploadImagesService.uploadImages(images);
        } else {
          return of([]);
        }
      }),
      // 2. Preparar las imagenes ya subidas
      switchMap((newImageUrls: string[]) => {
        let updateImages: string[] = [...(publicationToEdit.images || [])];

        if (newImageUrls.length > 0) {
          updateImages.push(...newImageUrls);
        }
        const updatedPublication: PublicationDB = {
          ...publicationToEdit,
          images: updateImages,
          updatedAt: new Date().toISOString(),
        };
        //Actualizamos en la base de datos
        const _collection = collection(this.firestore, PATH);
        const docRef = doc(_collection, publicationToEdit.id);
        return from(updateDoc(docRef, { ...updatedPublication }));
      }),
      // 3. Eliminar las imagenes
      switchMap(() => {
        if (imagesToDelete && imagesToDelete.length > 0) {
          const deletedObservables = imagesToDelete.map((imageUrl) =>
            this.uploadImagesService.deleteImageFromStorage(imageUrl).pipe(
              catchError((error) => {
                console.error(`Error al eliminar imagen ${imageUrl}:`, error);
                return of(null); // Continúa aunque falle una imagen
              })
            )
          );
          return forkJoin(deletedObservables);
        } else {
          return of(null);
        }
      }),
      catchError((error) => {
        console.error('Error al actualizar la publicación:', error);
        return throwError(() => error);
      })
    );
  }
}
