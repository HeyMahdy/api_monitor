import swaggerJsdoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'API Monitor',
    version: '1.0.0',
    description: 'API documentation for the API monitoring service',
  },
  servers: [
    {
      url: 'http://localhost:3000',
    },
  ],
};

const options = {
  swaggerDefinition,
  // JSDoc comments live in a separate file
  apis: ['./src/docs/swaggerDocs.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
export { swaggerSpec };
