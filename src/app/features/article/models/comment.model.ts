import { ProfileModel } from '../../profile/models/profile-model';

export interface Comment {
  id: string;
  body: string;
  createdAt: string;
  author: ProfileModel;
}
