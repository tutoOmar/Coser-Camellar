import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  hasEmailError,
  isRequired,
  hasMinLength,
} from '../../utils/validators';
import { AuthService } from '../../data-access/auth.service';
import { toast } from 'ngx-sonner';
import { Router, RouterLink } from '@angular/router';
import { GoogleButtonComponent } from '../../ui/google-button/google-button.component';
import { AuthStateService } from '../../../shared/data-access/auth-state.service';
import { Subject, takeUntil } from 'rxjs';
import { FacebookButtonComponent } from '../../ui/facebook-button/facebook-button.component';
import { AnalyticsService } from '../../../shared/data-access/analytics.service';
import { CommonModule } from '@angular/common';

interface FormSingUp {
  email: FormControl<string | null>;
  password: FormControl<string | null>;
}

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    GoogleButtonComponent,
    FacebookButtonComponent,
  ],
  templateUrl: './sign-up.component.html',
  styles: ``,
})
export default class SignUpComponent implements OnInit, AfterViewInit {
  // subject para destruir el componente
  private destroy$ = new Subject<void>(); // Controlador de destrucción
  //
  private _formBuilder = inject(NonNullableFormBuilder);
  // Estado actual
  private authState = inject(AuthStateService);
  private analyticsService = inject(AnalyticsService);
  authMethod: 'email' | 'phone' = 'email';
  codeSent = false;
  private recaptchaInitialized = false;
  // Nuevo FormGroup para teléfono
  phoneForm = this._formBuilder.group({
    phone: ['', [Validators.required, Validators.pattern(/^\+[1-9]\d{1,14}$/)]],
    verificationCode: [''],
  });

  @ViewChild('phoneSignIn') phoneSignInButton!: ElementRef;
  private confirmationResult: any;
  /**
   *
   * @param field
   * @returns
   */
  isRequired(field: 'email' | 'password' | 'phone') {
    return isRequired(field, this.form);
  }
  /**
   *
   */
  isEmailValid() {
    return hasEmailError(this.form);
  }
  /**
   *
   */
  isMinLength() {
    return hasMinLength('password', this.form);
  }
  /**
   *
   */
  constructor(private authService: AuthService, private router: Router) {}
  form = this._formBuilder.group<FormSingUp>({
    password: this._formBuilder.control('', Validators.required),
    email: this._formBuilder.control('', [
      Validators.required,
      Validators.email,
      Validators.minLength(6),
    ]),
  });
  /**
   * Inicialización del componente
   */
  ngOnInit(): void {
    //Se comenta mientrás se implementa la opción de Telefono
    // this.initRecaptcha();
    this.authState.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        if (state) {
          this.router.navigate(['/works']);
        }
      });
  }
  /**
   *
   */
  ngAfterViewInit() {
    this.analyticsService.logPageVisit('sign-up');
    // Garantiza que el reCAPTCHA esté visible después de renderizar el DOM
    //Se comenta mientrás se implementa la opción de Telefonos
    // if (!this.recaptchaInitialized) {
    //   this.initRecaptcha();
    // }
  }
  /**
   * Seleccionamos el metodo de registro
   * @param method
   */
  setAuthMethod(method: 'email' | 'phone') {
    this.authMethod = method;
    if (method === 'phone') {
      this.authService.initRecaptcha('phoneSignIn');
    }
  }

  /**
   * funcion que se encarga de manejar eventos del submit
   * @returns
   */
  async submit() {
    // Validación del formulario
    if (this.form.invalid) return;
    //Obtenemos el formulario
    const { email, password } = this.form.value;
    //validamos que venga algo
    try {
      if (!email || !password) return;
      await this.authService.signUp({
        password: password,
        email: email,
      });
      toast.success('usuario creado Correctamente');
      this.router.navigate(['/works']);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Correo ya existe, inicia sesión');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Contraseña debil, intenta con una contraseña más fuerte');
      }
    }
  }
  /**
   *  funcion que se encarga de manejar eventos del registro con cuenta de google
   */
  async submitWithGoogle() {
    try {
      await this.authService.signInWithGoogle();
      toast.success('Usuario creado Correctamente');
      this.router.navigate(['/works']);
    } catch (error: any) {
      if (error.code === 'auth/account-exists-with-different-credential') {
        toast.error('Ya existe una cuenta con esta cuenta de Facebook');
      } else {
        toast.error('ocurrio un error');
      }
    }
  }
  /**
   *  funcion que se encarga de manejar eventos del inicio de sesión con cuenta de facebook
   */
  async submitWithFacebook() {
    try {
      await this.authService.signInWithFacebook();
      toast.success('Inicio de sesión exitosa');
      this.router.navigate(['/works']);
    } catch (error) {
      toast.error('ocurrio un error');
    }
  }
  /**
   * Funcion para registrarse con el celular
   */
  async submitPhone() {
    if (!this.codeSent) {
      // Enviar código
      try {
        const phone = this.phoneForm.get('phone')?.value;
        if (phone) {
          this.confirmationResult =
            await this.authService.signInWithPhoneNumber(phone);
          this.codeSent = true;
        }
      } catch (error) {
        console.error('Error al enviar código:', error);
      }
    } else {
      // Verificar código
      try {
        const code = this.phoneForm.get('verificationCode')?.value;
        if (code) {
          await this.authService.verifyPhoneCode(this.confirmationResult, code);
          // Redirigir o hacer lo necesario después del registro exitoso
        }
      } catch (error) {
        console.error('Error al verificar código:', error);
      }
    }
  }
  /**
   * Inicializa el reCAPTCHA
   */
  private initRecaptcha(): void {
    if (!this.recaptchaInitialized) {
      this.authService.initRecaptcha('phoneSignIn');
      this.recaptchaInitialized = true;
    }
  }
  // Método OnDestroy para completar el Subject cuando el componente se destruya
  ngOnDestroy(): void {
    this.destroy$.next(); // Emite un valor para finalizar las suscripciones
    this.destroy$.complete(); // Completa el Subject
  }
}
