import { TypeUser } from '../../works/features/models/type-user.model';

export interface PublicationDB {
  id: string;
  description: string;
  images: string[]; // máx 5 URLs
  autorId: string;
  autorType: TypeUser;
  timestamp: string;
  number: string;
  city: string; // obligatorio
  neighborhood: string; // obligatorio
  typeContact: string;
  state: StateEnum;
  limiteContactos?: number; // p. ej., 5 semanales
  contacts: number;
  updatedAt?: string;
}

export enum StateEnum {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PAUSED = 'paused',
  ELIMINATED = 'eliminated',
}

export enum typeContactEnum {
  CALL = 'call',
  WHATSAPP = 'whatsapp',
  BOTH = 'both',
}
