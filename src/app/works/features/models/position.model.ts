import { Specialty } from './specialties.model';

export interface Position {
  id: string;
  name: string;
  description: string;
  specialty: Specialty[];
  experience: string;
  photo: string;
  typePayment: PaymentEnum;
  city: string;
  neighborhood: string;
  phone: string;
  statusPosition: StatusPositionEnum;
}

export enum PaymentEnum {
  DESTAJO = 'destajo',
  SALARIO = 'salario',
  CONTRATO = 'contrato',
}

export enum StatusPositionEnum {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
}
