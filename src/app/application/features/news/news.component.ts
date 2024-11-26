import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { NewsService } from '../../services/news.service';
import LoadingComponent from '../../../shared/ui/loading/loading.component';

interface News {
  id: string;
  title: string;
  content: string;
  author: string;
  timestamp: any;
  imageUrl?: string;
  likes: number;
  comments: Array<{
    user: string;
    text: string;
    timestamp: any;
  }>;
}

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [CommonModule, LoadingComponent],
  templateUrl: './news.component.html',
  styleUrl: './news.component.scss',
})
export default class NewsComponent {
  newsListSignal = inject(NewsService).getNewsSignal();
  isExpanded: { [id: string]: boolean } = {}; // Control de expansión para cada noticia
  isLoadingPage = signal<boolean>(true);

  constructor(private firestore: Firestore) {}

  ngOnInit(): void {}

  toggleExpand(newsId: string): void {
    this.isExpanded[newsId] = !this.isExpanded[newsId];
  }

  likeNews(news: News): void {
    // Simulación del like
    const updatedLikes = news.likes + 1;
    news.likes = updatedLikes;

    // Aquí puedes actualizar Firestore con el nuevo valor
    // const newsDoc = doc(this.firestore, `news/${news.id}`);
    // updateDoc(newsDoc, { likes: updatedLikes });
  }

  showComments(news: News): void {
    console.log(`Mostrando comentarios para la noticia: ${news.title}`);
  }
}
