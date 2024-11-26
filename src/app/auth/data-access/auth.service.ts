import { inject, Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
} from '@angular/fire/auth';

export interface User {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  //
  private _auth = inject(Auth);
  /**
   *
   * @param user
   * @returns
   */
  signUp(user: User) {
    return createUserWithEmailAndPassword(
      this._auth,
      user.email,
      user.password
    );
  }
  /**
   *
   * @param user
   * @returns
   */
  signIn(user: User) {
    return signInWithEmailAndPassword(this._auth, user.email, user.password);
  }
  /**
   * Se inicia sesión con google
   * @returns una promesa
   */
  signWithGoogle() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return signInWithPopup(this._auth, provider);
  }
  /**
   * Se inicia sesión con google
   * @returns una promesa
   */
  signWithFacebook() {
    const provider = new FacebookAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return signInWithPopup(this._auth, provider);
  }
}
