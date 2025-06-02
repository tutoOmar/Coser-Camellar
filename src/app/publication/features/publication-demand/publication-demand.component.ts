import { Component, HostListener } from '@angular/core';
import { PublicationCardComponent } from '../publication-card/publication-card.component';
import { CommonModule } from '@angular/common';
import { Publication } from '../../models/publication.model';
import { Subject, takeUntil, finalize } from 'rxjs';
import { PublicationDemandService } from '../../services/publication-demand.services';
import { TypeUser } from '../../../works/features/models/type-user.model';
interface Publicacion {
  id: string;
  description: string;
  images: string[]; // máx 5 URLs
  autorId: string;
  timestamp: Date;
  number: string;
  city: string; // obligatorio
  neighborhood: string; // obligatorio
  typeContact: string;
  state: string;
  limiteContactos?: number; // p. ej., 5 semanales
  contacts: number;
}
@Component({
  selector: 'app-publication-demand',
  standalone: true,
  imports: [CommonModule, PublicationCardComponent],
  templateUrl: './publication-demand.component.html',
  styleUrl: './publication-demand.component.scss',
})
export default class PublicationDemandComponent {
  publicaciones: Publication[] = [
    {
      id: '1',
      description: 'Buscamos costurera con experiencia en licra y overlock.',
      images: ['https://picsum.photos/200/300'],
      autorId: 'u123',
      autorType: TypeUser.TRABAJADOR,
      timestamp: new Date().toString(),
      number: '3001112233',
      typeContact: 'whatsapp',
      city: 'Medellín',
      neighborhood: 'Belén',
      state: 'activa',
      limiteContactos: 2,
      contacts: 1,
      autor: {
        name: 'Juan',
        imageAvatarUrl: 'https://picsum.photos/150/210',
      },
    },
    {
      id: '2',
      description: 'Trabajo externo con material enviado por nosotros.',
      images: [
        'https://picsum.photos/200/300',
        'https://picsum.photos/210/340',
      ],
      autorId: 'u123',
      autorType: TypeUser.TRABAJADOR,
      timestamp: new Date().toString(),
      number: '3001112233',
      typeContact: 'whatsapp',
      city: 'Calí',
      neighborhood: 'Belén',
      state: 'activa',
      limiteContactos: 2,
      contacts: 2,
      autor: {
        name: 'Lau',
        imageAvatarUrl: 'https://picsum.photos/100/150',
      },
    },
    {
      id: '3',
      description: 'Trabajo en taller con contrato fijo.',
      images: [],
      autorId: 'u123',
      autorType: TypeUser.TRABAJADOR,

      timestamp: new Date().toString(),
      number: '3001112233',
      typeContact: 'whatsapp',
      city: 'Bogotá',
      neighborhood: 'Belén',
      state: 'activa',
      limiteContactos: 2,
      contacts: 12,
      autor: {
        name: 'Mary',
        imageAvatarUrl: 'https://picsum.photos/210/340',
      },
    },
  ];
  publications: Publication[] = [];
  loading = false;
  initialLoading = true;
  hasMore = true;
  private destroy$ = new Subject<void>();

  constructor(private publicationService: PublicationDemandService) {}

  ngOnInit(): void {
    this.loadInitialPublications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Detectar scroll para cargar más contenido
  @HostListener('window:scroll', ['$event'])
  onScroll(): void {
    // Verificar si estamos cerca del final de la página
    const threshold = 100;
    const position = window.pageYOffset + window.innerHeight;
    const height = document.documentElement.scrollHeight;

    if (position > height - threshold && !this.loading && this.hasMore) {
      this.loadMorePublications();
    }
  }

  private loadInitialPublications(): void {
    this.initialLoading = true;
    this.loading = true;
    this.publications = [];

    this.publicationService
      .getInitialPublications()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
          this.initialLoading = false;
        })
      )
      .subscribe({
        next: (publications) => {
          this.publications = publications;
          console.log(publications);
          this.hasMore = publications.length === 10; // Si trajo menos de 10, no hay más
        },
        error: (error) => {
          console.error('Error al cargar publicaciones:', error);
          this.hasMore = false;
        },
      });
  }

  private loadMorePublications(): void {
    if (!this.publicationService.hasMorePublications()) {
      this.hasMore = false;
      return;
    }

    this.loading = true;

    this.publicationService
      .getMorePublications()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: (newPublications) => {
          if (newPublications.length > 0) {
            this.publications = [...this.publications, ...newPublications];
            this.hasMore = newPublications.length === 10; // Si trajo menos de 10, no hay más
          } else {
            this.hasMore = false;
          }
        },
        error: (error) => {
          console.error('Error al cargar más publicaciones:', error);
          this.hasMore = false;
        },
      });
  }

  // Método público para refrescar las publicaciones
  refreshPublications(): void {
    this.publicationService.resetPagination();
    this.hasMore = true;
    this.loadInitialPublications();
  }

  /**
   * Testeo para publicaicones
   */
  testPost = [
    {
      description:
        'Ofrezco servicio de fileteado industrial, experiencia en prendas deportivas.',
      images: [],
      autorId: 'f2szc2WH07VuzKkl7OlkK2AZ1fG2',
      autorType: TypeUser.SATELITE,
      timestamp: '2024-02-16T08:30:00Z',
      number: '+57 310 456 7890',
      city: 'Cali',
      neighborhood: 'Aguablanca',
      typeContact: 'both',
      state: 'active',
      contacts: 2,
    },
    {
      description:
        'Busco operarias para confección de jeans, pago por prenda, excelente ambiente laboral.',
      images: [],
      autorId: 'B85Su0OCBvU4E4BQVELvIAcPfQ82',
      autorType: TypeUser.TALLER,
      timestamp: '2024-02-16T09:15:00Z',
      number: '+57 311 789 4561',
      city: 'Medellín',
      neighborhood: 'Belén',
      typeContact: 'whatsapp',
      state: 'active',
      limiteContactos: 15,
      contacts: 4,
    },
    {
      description:
        'Vendo máquina plana industrial Brother en excelente estado, poco uso.',
      images: [
        'https://picsum.photos/200/300?random=31',
        'https://picsum.photos/200/300?random=32',
      ],
      autorId: 'aGmUsZWKwUU0lEoRgccA2SheHVW2',
      autorType: TypeUser.TALLER,
      timestamp: '2024-02-16T10:00:00Z',
      number: '+57 312 567 8902',
      city: 'Bogotá',
      neighborhood: 'Kennedy',
      typeContact: 'both',
      state: 'active',
      contacts: 1,
    },
    {
      description:
        'Ofrezco servicios de corte y confección para pijamas y ropa interior.',
      images: [],
      autorId: '4Vd3Uw1vz8hCSUfrCXJCppYoVI13',
      autorType: TypeUser.TRABAJADOR,
      timestamp: '2024-02-16T11:30:00Z',
      number: '+57 313 678 9012',
      city: 'Barranquilla',
      neighborhood: 'El Prado',
      typeContact: 'whatsapp',
      state: 'active',
      limiteContactos: 10,
      contacts: 2,
    },
    {
      description:
        'Se alquilan máquinas para satélites: fileteadora y recubridora.',
      images: [],
      autorId: 'f2szc2WH07VuzKkl7OlkK2AZ1fG2',
      autorType: TypeUser.SATELITE,
      timestamp: '2024-02-16T12:00:00Z',
      number: '+57 314 321 4567',
      city: 'Manizales',
      neighborhood: 'La Enea',
      typeContact: 'both',
      state: 'active',
      contacts: 0,
    },
    {
      description: 'Vendo rollo de tela algodón licrado, ideal para camisetas.',
      images: ['https://picsum.photos/200/300?random=33'],
      autorId: 'aGmUsZWKwUU0lEoRgccA2SheHVW2',
      autorType: TypeUser.TALLER,
      timestamp: '2024-02-16T13:20:00Z',
      number: '+57 315 234 5670',
      city: 'Pereira',
      neighborhood: 'Centro',
      typeContact: 'both',
      state: 'active',
      contacts: 1,
    },
    {
      description:
        'Se requiere cortador con experiencia para prendas de vestir femeninas.',
      images: [],
      autorId: 'B85Su0OCBvU4E4BQVELvIAcPfQ82',
      autorType: TypeUser.TALLER,
      timestamp: '2024-02-16T14:45:00Z',
      number: '+57 316 567 8910',
      city: 'Cartagena',
      neighborhood: 'Pie de la Popa',
      typeContact: 'whatsapp',
      state: 'active',
      limiteContactos: 5,
      contacts: 3,
    },
    {
      description:
        'Ofrezco servicio de bordado personalizado para empresas y marcas.',
      images: ['https://picsum.photos/200/300?random=34'],
      autorId: '4Vd3Uw1vz8hCSUfrCXJCppYoVI13',
      autorType: TypeUser.TRABAJADOR,
      timestamp: '2024-02-16T15:30:00Z',
      number: '+57 317 678 2345',
      city: 'Bucaramanga',
      neighborhood: 'Cabecera',
      typeContact: 'both',
      state: 'active',
      contacts: 4,
    },
    {
      description: 'Vendo lote de botones metálicos para chaquetas, nuevos.',
      images: ['https://picsum.photos/200/300?random=35'],
      autorId: 'f2szc2WH07VuzKkl7OlkK2AZ1fG2',
      autorType: TypeUser.SATELITE,
      timestamp: '2024-02-16T16:00:00Z',
      number: '+57 318 234 6789',
      city: 'Ibagué',
      neighborhood: 'Jardín',
      typeContact: 'both',
      state: 'active',
      contacts: 2,
    },
    {
      description: 'Se busca operaria con experiencia en manejo de collarín.',
      images: [],
      autorId: 'B85Su0OCBvU4E4BQVELvIAcPfQ82',
      autorType: TypeUser.TALLER,
      timestamp: '2024-02-16T17:15:00Z',
      number: '+57 319 876 5432',
      city: 'Soacha',
      neighborhood: 'San Mateo',
      typeContact: 'whatsapp',
      state: 'active',
      limiteContactos: 7,
      contacts: 3,
    },
  ];
  // Método temporal para poblar la base de datos
  loadTestData(): void {
    const testPublications = this.testPost; // El JSON de arriba
    this.publicationService
      .addMultiplePublications(testPublications)
      .subscribe({
        next: (ids) => console.log('✅ Datos de prueba creados:', ids),
        error: (error) => console.error('❌ Error creando datos:', error),
      });
  }
}
