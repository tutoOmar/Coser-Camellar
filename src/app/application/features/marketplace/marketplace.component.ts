import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../models/product.model';
import { MarketplaceService } from '../../services/marketplace.service';
import { Subject, takeUntil, tap } from 'rxjs';
import { StateProductEnum } from '../../models/state-product.enum';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-marketplace',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './marketplace.component.html',
  styleUrl: './marketplace.component.scss',
  providers: [MarketplaceService],
})
export default class MarketplaceComponent {
  private destroy$ = new Subject<void>();
  // Inyección de servicios
  private productService = inject(MarketplaceService);
  // Datos de los productos
  private products = signal<Product[]>([]);
  // Computed signal para filtrar y procesar productos si es necesario
  filteredItems = computed(() => this.products());
  selectedImage: string | null = null;

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
   * Cargar productos completos del market place
   */
  loadProducts() {
    this.productService
      .loadProducts<Product[]>()
      .pipe(
        takeUntil(this.destroy$),
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
  /**
   * Destruir el componete destruye susbcripciones
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
