import { inject, Injectable, signal } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  collectionData,
  docData,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from '@angular/fire/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  Storage,
} from '@angular/fire/storage';
import { Observable, switchMap, from, tap, map } from 'rxjs';
import { Product } from '../models/product.model';
import { Router } from '@angular/router';
const PATH = 'marketplace';

type DocumentData = { [field: string]: any };

@Injectable()
export class MarketplaceService {
  private productSignal = signal<Product[]>([]); // Signal para los usuarios

  constructor(private storage: Storage, private router: Router) {
    this.loadProducts();
  }

  private firestore = inject(Firestore);

  // Método para subir un archivo (imagen)
  private uploadImage(file: File): Observable<string> {
    const filepath = `marketplaceImages/${file.name}`;
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

  // Método para subir un producto (con o sin imagen)
  uploadNewProduct(file: File, ProductData: Product): Observable<any> {
    // Se quita el id debido a que Firebase crea su propio id
    const newDataWithoutId: any = ProductData;
    delete newDataWithoutId.id;
    // Si hay imagen, la subimos y luego creamos el producto
    return this.uploadImage(file).pipe(
      switchMap((imageUrl: string) => {
        const productWithImage = {
          ...newDataWithoutId,
          image: imageUrl,
          createdAt: new Date(),
        };
        const productCollection = collection(this.firestore, PATH);
        return from(addDoc(productCollection, productWithImage)); // Subimos el producto
      })
    );
  }
  // Método para editar un producto (con o sin imagen)
  updateProduct(file: File | null, productData: Product): Observable<any> {
    if (file) {
      // Si hay imagen, la subimos y luego creamos el producto nuevo
      return this.uploadImage(file).pipe(
        switchMap((imageUrl: string) => {
          const productWithImage: Product = {
            ...productData,
            image: imageUrl,
          };
          const productCollection = collection(this.firestore, PATH);
          const docRef = doc(productCollection, productWithImage.id);
          return from(updateDoc(docRef, { ...productWithImage }));
        })
      );
    } else {
      // Si no hay imagen, solo subimos el producto sin la URL de imagen
      const productCollection = collection(this.firestore, PATH);
      const docRef = doc(productCollection, productData.id);
      return from(updateDoc(docRef, { ...productData }));
    }
  }
  /**
   * Eliminar un producto
   * @param productId
   * @returns
   */
  deleteProduct(productId: string): Observable<void> {
    const productCollection = collection(this.firestore, PATH);
    const docRef = doc(productCollection, productId);
    return from(deleteDoc(docRef));
  }
  /**
   * En esta función se obtiene la lista en la colección de 'Product'
   *  para obtener todos los productos,
   */
  loadProducts(): Observable<any> {
    const productCollection = collection(this.firestore, PATH);
    return collectionData(productCollection, { idField: 'id' });
  }
  /**
   * En esta función se obtiene la lista en la colección de 'Product'
   *  para obtener los productos que pertenecen a un usuario
   */
  loadProductsByUserId(userId: string): Observable<any> {
    const productCollection = collection(this.firestore, PATH);
    const queryCollection = query(
      productCollection,
      where('userId', '==', userId)
    );

    return collectionData(queryCollection, { idField: 'id' });
  }
  /**
   *
   */
  getOneProductById(idProduct: string): Observable<any> {
    const docRef = doc(this.firestore, `${PATH}/${idProduct}`);
    return docData(docRef).pipe(
      map((data: any) => ({ ...data, id: idProduct })) // Agregamos el ID manualmente
    );
  }

  /**
   * Se obtiene el signal de noticias
   * @returns
   */
  getProductSignal() {
    return this.productSignal;
  }
}
