// profile-client.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EmpresaUser } from '../../models/empresa.model';
import { NaturalPersonUser } from '../../models/natural-person.model';
import { Specialty } from '../../models/specialties.model';

@Component({
  selector: 'app-profile-client',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile-empresa-or-natural-person.component.html',
  styleUrl: './profile-empresa-or-natural-person.component.scss',
})
export class ProfileEmpresaOrNaturalPersonComponent {
  @Input() profileData: EmpresaUser | NaturalPersonUser | null = null;
  @Input() userType: 'empresa' | 'personal-natural' = 'personal-natural';

  @Output() searchWorkers = new EventEmitter<void>();
  @Output() searchTalleres = new EventEmitter<void>();
  @Output() editProfile = new EventEmitter<string>();

  private readonly DEFAULT_AVATAR =
    'https://firebasestorage.googleapis.com/v0/b/tu-chamba-cf127.appspot.com/o/avatarMan.png?alt=media&token=0df1900c-9055-4310-8fd9-6486c922bf50';

  getProfilePhoto(): string {
    return this.profileData?.photo || this.DEFAULT_AVATAR;
  }

  isEmpresa(): boolean {
    return this.userType === 'empresa';
  }

  getEmpresaData(): EmpresaUser | null {
    return this.isEmpresa() ? (this.profileData as EmpresaUser) : null;
  }

  getNaturalPersonData(): NaturalPersonUser | null {
    return !this.isEmpresa() ? (this.profileData as NaturalPersonUser) : null;
  }

  getLocation(): string {
    if (this.isEmpresa()) {
      const empresa = this.getEmpresaData();
      return `${empresa?.city}, ${empresa?.country}`;
    } else {
      const person = this.getNaturalPersonData();
      return `${person?.city}, ${person?.country}`;
    }
  }

  getNeighborhood(): string | undefined {
    if (this.isEmpresa()) {
      return this.getEmpresaData()?.neighborhood;
    } else {
      return this.getNaturalPersonData()?.neighborhood;
    }
  }

  getDescription(): string | undefined {
    if (this.isEmpresa()) {
      return undefined; // Las empresas no tienen descripción en el modelo
    } else {
      return this.getNaturalPersonData()?.description;
    }
  }

  formatSpecialties(specialties: Specialty[] | undefined): string {
    if (!specialties || specialties.length === 0) return '';
    return this.removeHyphens(specialties);
  }

  formatSearchType(searchType: any): string {
    if (!searchType) return '';

    const searchMap: { [key: string]: string } = {
      trabajadores: 'Trabajadores',
      talleres: 'Talleres',
      ambos: 'Trabajadores y Talleres',
    };

    return searchMap[searchType] || searchType;
  }

  canSearchWorkers(): boolean {
    if (!this.isEmpresa()) return false;
    const empresa = this.getEmpresaData();
    return empresa?.busca === 'trabajadores' || empresa?.busca === 'ambos';
  }

  canSearchTalleres(): boolean {
    if (!this.isEmpresa()) return false;
    const empresa = this.getEmpresaData();
    return empresa?.busca === 'talleres' || empresa?.busca === 'ambos';
  }

  onSearchWorkers(): void {
    this.searchWorkers.emit();
  }

  onSearchTalleres(): void {
    this.searchTalleres.emit();
  }

  onEditProfile(): void {
    if (this.profileData?.id) {
      this.editProfile.emit(this.profileData.id);
    }
  }
  /**Remueve guiónes de las palabras que normalmente las lleva*/
  removeHyphens(wordWithHyphens: string[] | undefined): string {
    if (wordWithHyphens) {
      const newMap = wordWithHyphens.map((specialty: String) => {
        const wordUpperCase =
          specialty[0].toUpperCase() + specialty.substring(1);
        return wordUpperCase.replace(/-/g, ' ');
      });
      const specialtiesComplete = newMap.join(', ');
      return specialtiesComplete;
    } else {
      return '';
    }
  }
}
