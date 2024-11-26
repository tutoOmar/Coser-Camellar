import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { toast } from 'ngx-sonner';
import { catchError, of, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { StateProductEnum } from '../../../models/state-product.enum';
import { AuthStateService } from '../../../../shared/data-access/auth-state.service';
import { MarketplaceService } from '../../../services/marketplace.service';
import { Product } from '../../../models/product.model';

const emptyProduct: Product = {
  id: '',
  title: '',
  description: '',
  price: 0,
  state: StateProductEnum.NEW,
  image: '',
  category: '',
  userId: '',
};

@Component({
  selector: 'app-edit-product',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './edit-product.component.html',
  styleUrl: './edit-product.component.scss',
  providers: [MarketplaceService],
})
export default class EditProductComponent implements OnInit {
  //
  private destroy$ = new Subject<void>();
  // Inyeccion de servicios
  private authService = inject(AuthStateService);
  private marketplaceService = inject(MarketplaceService);
  private currentRoute = inject(ActivatedRoute);
  // Variables de control del formulario
  productForm: FormGroup;
  loading = signal<boolean>(false);
  stateTypes = Object.values(StateProductEnum);
  currentUserId = signal<string>('');
  currentDataProduct: Product | null = null;
  // Variables para manejo de imágenes
  selectedImage: File | null = null;
  imagePreview = signal<string | ArrayBuffer | null>(null);
  isImageRequired = signal<boolean>(false); // Control para validación de imagen

  constructor(private fb: FormBuilder, private router: Router) {
    // Inicialización del formulario con validaciones
    this.productForm = this.fb.group({
      title: ['', [Validators.required]], // Título obligatorio
      description: ['', [Validators.required, Validators.maxLength(500)]], // Descripción obligatoria con máximo 500 caracteres
      price: [
        '',
        [
          Validators.required,
          Validators.min(0),
          Validators.pattern('^[0-9]*$'),
        ],
      ], // Precio obligatorio, positivo y solo números
      state: ['', Validators.required], // Estado obligatorio
    });
  }
  ngOnInit(): void {
    const currentProductId = this.currentRoute.snapshot.paramMap.get('id');
    this.authService.authState$
      .pipe(
        takeUntil(this.destroy$),
        switchMap((stateUser) => {
          if (stateUser && stateUser.uid && currentProductId) {
            return this.marketplaceService.getOneProductById<Product>(
              currentProductId
            );
          } else {
            return of();
          }
        }),
        tap((product) => product as Product)
      )
      .subscribe({
        next: (product) => {
          this.loading.set(false);
          if (product) {
            const productData = product as Product;
            this.currentDataProduct = productData;
            // Setteamos los valores actuales del producto
            this.productForm.patchValue({
              title: productData.title,
              description: productData.description,
              price: productData.price,
              state: productData.state,
            });
            this.imagePreview.set(productData.image);
          }
        },
        error: (error) => {
          this.loading.set(false);
        },
      });
  }
  // Método para manejar la selección de imágenes
  onImageSelected(event: any) {
    if (event.target.files && event.target.files[0]) {
      this.selectedImage = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => this.imagePreview.set(reader.result);
      if (this.selectedImage) {
        reader.readAsDataURL(this.selectedImage);
      }
    }
  }
  // Método para enviar el formulario
  submitProduct() {
    //this.isImageRequired.set(true); // Activar validación de imagen
    this.loading.set(true);
    //ToDo: SE debe implementar algo para detectar si es un maquina, mesa, u otra categoria de momento a todo se le colocará máquina y se buscará no usar este criterio inicialmente en las busquedas
    // Validación del formulario
    if (this.productForm.valid && this.currentDataProduct) {
      const updatedProductForm = {
        ...this.productForm.value,
      };
      const updatedProduct: Product = {
        id: this.currentDataProduct.id,
        title: updatedProductForm.title,
        description: updatedProductForm.description,
        price: updatedProductForm.price,
        state: updatedProductForm.state,
        category: this.currentDataProduct.category,
        image: this.currentDataProduct.image,
        userId: this.currentDataProduct.userId,
      };
      this.marketplaceService
        .updateProduct(this.selectedImage, updatedProduct)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            toast.success('Producto editado exitosamente');
            this.router.navigate(['/aplication/marketplace']);
            this.loading.set(false);
          },
          error: () => {
            toast.error('Erro al publicar tú producto, intenta más tarde');
            this.loading.set(false);
          },
        });
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.productForm.controls).forEach((key) => {
        const control = this.productForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
      this.loading.set(false);
    }
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
  // Destructor del componente
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
