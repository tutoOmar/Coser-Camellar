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
        userCollection,
        /**Se hace un filtro el cual trae todos los perfiles excepto el propio de nosotros */
        where('userId', '!=', currentUserId)
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
  getUserInAnyCollection(
    userId: string
  ): Observable<WorkerUser[] | TallerUSer[] | SateliteUser[] | null[]> {
    const workerQuery = this.getUserByUserIdAndCollection(
      userId,
      'trabajadores'
    );
    const tallerQuery = this.getUserByUserIdAndCollection(userId, 'talleres');
    const sateliteQuery = this.getUserByUserIdAndCollection(userId, 'satelite');
    return merge(
      workerQuery.pipe(map((worker) => worker as WorkerUser[])),
      tallerQuery.pipe(map((taller) => taller as TallerUSer[])),
      sateliteQuery.pipe(map((satelite) => satelite as SateliteUser[]))
    ).pipe(
      first(),
      catchError(() => of([]))
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

  addSpecificUser() {
    this.workerUser.forEach((satelite) => {
      this.uploadUser(null, satelite, 'trabajadores');
    });
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
  // Método para actualizar el comentario en la base de datos de fireStore
  updateUser(
    collectionSelected: string,
    user: WorkerUser | TallerUSer | SateliteUser
  ): Observable<any> {
    const _collection = collection(this.firestore, collectionSelected);
    const docRef = doc(_collection, user.id);
    return from(updateDoc(docRef, { ...user }));
  }
  //
  sateliteUsers = [
    {
      id: 'TU001',
      average_score: 4.5,
      responsible: 'José Ramírez',
      city: 'medellín',
      country: 'Colombia',
      neighborhood: 'buenos aires',
      experience: [
        '15 años en confección de ropa deportiva',
        'Especializado en prendas de alto rendimiento',
      ],
      machines: ['plana', 'dos-agujas', 'fileteadora'],
      name: 'Deportes Ramírez',
      phone: '+57 3301234567',
      photo: 'https://i.pravatar.cc/300?u=tu001abcd',
      specialty: ['costura-ropa-deportiva'],
      comments: [
        {
          comment: 'Excelente calidad en las prendas deportivas.',
          id_person: 'CMT054',
          score: 5,
        },
        {
          comment: 'Entrega puntual y buen servicio al cliente.',
          id_person: 'CMT055',
          score: 4.5,
        },
      ],
      status: 'libre',
      numberEmployees: 20,
      positions: [
        {
          id: 'POS036',
          name: 'Operario de Máquina Plana',
          description:
            'Se busca operario con experiencia en máquina plana para ropa deportiva.',
          specialty: ['costura-ropa-deportiva'],
          experience: '3+ años',
          photo: 'https://i.pravatar.cc/300?u=pos036xyz',
          typePayment: 'salario',
          city: 'medellín',
          neighborhood: 'buenos aires',
          phone: '+57 3301234567',
          statusPosition: 'activo',
        },
      ],
      typeUser: 'taller',
    },
    {
      id: 'TU002',
      average_score: 4.2,
      responsible: 'Laura Herrera',
      city: 'bogotá',
      country: 'Colombia',
      neighborhood: 'fontibón',
      experience: ['10 años en confección de chaquetas y abrigos'],
      machines: ['plana', 'plana-mecatronica', 'collarin'],
      name: 'Abrigos Herrera',
      phone: '+57 3312345678',
      photo: 'https://i.pravatar.cc/300?u=tu002efgh',
      specialty: ['costura-chaquetas'],
      comments: [
        {
          comment: 'Chaquetas de excelente calidad y diseño.',
          id_person: 'CMT056',
          score: 4.5,
        },
      ],
      status: 'ocupado',
      numberEmployees: 18,
      positions: [
        {
          id: 'POS037',
          name: 'Patronista',
          description: 'Necesitamos patronista experto en abrigos.',
          specialty: ['patronaje-femenino'],
          experience: '5+ años',
          photo: 'https://i.pravatar.cc/300?u=pos037abc',
          typePayment: 'contrato',
          city: 'bogotá',
          neighborhood: 'fontibón',
          phone: '+57 3312345678',
          statusPosition: 'activo',
        },
      ],
      typeUser: 'taller',
    },
    {
      id: 'TU003',
      average_score: 4.7,
      responsible: 'Diego López',
      city: 'cali',
      country: 'Colombia',
      neighborhood: 'san antonio',
      experience: ['12 años en fabricación de morrales y bolsos'],
      machines: ['triple-transporte', 'de-poste', 'cortadora-industrial'],
      name: 'Morrales López',
      phone: '+57 3323456789',
      photo: 'https://i.pravatar.cc/300?u=tu003ijkl',
      specialty: ['costura-morrales', 'corte-lona'],
      comments: [
        {
          comment: 'Los mejores morrales en el mercado.',
          id_person: 'CMT057',
          score: 5,
        },
        {
          comment: 'Duraderos y de excelente calidad.',
          id_person: 'CMT058',
          score: 4.5,
        },
      ],
      status: 'libre',
      numberEmployees: 25,
      positions: [
        {
          id: 'POS038',
          name: 'Cortador de Lona',
          description:
            'Buscamos cortador experimentado en lona y materiales resistentes.',
          specialty: ['corte-lona'],
          experience: '4+ años',
          photo: 'https://i.pravatar.cc/300?u=pos038def',
          typePayment: 'salario',
          city: 'cali',
          neighborhood: 'san antonio',
          phone: '+57 3323456789',
          statusPosition: 'activo',
        },
      ],
      typeUser: 'taller',
    },
    {
      id: 'TU004',
      average_score: 3.9,
      responsible: 'Mariana Torres',
      city: 'barranquilla',
      country: 'Colombia',
      neighborhood: 'riomar',
      experience: ['8 años en confección de ropa de playa'],
      machines: ['plana', 'zig-zag', 'maquina-20u'],
      name: 'Moda Playa Torres',
      phone: '+57 3334567890',
      photo: 'https://i.pravatar.cc/300?u=tu004mnop',
      specialty: ['costura-traje-de-baño'],
      comments: [
        {
          comment: 'Diseños modernos pero tiempos de entrega largos.',
          id_person: 'CMT059',
          score: 3.5,
        },
      ],
      status: 'ocupado',
      numberEmployees: 10,
      positions: [
        {
          id: 'POS039',
          name: 'Diseñador de Modas',
          description:
            'Se requiere diseñador con experiencia en ropa de playa.',
          specialty: ['costura-traje-de-baño'],
          experience: '3+ años',
          photo: 'https://i.pravatar.cc/300?u=pos039ghi',
          typePayment: 'contrato',
          city: 'barranquilla',
          neighborhood: 'riomar',
          phone: '+57 3334567890',
          statusPosition: 'activo',
        },
      ],
      typeUser: 'taller',
    },
    {
      id: 'TU005',
      average_score: 4.6,
      responsible: 'Santiago Gómez',
      city: 'pereira',
      country: 'Colombia',
      neighborhood: 'centro',
      experience: ['14 años en confección de ropa infantil'],
      machines: ['plana', 'fileteadora', 'collarin'],
      name: 'Infantiles Gómez',
      phone: '+57 3345678901',
      photo: 'https://i.pravatar.cc/300?u=tu005qrst',
      specialty: ['costura-ropa', 'patronaje-infantil'],
      comments: [
        {
          comment: 'Ropa infantil de excelente calidad.',
          id_person: 'CMT060',
          score: 4.5,
        },
        {
          comment: 'Diseños atractivos para niños.',
          id_person: 'CMT061',
          score: 4,
        },
      ],
      status: 'libre',
      numberEmployees: 15,
      positions: [
        {
          id: 'POS040',
          name: 'Costurera Infantil',
          description: 'Buscamos costurera especializada en ropa para niños.',
          specialty: ['costura-ropa'],
          experience: '2+ años',
          photo: 'https://i.pravatar.cc/300?u=pos040jkl',
          typePayment: 'destajo',
          city: 'pereira',
          neighborhood: 'centro',
          phone: '+57 3345678901',
          statusPosition: 'activo',
        },
      ],
      typeUser: 'taller',
    },
    {
      id: 'TU006',
      average_score: 4.0,
      responsible: 'Camilo Pérez',
      city: 'bucaramanga',
      country: 'Colombia',
      neighborhood: 'real de minas',
      experience: ['9 años en confección de uniformes escolares'],
      machines: ['plana', 'botonadora', 'presilladora'],
      name: 'Uniformes Pérez',
      phone: '+57 3356789012',
      photo: 'https://i.pravatar.cc/300?u=tu006uvwx',
      specialty: ['costura-camisas', 'costura-pantalones'],
      comments: [
        {
          comment: 'Uniformes de buena calidad pero entregas lentas.',
          id_person: 'CMT062',
          score: 4,
        },
      ],
      status: 'ocupado',
      numberEmployees: 12,
      positions: [
        {
          id: 'POS041',
          name: 'Operario de Botonadora',
          description: 'Se necesita operario con experiencia en botonadora.',
          specialty: ['costura-camisas'],
          experience: '2+ años',
          photo: 'https://i.pravatar.cc/300?u=pos041mno',
          typePayment: 'salario',
          city: 'bucaramanga',
          neighborhood: 'real de minas',
          phone: '+57 3356789012',
          statusPosition: 'activo',
        },
      ],
      typeUser: 'taller',
    },
    {
      id: 'TU007',
      average_score: 4.3,
      responsible: 'Natalia Díaz',
      city: 'cartagena',
      country: 'Colombia',
      neighborhood: 'crespo',
      experience: ['11 años en confección de ropa médica'],
      machines: ['plana', 'collarin', 'fileteadora'],
      name: 'Salud Textil Díaz',
      phone: '+57 3367890123',
      photo: 'https://i.pravatar.cc/300?u=tu007yzab',
      specialty: ['costura-ropa-medica'],
      comments: [
        {
          comment: 'Cumple con los estándares médicos.',
          id_person: 'CMT063',
          score: 4.5,
        },
      ],
      status: 'libre',
      numberEmployees: 20,
      positions: [
        {
          id: 'POS042',
          name: 'Inspector de Calidad',
          description:
            'Se busca inspector con experiencia en textiles médicos.',
          specialty: ['costura-ropa-medica'],
          experience: '5+ años',
          photo: 'https://i.pravatar.cc/300?u=pos042pqr',
          typePayment: 'salario',
          city: 'cartagena',
          neighborhood: 'crespo',
          phone: '+57 3367890123',
          statusPosition: 'activo',
        },
      ],
      typeUser: 'taller',
    },
    {
      id: 'TU008',
      average_score: 3.8,
      responsible: 'Esteban Moreno',
      city: 'cúcuta',
      country: 'Colombia',
      neighborhood: 'caobos',
      experience: ['6 años en reparación de máquinas de coser'],
      machines: [
        'arreglo-maquinas-industriales',
        'arreglo-maquinas-familiares',
      ],
      name: 'Técnicos Moreno',
      phone: '+57 3378901234',
      photo: 'https://i.pravatar.cc/300?u=tu008cdef',
      specialty: [
        'arreglo-maquinas-industriales',
        'arreglo-maquinas-familiares',
      ],
      comments: [
        {
          comment: 'Buen servicio pero podría ser más rápido.',
          id_person: 'CMT064',
          score: 3.5,
        },
      ],
      status: 'ocupado',
      numberEmployees: 5,
      positions: [
        {
          id: 'POS043',
          name: 'Técnico en Máquinas de Coser',
          description: 'Buscamos técnico para mantenimiento y reparación.',
          specialty: ['arreglo-maquinas-industriales'],
          experience: '3+ años',
          photo: 'https://i.pravatar.cc/300?u=pos043stu',
          typePayment: 'contrato',
          city: 'cúcuta',
          neighborhood: 'caobos',
          phone: '+57 3378901234',
          statusPosition: 'activo',
        },
      ],
      typeUser: 'taller',
    },
    {
      id: 'TU009',
      average_score: 4.6,
      responsible: 'Lucía Castillo',
      city: 'manizales',
      country: 'Colombia',
      neighborhood: 'palogrande',
      experience: ['13 años en confección de lencería'],
      machines: ['plana', 'zig-zag', 'maquina-20u'],
      name: 'Lencería Castillo',
      phone: '+57 3389012345',
      photo: 'https://i.pravatar.cc/300?u=tu009ghij',
      specialty: ['costura-lenceria', 'patronaje-lenceria'],
      comments: [
        {
          comment: 'Lencería de alta calidad y diseño.',
          id_person: 'CMT065',
          score: 4.5,
        },
        {
          comment: 'Excelente atención al cliente.',
          id_person: 'CMT066',
          score: 4,
        },
      ],
      status: 'libre',
      numberEmployees: 14,
      positions: [
        {
          id: 'POS044',
          name: 'Costurera de Lencería',
          description: 'Buscamos costurera con experiencia en lencería fina.',
          specialty: ['costura-lenceria'],
          experience: '3+ años',
          photo: 'https://i.pravatar.cc/300?u=pos044vwx',
          typePayment: 'destajo',
          city: 'manizales',
          neighborhood: 'palogrande',
          phone: '+57 3389012345',
          statusPosition: 'activo',
        },
      ],
      typeUser: 'taller',
    },
    {
      id: 'TU010',
      average_score: 4.3,
      responsible: 'Andrés Vargas',
      city: 'montería',
      country: 'Colombia',
      neighborhood: 'el recreo',
      experience: ['11 años en confección de disfraces y trajes típicos'],
      machines: ['plana', 'bordadora', 'zig-zag'],
      name: 'Disfraces Vargas',
      phone: '+57 3390123456',
      photo: 'https://i.pravatar.cc/300?u=tu010klmn',
      specialty: ['costura-disfraces'],
      comments: [
        {
          comment: 'Diseños espectaculares y atención personalizada.',
          id_person: 'CMT067',
          score: 4.5,
        },
      ],
      status: 'libre',
      numberEmployees: 16,
      positions: [
        {
          id: 'POS045',
          name: 'Diseñador de Disfraces',
          description: 'Se requiere diseñador creativo para trajes típicos.',
          specialty: ['costura-disfraces'],
          experience: '4+ años',
          photo: 'https://i.pravatar.cc/300?u=pos045opq',
          typePayment: 'contrato',
          city: 'montería',
          neighborhood: 'el recreo',
          phone: '+57 3390123456',
          statusPosition: 'activo',
        },
      ],
      typeUser: 'taller',
    },
  ];
  workerUser = [
    {
      id: 'WU001',
      average_score: 4.5,
      city: 'Bogotá',
      country: 'Colombia',
      experience: [
        '12 años en costura de articulos militares',
        '5 años en costura morrales',
      ],
      machines: ['plana', 'ribeteadora', 'triple-transporte'],
      name: 'Ómar Ortiz',
      phone: '+57 3107507397',
      photo:
        'https://firebasestorage.googleapis.com/v0/b/tu-chamba-cf127.appspot.com/o/userPhotos%2FWhatsApp%20Image%202024-10-30%20at%202.09.02%20PM.jpeg?alt=media&token=076a30f6-d697-4dca-ad83-30b51a7675a6',
      specialty: [
        'costura-articulos-militares',
        'costura-morrales',
        'corte-lona',
      ],
      comments: [
        {
          comment: 'Excelente en costura es un muchacho muy cumplido.',
          id_person: 'CMT100',
          score: 5,
        },
        {
          comment: 'Muy profesional y puntual.',
          id_person: 'CMT101',
          score: 4,
        },
      ],
      status: 'libre',
      gender: 'male',
      typeUser: 'trabajador',
    },
  ];
}
