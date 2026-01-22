import express from 'express';
import cookieParser from 'cookie-parser';
import { register, login } from '../src/controllers/auth.controller.js';
import { authenticate } from '../src/middlewares/auth.middleware.js';
import monitorRoutes from './routes/monitor.routes.js';
import incidentRoutes from './routes/incident.routes.js';
import alertChannelRoutes from './routes/alertChannel.routes.js';
import devRoutes from './routes/dev.routes.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger.js';

const app = express();

app.use(express.json());
app.use(cookieParser()); 

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/docs', (req, res) => res.redirect('/api-docs'));

// Public Routes
app.post('/auth/register', register);
app.post('/auth/login', login);
app.use('/api/monitors', monitorRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/v1/alert-channels', alertChannelRoutes);

// Dev-only routes
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/dev', devRoutes);
}

// Protected Routes
app.get('/profile', authenticate, (req, res) => {
  res.json({ message: 'This is protected data', user: req.user });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
