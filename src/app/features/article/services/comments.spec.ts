import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { Comments } from './comments';
import { Comment } from '../models/comment.model';

describe('Comments', () => {
  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  let service: Comments;
  let httpMock: HttpTestingController;

  const mockComment: Comment = {
    id: '1',
    body: 'Test comment',
    createdAt: '2024-01-01',
    author: {
      username: 'testuser',
      bio: 'Test bio',
      image: 'https://example.com/avatar.jpg',
      following: false,
    },
  };

  const mockComments: Comment[] = [
    mockComment,
    {
      ...mockComment,
      id: '2',
      body: 'Second comment',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [Comments],
    });

    service = TestBed.inject(Comments);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('should fetch all comments for an article', async () => {
      const slug = 'test-article';
      const promise = firstValueFrom(service.getAll(slug));
      const req = httpMock.expectOne(`/articles/${slug}/comments`);
      expect(req.request.method).toBe('GET');
      req.flush({ comments: mockComments });
      const comments = await promise;
      expect(comments).toEqual(mockComments);
      expect(comments.length).toBe(2);
    });

    it('should extract comments array from response wrapper', async () => {
      const slug = 'test-article';
      const promise = firstValueFrom(service.getAll(slug));
      const req = httpMock.expectOne(`/articles/${slug}/comments`);
      req.flush({ comments: mockComments });
      const comments = await promise;
      expect(Array.isArray(comments)).toBe(true);
      expect((comments as any).comments).toBeUndefined();
    });

    it('should handle empty comments list', async () => {
      const slug = 'article-no-comments';
      const promise = firstValueFrom(service.getAll(slug));
      const req = httpMock.expectOne(`/articles/${slug}/comments`);
      req.flush({ comments: [] });
      const comments = await promise;
      expect(comments).toEqual([]);
      expect(comments.length).toBe(0);
    });

    it('should handle article not found', async () => {
      const slug = 'nonexistent';
      const errorResponse = { status: 404, statusText: 'Not Found' };
      const promise = firstValueFrom(service.getAll(slug));
      const req = httpMock.expectOne(`/articles/${slug}/comments`);
      req.flush('Article not found', errorResponse);
      await expect(promise).rejects.toMatchObject({ status: 404 });
    });

    it('should handle slug with special characters', () => {
      const slug = 'article-with-special-chars-123';
      service.getAll(slug).subscribe();
      const req = httpMock.expectOne(`/articles/${slug}/comments`);
      req.flush({ comments: mockComments });
    });

    it('should handle comments with null author bio', async () => {
      const slug = 'test-article';
      const commentsWithNullBio = mockComments.map(c => ({
        ...c,
        author: { ...c.author, bio: null },
      }));
      const promise = firstValueFrom(service.getAll(slug));
      const req = httpMock.expectOne(`/articles/${slug}/comments`);
      req.flush({ comments: commentsWithNullBio });
      const comments = await promise;
      expect(comments[0].author.bio).toBeNull();
    });

    it('should handle very long comment body', async () => {
      const slug = 'test-article';
      const longBody = 'a'.repeat(1000);
      const commentWithLongBody = { ...mockComment, body: longBody };
      const promise = firstValueFrom(service.getAll(slug));
      const req = httpMock.expectOne(`/articles/${slug}/comments`);
      req.flush({ comments: [commentWithLongBody] });
      const comments = await promise;
      expect(comments[0].body).toBe(longBody);
    });

    it('should handle server error', async () => {
      const slug = 'test-article';
      const errorResponse = { status: 500, statusText: 'Server Error' };
      const promise = firstValueFrom(service.getAll(slug));
      const req = httpMock.expectOne(`/articles/${slug}/comments`);
      req.flush('Server error', errorResponse);
      await expect(promise).rejects.toMatchObject({ status: 500 });
    });

    it('should handle multiple comments from different authors', async () => {
      const slug = 'popular-article';
      const multiAuthorComments: Comment[] = [
        mockComment,
        {
          ...mockComment,
          id: '2',
          author: { ...mockComment.author, username: 'anotheruser' },
        },
        {
          ...mockComment,
          id: '3',
          author: { ...mockComment.author, username: 'thirduser' },
        },
      ];
      const promise = firstValueFrom(service.getAll(slug));
      const req = httpMock.expectOne(`/articles/${slug}/comments`);
      req.flush({ comments: multiAuthorComments });
      const comments = await promise;
      expect(comments.length).toBe(3);
      expect(comments[0].author.username).toBe('testuser');
      expect(comments[1].author.username).toBe('anotheruser');
      expect(comments[2].author.username).toBe('thirduser');
    });
  });

  describe('add', () => {
    it('should add a new comment to an article', async () => {
      const slug = 'test-article';
      const commentBody = 'This is a new comment';
      const promise = firstValueFrom(service.add(slug, commentBody));
      const req = httpMock.expectOne(`/articles/${slug}/comments`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ comment: { body: commentBody } });
      req.flush({ comment: { ...mockComment, body: commentBody } });
      const comment = await promise;
      expect(comment.body).toBe(commentBody);
      expect(comment.id).toBeDefined();
    });

    it('should extract comment from response wrapper', async () => {
      const slug = 'test-article';
      const commentBody = 'Test comment';
      const promise = firstValueFrom(service.add(slug, commentBody));
      const req = httpMock.expectOne(`/articles/${slug}/comments`);
      req.flush({ comment: mockComment });
      const comment = await promise;
      expect((comment as any).comment).toBeUndefined();
    });

    it('should handle empty comment body', async () => {
      const slug = 'test-article';
      const emptyBody = '';
      const errorResponse = { status: 422, statusText: 'Unprocessable Entity' };
      const promise = firstValueFrom(service.add(slug, emptyBody));
      const req = httpMock.expectOne(`/articles/${slug}/comments`);
      req.flush('Comment body cannot be empty', errorResponse);
      await expect(promise).rejects.toMatchObject({ status: 422 });
    });

    it('should handle very long comment', async () => {
      const slug = 'test-article';
      const longComment = 'a'.repeat(5000);
      const promise = firstValueFrom(service.add(slug, longComment));
      const req = httpMock.expectOne(`/articles/${slug}/comments`);
      req.flush({ comment: { ...mockComment, body: longComment } });
      const comment = await promise;
      expect(comment.body).toBe(longComment);
    });

    it('should handle unauthorized comment', async () => {
      const slug = 'test-article';
      const commentBody = 'Unauthorized comment';
      const errorResponse = { status: 401, statusText: 'Unauthorized' };
      const promise = firstValueFrom(service.add(slug, commentBody));
      const req = httpMock.expectOne(`/articles/${slug}/comments`);
      req.flush('Must be logged in', errorResponse);
      await expect(promise).rejects.toMatchObject({ status: 401 });
    });

    it('should handle article not found', async () => {
      const slug = 'nonexistent';
      const commentBody = 'Comment on nonexistent article';
      const errorResponse = { status: 404, statusText: 'Not Found' };
      const promise = firstValueFrom(service.add(slug, commentBody));
      const req = httpMock.expectOne(`/articles/${slug}/comments`);
      req.flush('Article not found', errorResponse);
      await expect(promise).rejects.toMatchObject({ status: 404 });
    });

    it('should send correct request body format', () => {
      const slug = 'test-article';
      const commentBody = 'Test';
      service.add(slug, commentBody).subscribe();
      const req = httpMock.expectOne(`/articles/${slug}/comments`);
      expect(req.request.body).toEqual({
        comment: {
          body: commentBody,
        },
      });
      req.flush({ comment: mockComment });
    });

    it('should handle comment with special characters', async () => {
      const slug = 'test-article';
      const specialComment = 'Comment with émojis 🚀 and special chars!@#$%';
      const promise = firstValueFrom(service.add(slug, specialComment));
      const req = httpMock.expectOne(`/articles/${slug}/comments`);
      req.flush({ comment: { ...mockComment, body: specialComment } });
      const comment = await promise;
      expect(comment.body).toBe(specialComment);
    });

    it('should handle comment with newlines', async () => {
      const slug = 'test-article';
      const multilineComment = 'Line 1\nLine 2\nLine 3';
      const promise = firstValueFrom(service.add(slug, multilineComment));
      const req = httpMock.expectOne(`/articles/${slug}/comments`);
      req.flush({ comment: { ...mockComment, body: multilineComment } });
      const comment = await promise;
      expect(comment.body).toBe(multilineComment);
    });
  });

  describe('delete', () => {
    it('should delete a comment', async () => {
      const slug = 'test-article';
      const commentId = '123';
      const promise = firstValueFrom(service.delete(commentId, slug));
      const req = httpMock.expectOne(`/articles/${slug}/comments/${commentId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
      await promise;
      expect(true).toBe(true);
    });

    it('should handle comment not found', async () => {
      const slug = 'test-article';
      const commentId = 'nonexistent';
      const errorResponse = { status: 404, statusText: 'Not Found' };
      const promise = firstValueFrom(service.delete(commentId, slug));
      const req = httpMock.expectOne(`/articles/${slug}/comments/${commentId}`);
      req.flush('Comment not found', errorResponse);
      await expect(promise).rejects.toMatchObject({ status: 404 });
    });

    it('should handle unauthorized delete', async () => {
      const slug = 'test-article';
      const commentId = '123';
      const errorResponse = { status: 403, statusText: 'Forbidden' };
      const promise = firstValueFrom(service.delete(commentId, slug));
      const req = httpMock.expectOne(`/articles/${slug}/comments/${commentId}`);
      req.flush('Cannot delete this comment', errorResponse);
      await expect(promise).rejects.toMatchObject({ status: 403 });
    });

    it('should handle unauthenticated delete', async () => {
      const slug = 'test-article';
      const commentId = '123';
      const errorResponse = { status: 401, statusText: 'Unauthorized' };
      const promise = firstValueFrom(service.delete(commentId, slug));
      const req = httpMock.expectOne(`/articles/${slug}/comments/${commentId}`);
      req.flush('Must be logged in', errorResponse);
      await expect(promise).rejects.toMatchObject({ status: 401 });
    });

    it('should handle numeric comment ID', () => {
      const slug = 'test-article';
      const commentId = '456';
      service.delete(commentId, slug).subscribe();
      const req = httpMock.expectOne(`/articles/${slug}/comments/${commentId}`);
      req.flush(null);
    });

    it('should handle UUID comment ID', () => {
      const slug = 'test-article';
      const commentId = '550e8400-e29b-41d4-a716-446655440000';
      service.delete(commentId, slug).subscribe();
      const req = httpMock.expectOne(`/articles/${slug}/comments/${commentId}`);
      req.flush(null);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle add then delete sequence', async () => {
      const slug = 'test-article';
      const commentBody = 'Test comment';
      const addPromise = firstValueFrom(service.add(slug, commentBody));
      const addReq = httpMock.expectOne(`/articles/${slug}/comments`);
      addReq.flush({ comment: mockComment });
      const comment = await addPromise;
      expect(comment.body).toBe(commentBody);
      const deletePromise = firstValueFrom(service.delete(comment.id, slug));
      const deleteReq = httpMock.expectOne(`/articles/${slug}/comments/${comment.id}`);
      deleteReq.flush(null);
      await deletePromise;
      expect(true).toBe(true);
    });

    it('should handle getAll then add sequence', async () => {
      const slug = 'test-article';
      const commentBody = 'New comment';
      const getAllPromise = firstValueFrom(service.getAll(slug));
      const getAllReq = httpMock.expectOne(`/articles/${slug}/comments`);
      getAllReq.flush({ comments: mockComments });
      const comments = await getAllPromise;
      expect(comments.length).toBe(2);
      const addPromise = firstValueFrom(service.add(slug, commentBody));
      const addReq = httpMock.expectOne(`/articles/${slug}/comments`);
      addReq.flush({ comment: { ...mockComment, body: commentBody } });
      const newComment = await addPromise;
      expect(newComment.body).toBe(commentBody);
    });

    it('should handle multiple operations on same article', async () => {
      const slug = 'test-article';
      const getPromise1 = firstValueFrom(service.getAll(slug));
      const getReq1 = httpMock.expectOne(`/articles/${slug}/comments`);
      getReq1.flush({ comments: mockComments });
      const comments = await getPromise1;
      expect(comments.length).toBe(2);
      const addPromise = firstValueFrom(service.add(slug, 'New comment'));
      const addReq = httpMock.expectOne(`/articles/${slug}/comments`);
      addReq.flush({ comment: mockComment });
      await addPromise;
      const getPromise2 = firstValueFrom(service.getAll(slug));
      const getReq2 = httpMock.expectOne(`/articles/${slug}/comments`);
      getReq2.flush({ comments: [...mockComments, mockComment] });
      const updatedComments = await getPromise2;
      expect(updatedComments.length).toBe(3);
    });
  });

  describe('Edge cases', () => {
    it('should handle comment with only whitespace', async () => {
      const slug = 'test-article';
      const whitespaceComment = '   ';
      const errorResponse = { status: 422, statusText: 'Unprocessable Entity' };
      const promise = firstValueFrom(service.add(slug, whitespaceComment));
      const req = httpMock.expectOne(`/articles/${slug}/comments`);
      req.flush('Comment cannot be empty', errorResponse);
      await expect(promise).rejects.toMatchObject({ status: 422 });
    });

    it('should handle comment with HTML tags', async () => {
      const slug = 'test-article';
      const htmlComment = '<script>alert("xss")</script>';
      const promise = firstValueFrom(service.add(slug, htmlComment));
      const req = httpMock.expectOne(`/articles/${slug}/comments`);
      req.flush({ comment: { ...mockComment, body: htmlComment } });
      const comment = await promise;
      expect(comment.body).toBe(htmlComment);
    });

    it('should handle comment with markdown', async () => {
      const slug = 'test-article';
      const markdownComment = '**Bold** and *italic* text';
      const promise = firstValueFrom(service.add(slug, markdownComment));
      const req = httpMock.expectOne(`/articles/${slug}/comments`);
      req.flush({ comment: { ...mockComment, body: markdownComment } });
      const comment = await promise;
      expect(comment.body).toBe(markdownComment);
    });
  });
});
