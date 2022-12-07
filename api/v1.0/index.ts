import express from 'express';
import auditLog from './audit-log';
import categoriesRouter from './categories';
import dashboardRouter from './dashboard';
import daysRouter from './days';
import eventsRouter from './events';
import galleryRouter from './gallery';
import merchandiseRouter from './merchandise';
import proShowsRouter from './pro-shows';
import sessionRouter from './session';
import settingsRouter from './settings';
import sponsorsRouter from './sponsors';
import teamRouter from './team';
import usersRouter from './users';
import venuesRouter from './venues';

const version_1_0 = express.Router();

version_1_0.use('/dashboard', dashboardRouter);
version_1_0.use('/settings', settingsRouter);
version_1_0.use('/users', usersRouter);
version_1_0.use('/session', sessionRouter);
version_1_0.use('/audit-log', auditLog);
version_1_0.use('/days', daysRouter);
version_1_0.use('/categories', categoriesRouter);
version_1_0.use('/venues', venuesRouter);
version_1_0.use('/events', eventsRouter);
version_1_0.use('/pro-shows', proShowsRouter);
version_1_0.use('/gallery', galleryRouter);
version_1_0.use('/merchandise', merchandiseRouter);
version_1_0.use('/sponsors', sponsorsRouter);
version_1_0.use('/team', teamRouter);

version_1_0.all('/*', (req, res) => {
  res.status(404).json({
    error: 'Invalid API endpoint or request method used.'
  });
});

export default version_1_0;
