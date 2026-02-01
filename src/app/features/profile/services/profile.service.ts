import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { Profile } from '../models/profile.model';
import { HttpClient } from '@angular/common/http';

/**
 * ProfileService - Fetches public profile data for any user by username.
 *
 * Note: This is different from UserService which uses GET /user:
 * - GET /profiles/:username → Public profile for any user (this service)
 * - GET /user → Current authenticated user's own data (UserService)
 */
@Injectable({ providedIn: 'root' })
export class ProfileService {
  constructor(private readonly http: HttpClient) {}

  get(username: string): Observable<Profile> {
    return this.http.get<{ profile: Profile }>('/profiles/' + username).pipe(
      map((data: { profile: Profile }) => data.profile),
      shareReplay(1),
    );
  }

  follow(username: string): Observable<Profile> {
    return this.http
      .post<{ profile: Profile }>('/profiles/' + username + '/follow', {})
      .pipe(map((data: { profile: Profile }) => data.profile));
  }

  unfollow(username: string): Observable<Profile> {
    return this.http
      .delete<{ profile: Profile }>('/profiles/' + username + '/follow')
      .pipe(map((data: { profile: Profile }) => data.profile));
  }
}
