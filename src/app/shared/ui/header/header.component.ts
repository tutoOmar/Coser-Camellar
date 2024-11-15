import {
  Component,
  ElementRef,
  HostListener,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthStateService } from '../../data-access/auth-state.service';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export default class HeaderComponent {
  // Estado de la aplicación
  public userState = toSignal(inject(AuthStateService).isAuthenticated$);
  // Estado del menú
  isMenuOpen = false;
  //
  @ViewChild('workersMenu', { static: false }) workersMenuElement!: ElementRef; // Referencia al elemento del menú
  @ViewChild('workersMenuButton', { static: false })
  workersMenuButtonmenuElement!: ElementRef; // Referencia al elemento del menú
  /**
   *
   */
  constructor() {}
  public _authState = inject(AuthStateService);
  private _router = inject(Router);
  /**
   *
   */
  async logOut() {
    await this._authState.logOut();
    this._router.navigate(['/auth/sign-in']);
  }
  /**
   *
   */
  goToSignUp() {
    this._router.navigate(['/auth/sign-up']);
  }
  /**
   *
   */
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
  /**
   *
   */
  closeMenu() {
    this.isMenuOpen = false;
  }
  // Escucha cualquier clic en el documento
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    // Verifica si el clic ocurrió fuera del menú
    if (
      this.isMenuOpen &&
      this.workersMenuButtonmenuElement &&
      this.workersMenuElement &&
      !this.workersMenuElement.nativeElement.contains(event.target) &&
      !this.workersMenuButtonmenuElement.nativeElement.contains(event.target)
    ) {
      this.closeMenu();
    }
  }

  goToRegister() {
    this._router.navigate(['/auth/sign-up']);
  }
}
