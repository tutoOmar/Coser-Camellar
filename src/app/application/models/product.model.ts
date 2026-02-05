import { StateProductEnum } from './state-product.enum';

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  state: StateProductEnum;
  category: string;
  userId: string;
}
