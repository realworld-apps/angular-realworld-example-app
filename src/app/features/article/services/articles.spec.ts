import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { Articles } from './articles';
import { ArticleModel } from '../models/article-model';
import { ArticleListConfig } from '../models/article-list-config.model';

describe('Articles', () => {
  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  let service: Articles;
  let httpMock: HttpTestingController;

  const mockArticle: ArticleModel = {
    slug: 'test-article',
    title: 'Test Article',
    description: 'Test description',
    body: 'Test body content',
    tagList: ['test', 'angular'],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-02',
    favorited: false,
    favoritesCount: 5,
    author: {
      username: 'testuser',
      bio: 'Test bio',
      image: 'https://example.com/avatar.jpg',
      following: false,
    },
  };

  const mockArticleList: ArticleModel[] = [
    mockArticle,
    {
      ...mockArticle,
      slug: 'second-article',
      title: 'Second Article',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [Articles],
    });
    service = TestBed.inject(Articles);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('query', () => {
    it('should fetch articles with default config', () => {
      const config: ArticleListConfig = {
        type: 'all',
        filters: {},
      };
      service.query(config).subscribe(response => {
        expect(response.articles).toEqual(mockArticleList);
        expect(response.articlesCount).toBe(2);
      });
      const req = httpMock.expectOne('/articles');
      expect(req.request.method).toBe('GET');
      req.flush({ articles: mockArticleList, articlesCount: 2 });
    });

    it('should fetch feed articles when type is feed', () => {
      const config: ArticleListConfig = {
        type: 'feed',
        filters: {},
      };
      service.query(config).subscribe();
      const req = httpMock.expectOne('/articles/feed');
      expect(req.request.method).toBe('GET');
      req.flush({ articles: mockArticleList, articlesCount: 2 });
    });

    it('should include query parameters from filters', () => {
      const config: ArticleListConfig = {
        type: 'all',
        filters: {
          tag: 'angular',
          author: 'testuser',
          limit: 10,
          offset: 0,
        },
      };

      service.query(config).subscribe();

      const req = httpMock.expectOne(request => {
        return (
          request.url === '/articles' &&
          request.params.get('tag') === 'angular' &&
          request.params.get('author') === 'testuser' &&
          request.params.get('limit') === '10' &&
          request.params.get('offset') === '0'
        );
      });

      expect(req.request.method).toBe('GET');
      req.flush({ articles: mockArticleList, articlesCount: 2 });
    });

    it('should handle pagination parameters', () => {
      const config: ArticleListConfig = {
        type: 'all',
        filters: {
          limit: 20,
          offset: 40,
        },
      };

      service.query(config).subscribe();

      const req = httpMock.expectOne(request => {
        return (
          request.url === '/articles' && request.params.get('limit') === '20' && request.params.get('offset') === '40'
        );
      });

      req.flush({ articles: mockArticleList, articlesCount: 100 });
    });

    it('should handle empty results', () => {
      const config: ArticleListConfig = {
        type: 'all',
        filters: {},
      };
      service.query(config).subscribe(response => {
        expect(response.articles).toEqual([]);
        expect(response.articlesCount).toBe(0);
      });
      const req = httpMock.expectOne('/articles');
      req.flush({ articles: [], articlesCount: 0 });
    });
  });

  describe('get', () => {
    it('should fetch single article by slug', async () => {
      const slug = 'test-article';
      const promise = firstValueFrom(service.get(slug));
      const req = httpMock.expectOne(`/articles/${slug}`);
      expect(req.request.method).toBe('GET');
      req.flush({ article: mockArticle });
      const article = await promise;
      expect(article).toEqual(mockArticle);
    });

    it('should handle article not found', async () => {
      const slug = 'non-existent';
      const errorResponse = { status: 404, statusText: 'Not Found' };
      const promise = firstValueFrom(service.get(slug));
      const req = httpMock.expectOne(`/articles/${slug}`);
      req.flush('Article not found', errorResponse);
      await expect(promise).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('delete', () => {
    it('should delete article by slug', async () => {
      const slug = 'article-to-delete';
      const promise = firstValueFrom(service.delete(slug));
      const req = httpMock.expectOne(`/articles/${slug}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
      await promise;
      expect(true).toBe(true);
    });

    it('should handle delete error', async () => {
      const slug = 'protected-article';
      const errorResponse = { status: 403, statusText: 'Forbidden' };
      const promise = firstValueFrom(service.delete(slug));
      const req = httpMock.expectOne(`/articles/${slug}`);
      req.flush('Cannot delete', errorResponse);
      await expect(promise).rejects.toMatchObject({ status: 403 });
    });
  });

  describe('create', () => {
    it('should create new article', async () => {
      const newArticle: Partial<ArticleModel> = {
        title: 'New Article',
        description: 'New description',
        body: 'New body',
        tagList: ['new', 'test'],
      };
      const promise = firstValueFrom(service.create(newArticle));
      const req = httpMock.expectOne('/articles/');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ article: newArticle });
      req.flush({ article: { ...mockArticle, ...newArticle } });
      const article = await promise;
      expect(article.title).toBe(newArticle.title);
    });

    it('should handle validation errors', async () => {
      const invalidArticle: Partial<ArticleModel> = {
        title: '',
        description: '',
        body: '',
      };
      const errorResponse = { status: 422, statusText: 'Unprocessable Entity' };
      const promise = firstValueFrom(service.create(invalidArticle));
      const req = httpMock.expectOne('/articles/');
      req.flush('Validation failed', errorResponse);
      await expect(promise).rejects.toMatchObject({ status: 422 });
    });
  });

  describe('update', () => {
    it('should update existing article', async () => {
      const updates: Partial<ArticleModel> = {
        slug: 'existing-article',
        title: 'Updated Title',
        description: 'Updated description',
      };
      const promise = firstValueFrom(service.update(updates));
      const req = httpMock.expectOne(`/articles/${updates.slug}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ article: updates });
      req.flush({ article: { ...mockArticle, ...updates } });
      const article = await promise;
      expect(article.title).toBe(updates.title);
    });
  });

  describe('favorite', () => {
    it('should favorite an article', async () => {
      const slug = 'article-to-favorite';
      const promise = firstValueFrom(service.favorite(slug));
      const req = httpMock.expectOne(`/articles/${slug}/favorite`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush({ article: { ...mockArticle, favorited: true } });
      const article = await promise;
      expect(article.favorited).toBe(true);
    });
  });

  describe('unfavorite', () => {
    it('should unfavorite an article', async () => {
      const slug = 'article-to-unfavorite';
      const promise = firstValueFrom(service.unfavorite(slug));
      const req = httpMock.expectOne(`/articles/${slug}/favorite`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
      await promise;
      expect(true).toBe(true);
    });
  });
});
