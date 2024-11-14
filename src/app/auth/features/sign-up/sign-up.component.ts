import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { hasEmailError, isRequired } from '../../utils/validators';
import { AuthService } from '../../data-access/auth.service';
import { toast } from 'ngx-sonner';
import { Router, RouterLink } from '@angular/router';
import { GoogleButtonComponent } from '../../ui/google-button/google-button.component';
import { AuthStateService } from '../../../shared/data-access/auth-state.service';
import { Subject, takeUntil } from 'rxjs';

interface FormSingUp {
  email: FormControl<string | null>;
  password: FormControl<string | null>;
}

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, GoogleButtonComponent],
  templateUrl: './sign-up.component.html',
  styles: ``,
})
export default class SignUpComponent implements OnInit {
  // subject para destruir el componente
  private destroy$ = new Subject<void>(); // Controlador de destrucción
  //
  private _formBuilder = inject(NonNullableFormBuilder);
  // Estado actual
  private authState = inject(AuthStateService);
  /**
   *
   * @param field
   * @returns
   */
  isRequired(field: 'email' | 'password') {
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
  constructor(private authService: AuthService, private router: Router) {}
  form = this._formBuilder.group<FormSingUp>({
    password: this._formBuilder.control('', Validators.required),
    email: this._formBuilder.control('', [
      Validators.required,
      Validators.email,
    ]),
  });
  /**
   * Inicialización del componente
   */
  ngOnInit(): void {
    this.authState.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        if (state) {
          this.router.navigate(['/auth/register']);
        }
      });
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
      this.router.navigate(['/auth/register']);
    } catch (error) {
      toast.error('ocurrio un error');
    }
  }
  /**
   *  funcion que se encarga de manejar eventos del registro con cuenta de google
   */
  async submitWithGoogle() {
    try {
      await this.authService.signWithGoogle();
      toast.success('Usuario creado Correctamente');
      this.router.navigate(['/auth/register']);
    } catch (error) {
      toast.error('ocurrio un error');
    }
  }
  // Método OnDestroy para completar el Subject cuando el componente se destruya
  ngOnDestroy(): void {
    this.destroy$.next(); // Emite un valor para finalizar las suscripciones
    this.destroy$.complete(); // Completa el Subject
  }
}
