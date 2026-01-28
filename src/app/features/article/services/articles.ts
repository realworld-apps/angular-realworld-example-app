import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ArticleListConfig } from '../models/article-list-config.model';
import { ArticleModel } from '../models/article.model';

@Injectable({ providedIn: 'root' })
export class Articles {
  constructor(private readonly http: HttpClient) {}

  query(config: ArticleListConfig): Observable<{ articles: ArticleModel[]; articlesCount: number }> {
    // Convert any filters over to Angular's URLSearchParams
    let params = new HttpParams();

    Object.keys(config.filters).forEach(key => {
      // @ts-ignore
      params = params.set(key, config.filters[key]);
    });

    return this.http.get<{ articles: ArticleModel[]; articlesCount: number }>(
      '/articles' + (config.type === 'feed' ? '/feed' : ''),
      { params },
    );
  }

  get(slug: string): Observable<ArticleModel> {
    return this.http.get<{ article: ArticleModel }>(`/articles/${slug}`).pipe(map(data => data.article));
  }

  delete(slug: string): Observable<void> {
    return this.http.delete<void>(`/articles/${slug}`);
  }

  create(article: Partial<ArticleModel>): Observable<ArticleModel> {
    return this.http
      .post<{ article: ArticleModel }>('/articles/', { article: article })
      .pipe(map(data => data.article));
  }

  update(article: Partial<ArticleModel>): Observable<ArticleModel> {
    return this.http
      .put<{ article: ArticleModel }>(`/articles/${article.slug}`, {
        article: article,
      })
      .pipe(map(data => data.article));
  }

  favorite(slug: string): Observable<ArticleModel> {
    return this.http.post<{ article: ArticleModel }>(`/articles/${slug}/favorite`, {}).pipe(map(data => data.article));
  }

  unfavorite(slug: string): Observable<void> {
    return this.http.delete<void>(`/articles/${slug}/favorite`);
  }
}
