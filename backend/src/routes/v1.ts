import { Router } from 'express';
import authRouter from '../modules/auth/auth.routes.js';
import usersRouter from '../modules/users/users.routes.js';
import recordsRouter from '../modules/records/records.routes.js';
import dashboardRouter from '../modules/dashboard/dashboard.routes.js';

const v1Router = Router();

v1Router.use('/auth', authRouter);
v1Router.use('/users', usersRouter);
v1Router.use('/records', recordsRouter);
v1Router.use('/dashboard', dashboardRouter);

export default v1Router;
