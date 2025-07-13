import { inject, Injectable, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Firestore,
  collection,
  collectionData,
  updateDoc,
  doc,
  query,
  where,
  getDocs,
} from '@angular/fire/firestore';
import { Storage } from '@angular/fire/storage';
import {
  BehaviorSubject,
  catchError,
  filter,
  from,
  map,
  Observable,
  of,
  switchMap,
  take,
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

const PATH = 'users';
type AppUser =
  | EmpresaUser
  | NaturalPersonUser
  | SateliteUser
  | WorkerUser
  | TallerUSer
  | NoProfileUser;
@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private newsSignal = signal<any[]>([]);
  private sateliteSignal = signal<any[]>([]);
  flag = true;

  constructor(private storage: Storage) {}
  /** Inyeccioes de servicios y dependencias */
  private _auth = inject(AuthStateService);
  private firestore = inject(Firestore);
  private _imageService = inject(UploadImagesService);
  /** Funciones  */
  private allUsers: any[] = [];
  private allUsersSubject = new BehaviorSubject<any[]>([]);
  public allUsers$ = this.allUsersSubject.asObservable();
  private isLoading = false;
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
    const collectionName = PATH;
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
  /** ==========================================================
   * Métodos para obtener a todos los usuarios en el PATH 'users'
    ===========================================================*/
  /**
   * Método que trae todo los usuarios en "users"
   * @returns
   */
  getAllUsersInDB(): Observable<any> {
    // Si ya tenemos datos, retornar inmediatamente
    if (this.allUsers.length > 0) {
      return of(this.allUsers);
    }

    // Si ya estamos cargando, retornar el observable
    if (this.isLoading) {
      return this.allUsers$.pipe(
        filter((users) => users.length > 0),
        take(1)
      );
    }

    // Cargar datos por primera vez
    this.isLoading = true;
    const _collection = collection(this.firestore, PATH);

    return from(getDocs(_collection)).pipe(
      map((snapshot) => {
        const users = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Guardar en cache
        this.allUsers = users;
        this.allUsersSubject.next(users);
        this.isLoading = false;

        return users;
      }),
      catchError((error) => {
        this.isLoading = false;
        return of();
      })
    );
  }
  /**
   * Métodos para obtener a todos los usuarios en el PATH 'users' excepto los que no tengan perfil
   */
  getAllUsersExceptNoProfileUsers(): Observable<any> {
    const _collection = collection(this.firestore, PATH);
    const userQuery = query(
      _collection,
      where('typeUSer', '==', TypeUser.NO_PROFILE)
    );
    return from(getDocs(userQuery));
  }
  /**
   * Esta función busca en la lista que está en el store por criterios que vienen en una frase
   * @param filter Palabra para filtrar
   */
  searchUsers(filter: string, typeUser: string): Observable<any> {
    if (this.allUsers.length > 0) {
      const normalizeText = this.removeAccentMarks(filter);
      const keyWords = normalizeText.toLowerCase().split(' ');
      return from(
        this.allUsers.filter(
          (
            user:
              | EmpresaUser
              | NaturalPersonUser
              | SateliteUser
              | TallerUSer
              | WorkerUser
          ) => {
            let machines: any = [];
            let specialties: any = [];
            let responsible: any = '';
            const city: any = this.removeAccentMarks(
              (user.city || '').toLowerCase()
            );
            const country: any = this.removeAccentMarks(
              (user.city || '').toLowerCase()
            );
            const name: any = this.removeAccentMarks(
              (user.name || '').toLowerCase()
            );
            if (
              user.typeUSer === TypeUser.TRABAJADOR ||
              user.typeUSer === TypeUser.TALLER ||
              user.typeUSer === TypeUser.SATELITE
            ) {
              specialties = (user.specialty || []).map((specialty) =>
                this.removeAccentMarks(specialty.toLocaleLowerCase())
              );
              machines = (user.machines || []).map((machine) =>
                this.removeAccentMarks(machine.toLocaleLowerCase())
              );
            }
            if (
              user.typeUSer === TypeUser.TALLER ||
              user.typeUSer === TypeUser.SATELITE
            ) {
              responsible = this.removeAccentMarks(
                (user.responsible || '').toLowerCase()
              );
            }
            if (user.typeUSer === TypeUser.EMPRESA) {
              responsible = this.removeAccentMarks(
                (user.responsable || '').toLowerCase()
              );
            }
            return keyWords.every(
              (keyWord) =>
                (machines.some((machine: any) => machine.includes(keyWord)) ||
                  specialties.some((specialty: any) =>
                    specialty.includes(keyWord)
                  ) ||
                  responsible.includes(keyWord) ||
                  city.includes(keyWord) ||
                  country.includes(keyWord) ||
                  name.includes(keyWord)) &&
                user.typeUSer === typeUser
            );
          }
        )
      );
    } else {
      return of([]);
    }
  }
  getUsersByType(typeUser: string): Observable<any> {
    return this.getAllUsersInDB().pipe(
      map((users) =>
        users.filter(
          (
            user:
              | EmpresaUser
              | NaturalPersonUser
              | SateliteUser
              | TallerUSer
              | WorkerUser
              | NoProfileUser
          ) => user.typeUSer === typeUser
        )
      )
    );
  }
  /**
   * Quita las tildes, es importante para la busqueda
   */
  removeAccentMarks(text: string): string {
    const accentsMap: { [key: string]: string } = {
      á: 'a',
      é: 'e',
      í: 'i',
      ó: 'o',
      ú: 'u',
      Á: 'A',
      É: 'E',
      Í: 'I',
      Ó: 'O',
      Ú: 'U',
      ñ: 'n',
      Ñ: 'N',
      ü: 'u',
      Ü: 'U',
    };

    return text.replace(/[^A-Za-z0-9 ]/g, (char) => accentsMap[char] || char);
  }
  /**
   * Método para forzar recarga de datos
   */
  refreshUsers(): Observable<any[]> {
    this.allUsers = [];
    this.allUsersSubject.next([]);
    return this.getAllUsersInDB();
  }
  /**
   * Métodos para actulizar a los usuarios en users
   */

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
  /**
   * Método para añdir comentarios a los usuarios
   * @param collectionSelected Deberia ser 'users'
   * @param user 'El usuario en cuestion '
   * @param idUser 'Id de la persona a la que le hicieron el comentario'
   * @returns
   */
  addComment(
    collectionSelected: string = PATH,
    user: WorkerUser | TallerUSer | SateliteUser,
    idUser: string
  ): Observable<any> {
    const _collection = collection(this.firestore, collectionSelected);
    const docRef = doc(_collection, idUser);
    return from(updateDoc(docRef, { ...user }));
  }
  /**
   * Obtiene la cantidad de usuarios por tipo de usuario
   */
  getCountUserByType(userType: string) {
    return this.allUsers.filter((user) => user.typeUSer === userType).length;
  }
}
