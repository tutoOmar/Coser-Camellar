import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-marketplace',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './marketplace.component.html',
  styleUrl: './marketplace.component.scss',
})
export default class MarketplaceComponent {
  // Simula los datos obtenidos del JSON
  private fakeData = signal<any[]>([]);

  // Computed signal para filtrar y procesar productos si es necesario
  filteredItems = computed(() => this.fakeData());

  constructor() {}

  ngOnInit(): void {
    // Simula la carga de datos desde un archivo JSON
    this.loadFakeData();
  }

  private loadFakeData() {
    // Aquí puedes reemplazar por una llamada HTTP en el futuro
    this.fakeData.set([
      {
        id: 1,
        title: 'Máquina de Coser Industrial Juki',
        description: 'Máquina robusta ideal para costura pesada.',
        price: 1500000,
        image:
          'https://maicoser.com/wp-content/uploads/2023/06/Juki-LZ-2280A-Maquina-Zigzadora-Usada.jpeg',
        category: 'Máquinas de Coser',
      },
      {
        id: 2,
        title: 'Maquina de corte 10 pulgadas de segunda',
        description: 'Máquina especializada en corte',
        price: 700000,
        image:
          'https://dcdn.mitiendanube.com/stores/001/068/511/products/511-64863e2314087a93af15906070959494-640-0.jpg',
        category: 'Maquina de corte',
      },
      {
        id: 3,
        title: 'Máquina de coser mecatronica',
        description: 'Marca Jintex',
        price: 3000000,
        image: 'https://gavicoser.com/wp-content/uploads/2020/09/IMG_E3428.jpg',
        category: 'Maquina de coser',
      },
    ]);
  }

  onBuy(itemId: number) {
    console.log(`Producto con ID ${itemId} comprado.`);
  }
}
