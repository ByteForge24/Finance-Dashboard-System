import { User } from './user.js';

export type PublicUser = Omit<User, 'passwordHash'>;
