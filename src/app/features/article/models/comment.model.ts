import { Profile } from '../../profile/models/profile.model';

export interface Comment {
  id: string;
  body: string;
  createdAt: string;
  status: string;
  author: Profile;
}
