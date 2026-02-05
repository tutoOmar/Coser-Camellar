import { PublicationDB } from './publication-db.model';

export interface Publication extends PublicationDB {
  autor: {
    name: string;
    imageAvatarUrl: string;
  };
}
