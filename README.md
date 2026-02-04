# API Monitor

A comprehensive API monitoring system that tracks the availability and health of your APIs and services with automated health checks, incident management, and multi-channel alerting.

## Features

- **API Health Monitoring**: Monitor any HTTP endpoint with customizable intervals
- **Multi-Method Support**: Support for GET, POST, PUT, PATCH, DELETE, HEAD, and OPTIONS requests
- **Automated Health Checks**: Scheduled health checks using BullMQ and Redis
- **Incident Management**: Automatic incident creation, tracking, and resolution
- **Multi-Channel Alerts**: Email, Webhook, Slack, and Discord notifications
- **Historical Data**: Complete health check history with response times and status codes
- **RESTful API**: Full-featured REST API with JWT authentication

## Documentation

- **[API Documentation](api.README.md)**: Complete API reference with all endpoints, request/response formats, and examples
- **[Sequence Diagrams](SEQUENCE_DIAGRAMS.md)**: Detailed sequence diagrams showing system flows and interactions
- **[Architecture Diagram](ARCHITECTURE.md)**: System architecture, component interactions, and database schema

## Quick Start

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure environment variables
4. Start the server: `npm start`
5. Start the worker: `npm run worker`

## Architecture

The system consists of:
- **Express.js API Server**: Handles HTTP requests and authentication
- **BullMQ Job Queue**: Manages scheduled health checks with Redis
- **PostgreSQL Database**: Stores monitors, incidents, and health check results
- **Background Workers**: Execute health checks and process alerts
- **Redis Streams**: Real-time health check result streaming

For detailed architecture and flow diagrams, see [SEQUENCE_DIAGRAMS.md](SEQUENCE_DIAGRAMS.md).

## Tech Stack

- Node.js + Express.js
- TypeScript
- PostgreSQL
- Redis + BullMQ
- Axios for HTTP requests
- JWT for authentication

## License

See LICENSE file for details.