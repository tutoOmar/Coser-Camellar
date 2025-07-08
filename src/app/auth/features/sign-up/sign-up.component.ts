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
import {
  catchError,
  EMPTY,
  filter,
  from,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { FacebookButtonComponent } from '../../ui/facebook-button/facebook-button.component';
import { AnalyticsService } from '../../../shared/data-access/analytics.service';
import { CommonModule } from '@angular/common';
import { RegisterUserService } from '../../../shared/data-access/register-user.service';
import Swal from 'sweetalert2';
import { WorksService } from '../../../works/services/works.service';
import { TypeUser } from '../../../works/features/models/type-user.model';
import { UsersService } from '../../../shared/data-access/users.service';
interface FormSingUp {
  email: FormControl<string | null>;
  password: FormControl<string | null>;
  phone: FormControl<number | null>;
  name: FormControl<string | null>;
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
  private registerService = inject(RegisterUserService);
  private usersService = inject(UsersService);
  /** --------------------- */
  authMethod: 'email' | 'phone' = 'email';
  codeSent = false;
  private recaptchaInitialized = false;
  // Nuevo FormGroup para teléfono
  phoneForm = this._formBuilder.group({
    phone: ['', [Validators.required, Validators.pattern(/^\+[1-9]\d{1,14}$/)]],
    verificationCode: [''],
  });

  private flagPhoneValidation: boolean = false;

  @ViewChild('phoneSignIn') phoneSignInButton!: ElementRef;
  private confirmationResult: any;
  /**
   *
   * @param field
   * @returns
   */
  isRequired(field: 'email' | 'password' | 'phone' | 'name') {
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
    phone: this._formBuilder.control(null, [Validators.required]), // Valor inicial como null
    name: this._formBuilder.control('', [
      Validators.required,
      Validators.minLength(2),
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
        if (state && this.flagPhoneValidation) {
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

    // Obtenemos el formulario
    const { email, password, phone, name } = this.form.value;

    // Validamos que venga algo
    if (!email || !password || phone === null || !name) return;

    try {
      // Creamos el usuario en Firebase Auth
      const userCredential = await this.authService.signUp({
        password: password,
        email: email,
      });

      // Obtenemos el UID del usuario recién creado
      const uid = userCredential.user?.uid;

      if (!uid) {
        toast.error('Error de registro');
      }
      // Creamos el documento en Firestore con el UID
      await this.registerService
        .createUserWithNameAndPhoneNoProfile({
          userId: uid,
          phone,
          name,
          typeUSer: TypeUser.NO_PROFILE, // Corregí el typo 'typeUSer'
        })
        .toPromise(); // Cambiamos a toPromise() para manejar mejor los errores

      toast.success('Usuario creado correctamente');
      this.router.navigate(['/works']);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Correo ya existe, inicia sesión');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Contraseña débil, intenta con una contraseña más fuerte');
      } else {
        toast.error('Error al crear el usuario. Intenta nuevamente.');
      }
    }
  }
  /**
   *
   * @returns
   */
  async submitWithGoogle() {
    try {
      const userCredential = await this.authService.signInWithGoogle();
      const email = userCredential.user?.email;
      const userId = userCredential.user?.uid;
      //** Validamos que sí haya un correo y userId */
      if (!email && userId) {
        toast.error('No se pudo obtener el correo del usuario');
        return;
      }

      this.usersService
        //Esta primera validación es para saber si el usuario no tiene perfil
        .checkUserHaveProfile()
        .pipe(
          takeUntil(this.destroy$),
          tap((isRegisterProfile) => {
            // SI es true significa que ya tiene perfil solo que inicia sesión desde registro
            // Es un feature que no podemos evitar
            if (isRegisterProfile) {
              this.router.navigate(['/works']);
              toast.success('Bievenido(a) de nuevo');
            }
          }),
          filter((isRegisterProfile) => !isRegisterProfile),
          switchMap(() => from(this.askForPhoneAndName())), // Llama al modal para pedir nombre y teléfono
          filter(
            (userInfo) => !!userInfo && !!userInfo.name && !!userInfo.phone
          ), // Asegura que se hayan proporcionado ambos datos
          switchMap((userInfo) =>
            this.registerService.createUserWithNameAndPhoneNoProfile({
              name: userInfo?.name, ///////////////////////////////Revisar este compoente
              phone: userInfo?.phone,
              typeUSer: TypeUser.NO_PROFILE,
              userId,
            })
          ),
          tap(() => {
            this.flagPhoneValidation = true;
            toast.success('Teléfono registrado correctamente');
            this.router.navigate(['/works']);
          }),
          catchError((error) => {
            toast.error('Hubo un error al registrar tus datos');
            this.handleError(error);
            return EMPTY; // Manejo de errores para evitar que el flujo RxJS se rompa
          })
        )
        .subscribe();
    } catch (error: any) {
      toast.error('Hubo un error al registrar tus datos');
      this.handleError(error);
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
  /**
   * Modal secuencial para obtener nombre y teléfono
   * @returns Promise con objeto que contiene name y phone
   */
  private async askForPhoneAndName(): Promise<{
    name: string;
    phone: string;
  } | null> {
    // Primer modal: Nombre
    const { value: name } = await Swal.fire({
      title: 'Nombre completo',
      text: 'Por favor, ingresa tu nombre completo',
      input: 'text',
      inputPlaceholder: 'Juan Pérez',
      inputValidator: (value) => {
        if (!value || value.trim().length < 2) {
          return 'El nombre debe tener al menos 2 caracteres';
        }
        return undefined;
      },
      allowOutsideClick: false,
      allowEscapeKey: false,
      confirmButtonText: 'Siguiente',
    });

    if (!name) return null;

    // Segundo modal: Teléfono
    const { value: phone } = await Swal.fire({
      title: 'Número de teléfono',
      text: 'Por favor, ingresa tu número de teléfono',
      input: 'tel',
      inputPlaceholder: '3001234567',
      inputValidator: this.validatePhoneNumber.bind(this),
      allowOutsideClick: false,
      allowEscapeKey: false,
      confirmButtonText: 'Guardar',
      showCancelButton: true,
      cancelButtonText: 'Volver',
    });

    if (!phone) {
      // Si cancela, volver a pedir el nombre
      return this.askForPhoneAndName();
    }

    return { name: name.trim(), phone: phone.trim() };
  }
  /**
   * Validación del numero de telfono en el modal
   * @param value
   * @returns
   */
  private validatePhoneNumber(value: string): string | null {
    if (!value.trim()) {
      return 'Por favor, ingresa un número de teléfono';
    }
    return null;
  }
  /**
   *
   */
  private handleError(error: any): void {
    if (error.code === 'auth/account-exists-with-different-credential') {
      toast.error('Ya existe una cuenta con esta cuenta de Facebook');
    } else {
      toast.error('Ocurrió un error inesperado');
    }
    console.error('Error:', error); // Mantén un registro detallado del error
  }

  // Método OnDestroy para completar el Subject cuando el componente se destruya
  ngOnDestroy(): void {
    this.destroy$.next(); // Emite un valor para finalizar las suscripciones
    this.destroy$.complete(); // Completa el Subject
  }
}
