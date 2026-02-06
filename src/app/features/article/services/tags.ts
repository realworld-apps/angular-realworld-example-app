import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class Tags {
  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<string[]> {
    return this.http.get<{ tags: string[] }>('/tags').pipe(map(data => data.tags));
  }
}
