import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AnalyticsService } from '../../data-access/analytics.service';
import { WhatsAppService } from '../../data-access/whats-app.service';
import { CallService } from '../../data-access/call.service';

@Component({
  selector: 'app-call-button',
  standalone: true,
  imports: [],
  templateUrl: './call-button.component.html',
})
export class CallButtonComponent {
  // Recibe el número de teléfono como input
  @Input() phoneNumber: string | undefined = '';
  // Emite una señal cuando el botón es presionado
  @Output() buttonClicked: EventEmitter<void> = new EventEmitter<void>();

  constructor(
    private callService: CallService,
    private analyticsService: AnalyticsService
  ) {}
  /**
   * Esta función abre WA para que el usuario se comunique
   */
  initiateCall() {
    //Emitimios el evento de clic
    this.buttonClicked.emit();
    // Se envian analiticas
    this.analyticsService.logCustomEvent('call-to-this-number', {
      phoneNumber: this.phoneNumber,
    });
    // Se llama al service para abrir WA
    this.callService.initiateCallAction(this.phoneNumber);
  }
}
