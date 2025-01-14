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
  @Output() buttonClicked: EventEmitter<void> = new EventEmitter<void>();

  constructor(
    private whatsAppService: WhatsAppService,
    private analyticsService: AnalyticsService
  ) {}
  /**
   * Esta función abre WA para que el usuario se comunique
   */
  openWhatsApp() {
    //Emitimios el evento de clic
    this.buttonClicked.emit();
    // Se envian analiticas
    this.analyticsService.logCustomEvent('go-to-WA', {
      phoneNumber: this.phoneNumber,
      message: this.messageToSend,
    });
    // Se llama al service para abrir WA
    this.whatsAppService.openWhatsAppAction(
      this.phoneNumber,
      this.messageToSend
    );
  }
}
