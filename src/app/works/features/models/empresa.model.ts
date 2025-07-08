import { Specialty } from './specialties.model';
import { Status } from './status.model';
import { TypeUser } from './type-user.model';
import { Comment } from './comment.model';

export interface EmpresaUser {
  id: string;
  average_score: number;
  name: string;
  nit?: string; // opcional si es persona natural con marca
  responsable: string;
  phone: string;
  photo: string;
  city: string;
  country: string;
  neighborhood: string;
  typeUSer: TypeUser.EMPRESA;
  specialties: Specialty[]; // áreas de interés (ropa deportiva, jeans, fajas, etc.)
  busca: Search; // qué tipo de contacto busca
  comments?: Comment[];
  status: Status;
  userId?: string;
  website?: string;
  countProfileVisits?: number;
  countContactViaWa?: number;
}

export enum Search {
  WORKERS = 'trabajadores',
  TALLERES = 'talleres',
  BOTH = 'ambos',
}
