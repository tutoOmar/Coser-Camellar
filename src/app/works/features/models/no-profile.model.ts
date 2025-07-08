import { TypeUser } from './type-user.model';

export interface NoProfileUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  description?: string; // "Marca personal que manda a confeccionar ropa deportiva", por ejemplo
  typeUSer: TypeUser.NO_PROFILE;
  userId?: string;
  countProfileVisits?: number;
  countContactViaWa?: number;
}
