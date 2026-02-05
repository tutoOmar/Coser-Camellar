import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing-page.component.html',
  styles: [
    `
      .animate {
        opacity: 0;
        transition: all 1s ease-out;
      }

      .slide-left {
        transform: translateX(-100px);
      }

      .slide-right {
        transform: translateX(100px);
      }

      .slide-up {
        transform: translateY(100px);
      }

      .slide-down {
        transform: translateY(-100px);
      }

      .show {
        opacity: 1;
        transform: translateX(0) translateY(0);
      }

      .delay-200 {
        transition-delay: 200ms;
      }

      .delay-400 {
        transition-delay: 400ms;
      }
    `,
  ],
})
export default class LandingPageComponent implements OnInit {
  @ViewChild('mainContainer', { static: true }) mainContainer!: ElementRef;

  ngOnInit() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('show');
          }
        });
      },
      { threshold: 0.1 }
    );

    if (this.mainContainer) {
      const animatedElements =
        this.mainContainer.nativeElement.querySelectorAll('.animate');
      animatedElements.forEach((element: Element) => {
        observer.observe(element);
      });
    }
  }
  whatsappNumber = '+573003323781';
  openWhatsApp(message: string) {
    window.open(
      `https://wa.me/${this.whatsappNumber}?text=${message}`,
      '_blank'
    );
  }
}
function inject(ElementRef: any) {
  throw new Error('Function not implemented.');
}
