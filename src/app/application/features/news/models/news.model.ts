export interface Comment {
  user: string;
  text: string;
  timestamp: string; // Puedes usar Date si prefieres manejar objetos de fecha
}

export interface NewsItem {
  title: string;
  id: string;
  content: string;
  author: string;
  timestamp: string; // O Date
  imageUrl?: string; // Opcional
  likes: number;
  comments: Comment[];
  tags?: string[]; // Opcional
  linkUrl?: string; // Opcional
}
