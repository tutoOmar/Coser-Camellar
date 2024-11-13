import { Component } from '@angular/core';
import { NewsItem, Comment } from '../news/models/news.model';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NewsService } from '../../services/news.service';
import { Router, RouterLink } from '@angular/router';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-news-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './news-form.component.html',
  styleUrl: './news-form.component.scss',
})
export default class NewsFormComponent {
  newNewsItem: NewsItem = {
    id: '',
    title: '',
    content: '',
    author: '',
    timestamp: new Date().toISOString(),
    imageUrl: '',
    likes: 0,
    comments: [],
    tags: [],
    linkUrl: '',
  };

  newTag: string = '';
  selectedImage: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  isUploading: boolean = false;

  constructor(private newService: NewsService, private router: Router) {} // private fileUploadService: FileUploadService

  onImageSelected(event: any) {
    if (event.target.files && event.target.files[0]) {
      this.selectedImage = event.target.files[0];
      console.log(this.selectedImage);

      // Mostrar una vista previa de la imagen
      const reader = new FileReader();
      reader.onload = (e) => (this.imagePreview = reader.result);
      if (this.selectedImage) {
        reader.readAsDataURL(this.selectedImage);
      }
    }
  }

  async addNewsItem() {
    this.isUploading = true;
    this.newService.uploadNews(this.selectedImage, this.newNewsItem).subscribe({
      next: (response) => {
        toast.success('Noticia subida con éxito');
        this.resetForm();
      },
      error: (err) => {
        toast.error('Error al subir la noticia');
      },
      complete: () => {
        this.isUploading = false;
        this.router.navigate(['/aplication']);
      },
    });
  }

  addTag() {
    if (this.newTag.trim()) {
      this.newNewsItem.tags?.push(this.newTag.trim());
      this.newTag = '';
    }
  }

  removeTag(tag: string) {
    this.newNewsItem.tags = this.newNewsItem.tags?.filter((t) => t !== tag);
  }

  resetForm() {
    this.newNewsItem = {
      id: '',
      title: '',
      content: '',
      author: '',
      timestamp: new Date().toISOString(),
      imageUrl: '',
      likes: 0,
      comments: [],
      tags: [],
      linkUrl: '',
    };
    this.newTag = '';
    this.selectedImage = null;
    this.imagePreview = null;
  }
}
