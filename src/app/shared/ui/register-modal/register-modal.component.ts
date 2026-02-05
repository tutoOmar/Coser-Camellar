import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  EventEmitter,
  inject,
  OnDestroy,
  Output,
} from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { AnalyticsService } from '../../data-access/analytics.service';

@Component({
  selector: 'app-register-modal',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './register-modal.component.html',
  styleUrl: './register-modal.component.scss',
})
export default class RegisterModalComponent
  implements AfterViewInit, OnDestroy
{
  private destroy$: Subject<void> = new Subject<void>();
  private analyticsService = inject(AnalyticsService);
  private router = inject(Router);

  @Output() close = new EventEmitter<void>();

  ngAfterViewInit() {
    this.analyticsService.logCustomEvent('openRegisterModal', {});
  }

  closeModal() {
    this.analyticsService.logCustomEvent('dismissRegisterModal', {});
    this.close.emit();
  }

  goToRegister() {
    this.analyticsService.logCustomEvent('clickRegister', {
      source: 'registerModal',
    });

    // Cierra el modal antes de navegar
    this.close.emit();

    // Navega a la página de registro
    this.router.navigate(['/auth/sign-up']);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
