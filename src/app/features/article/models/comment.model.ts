import { Profile } from '../../profile/models/profile.model';

export interface Comment {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: Profile;
}
