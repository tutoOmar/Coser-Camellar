import { TypeUser } from './type-user.model';

export interface NaturalPersonUser {
  id: string;
  average_score: number;
  name: string;
  phone: string;
  photo?: string;
  email?: string;
  city: string;
  country: string;
  neighborhood?: string;
  description?: string; // "Marca personal que manda a confeccionar ropa deportiva", por ejemplo
  typeUSer: TypeUser.PERSONA_NATURAL;
  userId?: string;
  countProfileVisits?: number;
  countContactViaWa?: number;
}
