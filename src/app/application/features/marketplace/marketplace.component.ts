import {
  AfterViewInit,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../models/product.model';
import { MarketplaceService } from '../../services/marketplace.service';
import {
  forkJoin,
  map,
  merge,
  of,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { StateProductEnum } from '../../models/state-product.enum';
import { Router, RouterModule } from '@angular/router';
import LoadingComponent from '../../../shared/ui/loading/loading.component';
import WaButtonComponent from '../../../shared/ui/wa-button/wa-button.component';
import { WorksService } from '../../../works/services/works.service';
import { AnalyticsService } from '../../../shared/data-access/analytics.service';
import { AuthStateService } from '../../../shared/data-access/auth-state.service';
interface ProductWithPhone extends Product {
  userPhone: string | null; // null si no hay usuario asociado
}
@Component({
  selector: 'app-marketplace',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingComponent, WaButtonComponent],
  templateUrl: './marketplace.component.html',
  styleUrl: './marketplace.component.scss',
  providers: [MarketplaceService],
})
export default class MarketplaceComponent implements AfterViewInit {
  private destroy$ = new Subject<void>();
  // Inyección de servicios
  private productService = inject(MarketplaceService);
  private userService = inject(WorksService);
  private analyticsService = inject(AnalyticsService);
  private authService = inject(AuthStateService);

  // Datos de los productos
  private products = signal<ProductWithPhone[]>([]);
  // Computed signal para filtrar y procesar productos si es necesario
  isLoadingPage = signal<boolean>(true);
  isLoginUser = signal<boolean>(false);
  filteredItems = computed(() => this.products());
  selectedImage: string | null = null;

  constructor() {}

  ngOnInit(): void {
    // Simula la carga de datos desde un archivo JSON
    this.loadProducts();

    this.authService.isAuthenticated$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (state) => {
        if (state) {
          this.isLoginUser.set(true);
        }
      },
      error: (error) => {
        //this.loading.set(false);
        console.error(error);
      },
    });
  }
  /**
   *
   */
  ngAfterViewInit() {
    this.analyticsService.logPageVisit('marketplace');
  }
  /**
   * Funcion para abrir la imagen en grande
   * @param image
   */
  openImage(image: string): void {
    this.selectedImage = image;
  }
  /**
   *  Cierra la imagen
   */
  closeImage(): void {
    this.selectedImage = null;
  }
  /**
   * Cargar productos completos del market place
   */
  loadProducts() {
    this.productService
      .loadProducts<Product[]>()
      .pipe(
        takeUntil(this.destroy$),
        tap(() => this.isLoadingPage.set(false)),
        switchMap((products) => {
          if (!products || products.length === 0) {
            return of();
          }
          const uniqueUserIds = Array.from(
            new Set(products.map((product) => product.userId))
          ); // Elimina IDs duplicados
          return this.userService.getUsersByIds(uniqueUserIds).pipe(
            map((users) => {
              // Crea un Map para una búsqueda eficiente de usuarios por userId
              const userMap = new Map(users.map((user) => [user.userId, user]));
              // Asocia cada producto con el teléfono del usuario correspondiente
              const productsWithPhone = products.map((product) => {
                const user = userMap.get(product.userId); // Busca al usuario directamente por userId
                return {
                  ...product,
                  userPhone: user ? user.phone : null, // Agrega el teléfono del usuario o null si no se encuentra
                };
              });
              return productsWithPhone; // Devuelve el arreglo actualizado
            })
          );
        }),
        /**
         * Se setter la signal con los productos pero ahora con el telfono del usuario
         */
        tap((productWithPhone) => {
          this.products.set(productWithPhone);
        })
        //Se quita la pantalla de carga
      )
      .subscribe();
  }
  // Traducir state
  translateState(stateProduct: string): string {
    switch (stateProduct) {
      case StateProductEnum.NEW:
        return 'Nuevo';
      case StateProductEnum.SECOND_HAND:
        return 'De segunda';
      default:
        return '';
    }
  }
  /**
   * Mensaje personalizado de WhatsApp
   */
  personalizeMessage(title: string): string {
    return (
      'Hola vi que ofrecias el siguiente producto en Coser & Camellar: ' +
      '*' +
      title +
      '*' +
      '. Quisiera obtener más información por favor.'
    );
  }
  /**
   * Destruir el componete destruye susbcripciones
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
