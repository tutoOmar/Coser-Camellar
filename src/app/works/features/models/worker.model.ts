import { Machines } from './machines.model';
import { Specialty } from './specialties.model';
import { Status } from './status.model';
import { Comment } from './comment.model';
import { TypeUser } from './type-user.model';
import { Country } from './country.model';
//
export interface WorkerUser {
  id: string;
  average_score: number;
  city: string; // Obtenerlo de una API según el país
  country?: string; // Obtenerlo de un API de paises
  experience: string[]; // Arreglo de experiencias
  machines: Machines[]; // Lista de máquinas usando enum
  name: string;
  phone: string;
  photo: string;
  specialty: Specialty[]; // Lista de especialidades usando enum
  comments: Comment[]; // Comentarios de las personas
  status: Status;
  gender: GenderEnum;
  typeUSer?: TypeUser.TRABAJADOR;
  userId?: string;
}
//
export enum GenderEnum {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}
