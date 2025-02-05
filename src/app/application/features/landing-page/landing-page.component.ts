import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import WaButtonComponent from '../../../shared/ui/wa-button/wa-button.component';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing-page.component.html',
})
export default class LandingPageComponent {
  whatsappNumber = '+573003323781';
  message =
    'Hola vi la página y quiero saber más sobre el servicio que ofrecen para conseguir personal en el sector de la confección, estoy buscando...';

  openWhatsApp() {
    window.open(
      `https://wa.me/${this.whatsappNumber}?text=${this.message}`,
      '_blank'
    );
  }
}
