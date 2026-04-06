import { User } from './user.js';
import { PublicUser } from './public-user.js';

export function toPublicUser(user: User): PublicUser {
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}
