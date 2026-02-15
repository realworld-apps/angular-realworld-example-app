import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'defaultImage', standalone: true })
export class DefaultImagePipe implements PipeTransform {
  transform(image: string | null | undefined): string {
    return image || '/assets/images/default-avatar.svg';
  }
}
