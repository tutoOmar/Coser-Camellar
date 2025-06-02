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
} from '@angular/fire/firestore';
import { from, switchMap, map, forkJoin, Observable } from 'rxjs';
import { Publication } from '../models/publication.model';
import { PublicationDB } from '../models/publication-db.model';

@Injectable({
  providedIn: 'root',
})
export class PublicationDemandService {
  private lastVisible: QueryDocumentSnapshot<DocumentData> | null = null;
  private readonly PAGE_SIZE = 10;

  constructor(private firestore: Firestore) {}

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

  // Método privado que maneja la lógica de consulta
  private getPublications(isInitial: boolean): Observable<Publication[]> {
    const postsRef = collection(this.firestore, 'posts');

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
          console.log('⛔ [Servicio] No hay posts, retornando array vacío');
          return from([]);
        }

        console.log('👥 [Servicio] Obteniendo autores para', posts, 'posts');

        // Para cada post, obtener el autor
        const postsWithAuthor$ = posts.map((post) => {
          const userQuery = query(
            collection(this.firestore, post.autorType),
            where('userId', '==', post.autorId),
            limit(1)
          );
          console.log('Query', userQuery);
          return from(getDocs(userQuery)).pipe(
            map((querySnapshot) => {
              console.log(
                '👤 [Servicio] Autor para post',
                post.id,
                ':',
                querySnapshot.docs.length > 0 ? 'encontrado' : 'no encontrado'
              );

              const authorDoc =
                querySnapshot.docs.length > 0 ? querySnapshot.docs[0] : null;
              const authorData = authorDoc ? authorDoc.data() : null;

              console.log('AutorData', authorData);

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

  // Método para verificar si hay más publicaciones disponibles
  hasMorePublications(): boolean {
    const hasMore = this.lastVisible !== null;
    //console.log('🔍 [Servicio] hasMorePublications:', hasMore, 'lastVisible:', this.lastVisible?.id || 'null');
    return hasMore;
  }
  // Método para resetear la paginación
  resetPagination(): void {
    console.log('🔄 [Servicio] Reseteando paginación');
    this.lastVisible = null;
  }

  // Añadir una sola publicación
  addPublication(publication: Omit<PublicationDB, 'id'>): Observable<string> {
    console.log('➕ [Servicio] Añadiendo nueva publicación:', publication);

    const postsRef = collection(this.firestore, 'posts');
    const docData = {
      ...publication,
      timestamp: new Date(), // Asegurar timestamp actual
      contacts: publication.contacts || 0,
    };

    return from(addDoc(postsRef, docData)).pipe(
      map((docRef) => {
        console.log('✅ [Servicio] Publicación añadida con ID:', docRef.id);
        return docRef.id;
      })
    );
  }

  // Añadir múltiples publicaciones (para testing)
  addMultiplePublications(
    publications: Omit<PublicationDB, 'id'>[]
  ): Observable<string[]> {
    console.log(
      '➕ [Servicio] Añadiendo múltiples publicaciones:',
      publications.length
    );

    const addPromises = publications.map((pub) => this.addPublication(pub));

    return forkJoin(addPromises).pipe(
      map((ids) => {
        console.log('✅ [Servicio] Todas las publicaciones añadidas:', ids);
        return ids;
      })
    );
  }
}
