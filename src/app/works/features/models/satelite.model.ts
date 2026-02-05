import { Machines } from './machines.model';
import { Specialty } from './specialties.model';
import { Status } from './status.model';
import { Comment } from './comment.model';
import { Position } from './position.model';
import { TypeUser } from './type-user.model';

export interface SateliteUser {
  id: string;
  average_score: number;
  responsible: string;
  city: string; // Obtenerlo de una API según el país
  country: string; // Obtenerlo de un API de paises
  neighborhood: string;
  experience: string[]; // Arreglo de experiencias
  machines: Machines[]; // Lista de máquinas usando enum
  name: string;
  phone: string;
  photo: string;
  specialty: Specialty[]; // Lista de especialidades usando enum
  comments: Comment[]; // Comentarios de las personas
  status: Status;
  numberEmployees: number;
  positions: Position[];
  typeUSer?: TypeUser.SATELITE;
  userId?: string;
  countProfileVisits?: number;
  countContactViaWa?: number;
}
