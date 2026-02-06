import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { Profile } from './profile';
import { Profile } from '../models/profile.model';

describe('Profile', () => {
  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  let service: Profile;
  let httpMock: HttpTestingController;

  const mockProfile: Profile = {
    username: 'testuser',
    bio: 'Test bio',
    image: 'https://example.com/avatar.jpg',
    following: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [Profile],
    });

    service = TestBed.inject(Profile);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('get', () => {
    it('should fetch profile by username', async () => {
      const username = 'testuser';
      const promise = firstValueFrom(service.get(username));
      const req = httpMock.expectOne(`/profiles/${username}`);
      expect(req.request.method).toBe('GET');
      req.flush({ profile: mockProfile });
      const profile = await promise;
      expect(profile).toEqual(mockProfile);
    });

    it('should extract profile from response wrapper', async () => {
      const username = 'testuser';
      const promise = firstValueFrom(service.get(username));
      const req = httpMock.expectOne(`/profiles/${username}`);
      req.flush({ profile: mockProfile });
      const profile = await promise;
      expect(profile).toEqual(mockProfile);
      expect((profile as any).profile).toBeUndefined();
    });

    it('should handle profile not found', async () => {
      const username = 'nonexistent';
      const errorResponse = { status: 404, statusText: 'Not Found' };
      const promise = firstValueFrom(service.get(username));
      const req = httpMock.expectOne(`/profiles/${username}`);
      req.flush('Profile not found', errorResponse);
      await expect(promise).rejects.toMatchObject({ status: 404 });
    });

    it('should handle username with special characters', () => {
      const username = 'user-name_123';
      service.get(username).subscribe();
      const req = httpMock.expectOne(`/profiles/${username}`);
      req.flush({ profile: { ...mockProfile, username } });
    });

    it('should share replay the result', () => {
      const username = 'testuser';
      const observable = service.get(username);
      observable.subscribe();
      observable.subscribe();
      const requests = httpMock.match(`/profiles/${username}`);
      expect(requests.length).toBe(1);
      requests[0].flush({ profile: mockProfile });
    });

    it('should handle profile with null bio', async () => {
      const username = 'testuser';
      const profileWithNullBio = { ...mockProfile, bio: null };
      const promise = firstValueFrom(service.get(username));
      const req = httpMock.expectOne(`/profiles/${username}`);
      req.flush({ profile: profileWithNullBio });
      const profile = await promise;
      expect(profile.bio).toBeNull();
    });

    it('should handle profile with empty image', async () => {
      const username = 'testuser';
      const profileWithEmptyImage = { ...mockProfile, image: '' };
      const promise = firstValueFrom(service.get(username));
      const req = httpMock.expectOne(`/profiles/${username}`);
      req.flush({ profile: profileWithEmptyImage });
      const profile = await promise;
      expect(profile.image).toBe('');
    });

    it('should handle following status true', async () => {
      const username = 'followeduser';
      const followedProfile = { ...mockProfile, username, following: true };
      const promise = firstValueFrom(service.get(username));
      const req = httpMock.expectOne(`/profiles/${username}`);
      req.flush({ profile: followedProfile });
      const profile = await promise;
      expect(profile.following).toBe(true);
    });

    it('should handle unauthorized access', async () => {
      const username = 'privateuser';
      const errorResponse = { status: 401, statusText: 'Unauthorized' };
      const promise = firstValueFrom(service.get(username));
      const req = httpMock.expectOne(`/profiles/${username}`);
      req.flush('Unauthorized', errorResponse);
      await expect(promise).rejects.toMatchObject({ status: 401 });
    });

    it('should handle server error', async () => {
      const username = 'testuser';
      const errorResponse = { status: 500, statusText: 'Server Error' };
      const promise = firstValueFrom(service.get(username));
      const req = httpMock.expectOne(`/profiles/${username}`);
      req.flush('Server error', errorResponse);
      await expect(promise).rejects.toMatchObject({ status: 500 });
    });
  });

  describe('follow', () => {
    it('should follow a user', async () => {
      const username = 'usertofollow';
      const followedProfile = { ...mockProfile, username, following: true };
      const promise = firstValueFrom(service.follow(username));
      const req = httpMock.expectOne(`/profiles/${username}/follow`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush({ profile: followedProfile });
      const profile = await promise;
      expect(profile.following).toBe(true);
      expect(profile.username).toBe(username);
    });

    it('should extract profile from response wrapper', async () => {
      const username = 'testuser';
      const followedProfile = { ...mockProfile, following: true };
      const promise = firstValueFrom(service.follow(username));
      const req = httpMock.expectOne(`/profiles/${username}/follow`);
      req.flush({ profile: followedProfile });
      const profile = await promise;
      expect((profile as any).profile).toBeUndefined();
    });

    it('should handle already following', async () => {
      const username = 'alreadyfollowed';
      const alreadyFollowedProfile = { ...mockProfile, username, following: true };
      const promise = firstValueFrom(service.follow(username));
      const req = httpMock.expectOne(`/profiles/${username}/follow`);
      req.flush({ profile: alreadyFollowedProfile });
      const profile = await promise;
      expect(profile.following).toBe(true);
    });

    it('should handle follow error', async () => {
      const username = 'cannotfollow';
      const errorResponse = { status: 403, statusText: 'Forbidden' };
      const promise = firstValueFrom(service.follow(username));
      const req = httpMock.expectOne(`/profiles/${username}/follow`);
      req.flush('Cannot follow', errorResponse);
      await expect(promise).rejects.toMatchObject({ status: 403 });
    });

    it('should handle unauthorized follow', async () => {
      const username = 'someuser';
      const errorResponse = { status: 401, statusText: 'Unauthorized' };
      const promise = firstValueFrom(service.follow(username));
      const req = httpMock.expectOne(`/profiles/${username}/follow`);
      req.flush('Must be logged in', errorResponse);
      await expect(promise).rejects.toMatchObject({ status: 401 });
    });

    it('should handle user not found', async () => {
      const username = 'nonexistent';
      const errorResponse = { status: 404, statusText: 'Not Found' };
      const promise = firstValueFrom(service.follow(username));
      const req = httpMock.expectOne(`/profiles/${username}/follow`);
      req.flush('User not found', errorResponse);
      await expect(promise).rejects.toMatchObject({ status: 404 });
    });

    it('should send empty body in POST request', () => {
      const username = 'testuser';
      service.follow(username).subscribe();
      const req = httpMock.expectOne(`/profiles/${username}/follow`);
      expect(req.request.body).toEqual({});
      req.flush({ profile: { ...mockProfile, following: true } });
    });
  });

  describe('unfollow', () => {
    it('should unfollow a user', async () => {
      const username = 'usertounfollow';
      const unfollowedProfile = { ...mockProfile, username, following: false };
      const promise = firstValueFrom(service.unfollow(username));
      const req = httpMock.expectOne(`/profiles/${username}/follow`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ profile: unfollowedProfile });
      const profile = await promise;
      expect(profile.following).toBe(false);
      expect(profile.username).toBe(username);
    });

    it('should extract profile from response wrapper', async () => {
      const username = 'testuser';
      const unfollowedProfile = { ...mockProfile, following: false };
      const promise = firstValueFrom(service.unfollow(username));
      const req = httpMock.expectOne(`/profiles/${username}/follow`);
      req.flush({ profile: unfollowedProfile });
      const profile = await promise;
      expect((profile as any).profile).toBeUndefined();
    });

    it('should handle already not following', async () => {
      const username = 'notfollowed';
      const notFollowedProfile = { ...mockProfile, username, following: false };
      const promise = firstValueFrom(service.unfollow(username));
      const req = httpMock.expectOne(`/profiles/${username}/follow`);
      req.flush({ profile: notFollowedProfile });
      const profile = await promise;
      expect(profile.following).toBe(false);
    });

    it('should handle unfollow error', async () => {
      const username = 'cannotunfollow';
      const errorResponse = { status: 403, statusText: 'Forbidden' };
      const promise = firstValueFrom(service.unfollow(username));
      const req = httpMock.expectOne(`/profiles/${username}/follow`);
      req.flush('Cannot unfollow', errorResponse);
      await expect(promise).rejects.toMatchObject({ status: 403 });
    });

    it('should handle unauthorized unfollow', async () => {
      const username = 'someuser';
      const errorResponse = { status: 401, statusText: 'Unauthorized' };
      const promise = firstValueFrom(service.unfollow(username));
      const req = httpMock.expectOne(`/profiles/${username}/follow`);
      req.flush('Must be logged in', errorResponse);
      await expect(promise).rejects.toMatchObject({ status: 401 });
    });

    it('should handle user not found', async () => {
      const username = 'nonexistent';
      const errorResponse = { status: 404, statusText: 'Not Found' };
      const promise = firstValueFrom(service.unfollow(username));
      const req = httpMock.expectOne(`/profiles/${username}/follow`);
      req.flush('User not found', errorResponse);
      await expect(promise).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('Integration scenarios', () => {
    it('should handle follow then unfollow sequence', async () => {
      const username = 'testuser';
      const followPromise = firstValueFrom(service.follow(username));
      const followReq = httpMock.expectOne(`/profiles/${username}/follow`);
      followReq.flush({ profile: { ...mockProfile, following: true } });
      const profile = await followPromise;
      expect(profile.following).toBe(true);
      const unfollowPromise = firstValueFrom(service.unfollow(username));
      const unfollowReq = httpMock.expectOne(`/profiles/${username}/follow`);
      unfollowReq.flush({ profile: { ...mockProfile, following: false } });
      const unfollowedProfile = await unfollowPromise;
      expect(unfollowedProfile.following).toBe(false);
    });

    it('should handle get then follow sequence', async () => {
      const username = 'testuser';
      const getPromise = firstValueFrom(service.get(username));
      const getReq = httpMock.expectOne(`/profiles/${username}`);
      getReq.flush({ profile: mockProfile });
      const profile = await getPromise;
      expect(profile.following).toBe(false);
      const followPromise = firstValueFrom(service.follow(username));
      const followReq = httpMock.expectOne(`/profiles/${username}/follow`);
      followReq.flush({ profile: { ...mockProfile, following: true } });
      const followedProfile = await followPromise;
      expect(followedProfile.following).toBe(true);
    });

    it('should handle multiple profile fetches with shareReplay', () => {
      const username = 'testuser';
      const observable = service.get(username);
      observable.subscribe();
      observable.subscribe();
      observable.subscribe();
      const requests = httpMock.match(`/profiles/${username}`);
      expect(requests.length).toBe(1);
      requests[0].flush({ profile: mockProfile });
    });
  });

  describe('Edge cases', () => {
    it('should handle username with numbers', () => {
      const username = 'user123';
      service.get(username).subscribe();
      const req = httpMock.expectOne(`/profiles/${username}`);
      req.flush({ profile: { ...mockProfile, username } });
    });

    it('should handle username with hyphens', () => {
      const username = 'user-name';
      service.get(username).subscribe();
      const req = httpMock.expectOne(`/profiles/${username}`);
      req.flush({ profile: { ...mockProfile, username } });
    });

    it('should handle username with underscores', () => {
      const username = 'user_name';
      service.get(username).subscribe();
      const req = httpMock.expectOne(`/profiles/${username}`);
      req.flush({ profile: { ...mockProfile, username } });
    });

    it('should handle very long username', () => {
      const username = 'a'.repeat(50);
      service.get(username).subscribe();
      const req = httpMock.expectOne(`/profiles/${username}`);
      req.flush({ profile: { ...mockProfile, username } });
    });

    it('should handle profile with very long bio', async () => {
      const longBio = 'a'.repeat(1000);
      const profileWithLongBio = { ...mockProfile, bio: longBio };
      const promise = firstValueFrom(service.get('testuser'));
      const req = httpMock.expectOne('/profiles/testuser');
      req.flush({ profile: profileWithLongBio });
      const profile = await promise;
      expect(profile.bio).toBe(longBio);
    });
  });
});
