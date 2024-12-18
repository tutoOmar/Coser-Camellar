import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NgxSonnerToaster } from 'ngx-sonner';
import { AuthStateService } from './shared/data-access/auth-state.service';
import { CommonModule } from '@angular/common';
import ModalFormComponent from './shared/ui/modal-form/modal-form.component';
import { RegisterUserService } from './shared/data-access/register-user.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgxSonnerToaster, CommonModule, ModalFormComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'Coser&Camellar';
  showModal: boolean = false;
  // Inyección servicios
  private services = inject(RegisterUserService);

  ngOnInit() {
    this.startModalTimer();
  }

  startModalTimer() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const modalShown = localStorage.getItem('modalShown');
      if (!modalShown) {
        setTimeout(() => {
          this.showModal = true;
          localStorage.setItem('modalShown', 'true');
        }, 30000); // 30 segundos
      }
    }
  }

  closeModal() {
    this.showModal = false;
  }

  handleFormSubmit(data: { name: string; phone: string; comment: string }) {
    this.showModal = false;
    Swal.fire({
      title: 'Gracias por tu comentario',
      text: 'Es muy valioso para nosotros y para el sector de la confección y queremos aportar a esta profesión tan bonita',
      icon: 'success',
      confirmButtonText: 'Aceptar',
    });
    // Aquí puedes enviar los datos al backend
  }
}
