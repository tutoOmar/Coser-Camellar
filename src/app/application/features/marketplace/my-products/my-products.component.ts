import { Component, computed, inject, signal } from '@angular/core';
import { of, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { Product } from '../../../models/product.model';
import { StateProductEnum } from '../../../models/state-product.enum';
import { MarketplaceService } from '../../../services/marketplace.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthStateService } from '../../../../shared/data-access/auth-state.service';

@Component({
  selector: 'app-my-products',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-products.component.html',
  styleUrl: './my-products.component.scss',
  providers: [MarketplaceService],
})
export default class MyProductsComponent {
  private destroy$ = new Subject<void>();
  // Inyección de servicios
  private authService = inject(AuthStateService);
  private productService = inject(MarketplaceService);
  // Datos de los productos
  private products = signal<Product[]>([]);
  // Computed signal para filtrar y procesar productos si es necesario
  filteredItems = computed(() => this.products());
  selectedImage: string | null = null;
  // Variable para controlar el mostrar la descripción
  expandedDescriptions: boolean[] = [];

  constructor() {}

  ngOnInit(): void {
    // Simula la carga de datos desde un archivo JSON
    this.loadProducts();
  }
  onBuy(itemId: string) {
    console.log(`Producto con ID ${itemId} comprado.`);
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
   * Cargar productos de este usuario del marketplace
   */
  loadProducts() {
    this.authService.authState$
      .pipe(
        takeUntil(this.destroy$),
        switchMap((user) => {
          if (user && user.uid) {
            return this.productService.loadProductsByUserId<Product[]>(
              user.uid
            );
          } else {
            return of([]);
          }
        }),
        tap((product: Product[]) => this.products.set(product))
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
  // Método para mostrar toda la descripción
  getDisplayDescription(description: string, index: number): string {
    if (description.length <= 100) {
      return description;
    }
    if (this.expandedDescriptions[index]) {
      return description;
    }
    return description.slice(0, 50) + '...';
  }

  // Método cambiar entre mostrar y no mostrar la descripcion completa
  toggleDescription(index: number) {
    if (this.expandedDescriptions[index] === undefined) {
      this.expandedDescriptions[index] = false;
    }
    this.expandedDescriptions[index] = !this.expandedDescriptions[index];
  }
  deleteProduct(productId: string) {
    this.productService
      .deleteProduct(productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }
  /**
   * Destruir el componete destruye susbcripciones
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
