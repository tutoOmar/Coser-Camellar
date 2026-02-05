import { Component, output } from '@angular/core';

@Component({
  selector: 'app-facebook-button',
  standalone: true,
  imports: [],
  templateUrl: './facebook-button.component.html',
})
export class FacebookButtonComponent {
  onClick = output<void>();
}
