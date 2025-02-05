import { inject, Injectable, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Firestore,
  collection,
  addDoc,
  collectionData,
  updateDoc,
} from '@angular/fire/firestore';
import {
  Storage,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from '@angular/fire/storage';
import { error } from 'console';
import { from, Observable, switchMap } from 'rxjs';
import { NewsItem } from '../features/news/models/news.model';
import { Router } from '@angular/router';
const PATH = 'news';

@Injectable({
  providedIn: 'root',
})
export class NewsService {
  private newsSignal = signal<NewsItem[]>([]); // Signal para los usuarios

  constructor(private storage: Storage, private router: Router) {
    this.loadNews();
  }

  private firestore = inject(Firestore);
  private _collection = collection(this.firestore, PATH);

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

  // Método para subir la noticia completa (con o sin imagen)
  uploadNews(file: File | null, newsData: NewsItem): Observable<any> {
    // Se quita el id debido a que Firebase crea su propio id
    const newDataWithoutId: any = newsData;
    delete newDataWithoutId.id;
    if (file) {
      // Si hay imagen, la subimos y luego creamos la noticia
      return this.uploadImage(file).pipe(
        switchMap((imageUrl: string) => {
          const newsWithImage = {
            ...newDataWithoutId,
            imageUrl,
            createdAt: new Date(),
          };
          const newsCollection = collection(this.firestore, 'news');
          return from(addDoc(newsCollection, newsWithImage)); // Subimos la noticia
        })
      );
    } else {
      // Si no hay imagen, solo subimos la noticia sin la URL de imagen
      const newsWithoutImage = {
        ...newDataWithoutId,
        createdAt: new Date(),
      };
      const newsCollection = collection(this.firestore, 'news');
      return from(addDoc(newsCollection, newsWithoutImage)); // Subimos la noticia
    }
  }
  /**
   * En esta función se obtiene la lista en la colección de 'news'
   *  para obtener la noticias, y luego se setea el signal
   */
  private loadNews(): void {
    const newsCollection = collection(this.firestore, 'news');
    collectionData(newsCollection, { idField: 'id' }).subscribe(
      (data: any[]) => {
        this.newsSignal.set(data as NewsItem[]);
      }
    );
  }
  /**
   * Se obtiene el signal de noticias
   * @returns
   */
  getNewsSignal() {
    return this.newsSignal;
  }

  incrementLike() {
    const newsCollection = collection(this.firestore, 'news');
    //return from(updateDoc())
  }
}
