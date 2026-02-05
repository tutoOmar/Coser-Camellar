import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  EventEmitter,
  inject,
  OnInit,
  Output,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { RegisterUserService } from '../../data-access/register-user.service';
import { AnalyticsService } from '../../data-access/analytics.service';
import { toast } from 'ngx-sonner';
import Swal from 'sweetalert2';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-modal-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './modal-form.component.html',
  styleUrl: './modal-form.component.scss',
})
export default class ModalFormComponent implements AfterViewInit {
  // Control destrucción del componente
  private destroy$: Subject<void> = new Subject<void>();
  private service = inject(RegisterUserService);
  private analyticsService = inject(AnalyticsService);

  name: string = '';
  phone: string = '';
  comment: string = '';

  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<{
    name: string;
    phone: string;
    comment: string;
  }>();
  /**
   *
   */
  ngAfterViewInit() {
    this.analyticsService.logCustomEvent('openModal', {});
  }
  closeModal() {
    this.close.emit();
  }

  submitForm() {
    if (this.name && this.phone) {
      this.service
        .sendCommentsUsers({
          name: this.name,
          phone: this.phone,
          comment: this.comment,
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            toast.success('Comentario enviado con éxito:');
            this.analyticsService.logCustomEvent('comment-app-sent', {
              name: this.name,
              phone: this.phone,
              comment: this.comment,
            });
          },
          error: (err) => {
            toast.error('Error al enviar los datos:', err);
            // Opcional: maneja el error (e.g., muestra un mensaje al usuario)
          },
          complete: () => {
            this.submit.emit({
              name: this.name,
              phone: this.phone,
              comment: this.comment,
            });
          },
        });
    }
  }

  /**
   *
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
