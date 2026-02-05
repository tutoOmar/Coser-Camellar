import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NgxSonnerToaster } from 'ngx-sonner';
import { AuthStateService } from './shared/data-access/auth-state.service';
import { CommonModule } from '@angular/common';
import ModalFormComponent from './shared/ui/modal-form/modal-form.component';
import { RegisterUserService } from './shared/data-access/register-user.service';
import Swal from 'sweetalert2';
import { Meta, Title } from '@angular/platform-browser';
import RegisterModalComponent from './shared/ui/register-modal/register-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NgxSonnerToaster,
    CommonModule,
    ModalFormComponent,
    RegisterModalComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'Coser&Camellar';
  showModal: boolean = false;
  // Inyección servicios
  private services = inject(RegisterUserService);

  constructor(
    private meta: Meta,
    private title_: Title,
    private _router: Router
  ) {}

  ngOnInit() {
    this.startModalTimer();
    this.title_.setTitle(
      'Coser y Camellar - Encuentra Profesionales de Costura y Talleres'
    );
    this.meta.addTags([
      {
        name: 'description',
        content:
          'Explora nuestra plataforma y encuentra costureros, cortadores, rematadores y otros profesionales del área de confección.',
      },
      {
        name: 'keywords',
        content:
          'costureros, cortadores, rematadores, confección, talleres, satélites',
      },
      {
        property: 'og:title',
        content: 'Coser y Camellar - Profesionales de Costura y Talleres',
      },
      {
        property: 'og:description',
        content:
          'Encuentra y contacta trabajadores calificados en la industria de confección.',
      },
      {
        property: 'og:image',
        content: 'https://coserycamellar.netlify.app/assets/machine.png',
      },
      { property: 'og:url', content: 'https://coserycamellar.netlify.app/' },
    ]);
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
