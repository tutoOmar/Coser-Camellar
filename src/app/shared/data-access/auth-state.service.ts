import { inject, Injectable } from '@angular/core';
import { Auth, authState, getAuth, signOut } from '@angular/fire/auth';
import { map, Observable, shareReplay } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthStateService {
  //
  private _auth = inject(Auth);
  // Observable de autenticaicón
  get authState$(): Observable<any> {
    return authState(this._auth).pipe(shareReplay(1));
  }
  // Observable que emite true si el usuario está autenticado y false si no lo está
  get isAuthenticated$(): Observable<boolean> {
    return this.authState$.pipe(
      map((user) => !!user) // Convertir el estado de autenticación en un booleano
    );
  }
  // Obtener el usuario actual
  get currentUser() {
    return getAuth().currentUser;
  }

  // Cierra sesión
  logOut() {
    return signOut(this._auth);
  }
}
