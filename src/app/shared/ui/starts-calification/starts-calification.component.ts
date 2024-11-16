import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-starts-calification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './starts-calification.component.html',
})
export default class StartsCalificationComponent {
  @Input() rating: number = 0;
  stars: number[] = [1, 2, 3, 4, 5];
}
