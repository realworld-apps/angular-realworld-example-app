import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { ProfileModel } from '../models/profile.model';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ProfileDataAccess {
  constructor(private readonly http: HttpClient) {}

  get(username: string): Observable<ProfileModel> {
    return this.http.get<{ profile: ProfileModel }>('/profiles/' + username).pipe(
      map((data: { profile: ProfileModel }) => data.profile),
      shareReplay(1),
    );
  }

  follow(username: string): Observable<ProfileModel> {
    return this.http
      .post<{ profile: ProfileModel }>('/profiles/' + username + '/follow', {})
      .pipe(map((data: { profile: ProfileModel }) => data.profile));
  }

  unfollow(username: string): Observable<ProfileModel> {
    return this.http
      .delete<{ profile: ProfileModel }>('/profiles/' + username + '/follow')
      .pipe(map((data: { profile: ProfileModel }) => data.profile));
  }
}
