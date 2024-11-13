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

enum PaymentEnum {
  DESTAJO = 'destajo',
  SALARIO = 'salario',
  CONTRATO = 'contrato',
}

enum StatusPositionEnum {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
}
