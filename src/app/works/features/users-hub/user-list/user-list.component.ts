import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import CardCalificationComponent from '../../../../shared/ui/card-calification/card-calification.component';
import { CardEmpresaComponent } from '../../../../shared/ui/card-empresa/card-empresa.component';
import CardSateliteComponent from '../../../../shared/ui/card-satelite/card-satelite.component';
import { Router } from '@angular/router';
import { CardNaturalPersonComponent } from '../../../../shared/ui/card-natural-person/card-natural-person.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    CardCalificationComponent,
    CardEmpresaComponent,
    CardEmpresaComponent,
    CardSateliteComponent,
    CardNaturalPersonComponent,
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent {
  @Input() users: any[] = [];
  @Input() userType: string = '';

  private _router = inject(Router);
  /***
   * Funcion que lleva al perfil de la persona para ver toda su info
   */
  onUserSelected(userId: string | undefined) {
    this._router.navigate(['/works/worker', userId]);
  }
}
