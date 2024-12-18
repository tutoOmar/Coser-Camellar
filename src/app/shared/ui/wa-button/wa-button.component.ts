import { Component, EventEmitter, Input, Output } from '@angular/core';
import { WhatsAppService } from '../../data-access/whats-app.service';
import { AnalyticsService } from '../../data-access/analytics.service';

@Component({
  selector: 'app-wa-button',
  standalone: true,
  imports: [],
  templateUrl: './wa-button.component.html',
  styleUrl: './wa-button.component.scss',
})
export default class WaButtonComponent {
  // Recibe el número de teléfono como input
  @Input() phoneNumber: string | undefined = '';
  @Input() messageToSend: string =
    'Hola,te vi en Cociendo & Camellando, me gustaría hacer contacto contigo!!';
  // Emite una señal cuando el botón es presionado
  @Output() buttonClicked: EventEmitter<string> = new EventEmitter<string>();

  constructor(
    private whatsAppService: WhatsAppService,
    private analyticsService: AnalyticsService
  ) {}

  openWhatsApp() {
    this.analyticsService.logCustomEvent('go-to-WA', {
      phoneNumber: this.phoneNumber,
      message: this.messageToSend,
    });
    this.whatsAppService.openWhatsAppAction(
      this.phoneNumber,
      this.messageToSend
    );
  }
}
