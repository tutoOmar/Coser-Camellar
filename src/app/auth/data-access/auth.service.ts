import { inject, Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  UserCredential,
} from '@angular/fire/auth';

export interface User {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _auth = inject(Auth);
  private recaptchaVerifier?: RecaptchaVerifier;

  /**
   * Inicializa el reCAPTCHA para la autenticación por teléfono
   * @param buttonId ID del elemento donde se mostrará el reCAPTCHA
   */
  initRecaptcha(buttonId: string): Promise<number> {
    // Limpia el reCAPTCHA anterior si existe
    if (this.recaptchaVerifier) {
      this.clearRecaptcha();
    }

    this.recaptchaVerifier = new RecaptchaVerifier(this._auth, buttonId, {
      size: 'normal',
      callback: (response: any) => {
        console.log('reCAPTCHA resuelto');
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expirado');
        this.clearRecaptcha();
      },
    });

    // Renderiza explícitamente el reCAPTCHA
    return this.recaptchaVerifier.render();
  }

  /**
   * Registro de usuario con email y contraseña
   * @param user Datos del usuario
   * @returns Promise con el resultado
   */
  signUp(user: User): Promise<UserCredential> {
    return createUserWithEmailAndPassword(
      this._auth,
      user.email,
      user.password
    );
  }

  /**
   * Inicio de sesión con email y contraseña
   * @param user Datos del usuario
   * @returns Promise con el resultado
   */
  signIn(user: User): Promise<UserCredential> {
    return signInWithEmailAndPassword(this._auth, user.email, user.password);
  }

  /**
   * Inicio de sesión con Google
   * @returns Promise con el resultado
   */
  signInWithGoogle(): Promise<UserCredential> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return signInWithPopup(this._auth, provider);
  }

  /**
   * Inicio de sesión con Facebook
   * @returns Promise con el resultado
   */
  signInWithFacebook(): Promise<UserCredential> {
    const provider = new FacebookAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return signInWithPopup(this._auth, provider);
  }

  /**
   * Inicia el proceso de verificación por teléfono
   * @param phoneNumber Número de teléfono en formato internacional (+57...)
   * @returns Promise con el resultado
   */
  signInWithPhoneNumber(phoneNumber: string): Promise<any> {
    if (!this.recaptchaVerifier) {
      throw new Error(
        'reCAPTCHA no inicializado. Llama a initRecaptcha primero.'
      );
    }

    // Asegura que el número de teléfono incluya el prefijo de Colombia +57
    if (!phoneNumber.startsWith('+57')) {
      phoneNumber = '+57' + phoneNumber;
    }

    return signInWithPhoneNumber(
      this._auth,
      phoneNumber,
      this.recaptchaVerifier
    );
  }

  /**
   * Verifica el código enviado por SMS
   * @param confirmationResult Resultado de la confirmación del teléfono
   * @param verificationCode Código de verificación recibido por SMS
   * @returns Promise con el usuario autenticado
   */
  async verifyPhoneCode(
    confirmationResult: any,
    verificationCode: string
  ): Promise<UserCredential> {
    try {
      const result = await confirmationResult.confirm(verificationCode);
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Limpia el reCAPTCHA
   */
  clearRecaptcha(): void {
    this.recaptchaVerifier?.clear();
    this.recaptchaVerifier = undefined;
  }
}
