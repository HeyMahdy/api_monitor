import express from 'express';
import cookieParser from 'cookie-parser';
import { register, login } from '../src/controllers/auth.controller.js';
import { authenticate } from '../src/middlewares/auth.middleware.js';
import monitorRoutes from './routes/monitor.routes.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger.js';

const app = express();

app.use(express.json());
app.use(cookieParser()); // Essential for reading cookies

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/docs', (req, res) => res.redirect('/api-docs'));

// Public Routes
app.post('/auth/register', register);
app.post('/auth/login', login);
app.use('/api/monitors', monitorRoutes);
// Protected Routes
app.get('/profile', authenticate, (req, res) => {
  res.json({ message: 'This is protected data', user: req.user });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
