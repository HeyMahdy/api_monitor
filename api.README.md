# API Documentation - API Monitor

Complete API reference for the API Monitor web application. This document covers all endpoints, input/output formats, authentication requirements, and error responses.

## Table of Contents

- [Base URL](#base-url)
- [Authentication](#authentication)
- [Auth APIs](#auth-apis)
- [Monitor APIs](#monitor-apis)
- [Alert Channel APIs](#alert-channel-apis)
- [Incident APIs](#incident-apis)
- [Development APIs](#development-apis)
- [Error Handling](#error-handling)

---

## Base URL

```
http://localhost:3000
```

---

## Authentication

Most endpoints require authentication via JWT token. Include the token in the request header:

```
Authorization: Bearer <JWT_TOKEN>
```

The token is returned from the login endpoint and should be stored in cookies or local storage.

---

## Auth APIs

### 1. User Registration

**Endpoint:** `POST /auth/register`

**Authentication:** Not required

**Description:** Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Success Response (201):**
```json
{
  "message": "User created"
}
```

**Error Response (500):**
```json
{
  "error": "Email already exists"
}
```

---

### 2. User Login

**Endpoint:** `POST /auth/login`

**Authentication:** Not required

**Description:** Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Success Response (200):**
```json
{
  "message": "Logged in successfully",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (401):**
```json
{
  "error": "Invalid credentials"
}
```

---

## Monitor APIs

Monitors track the availability and health of your APIs and services.

### 3. Create Monitor

**Endpoint:** `POST /api/monitors`

**Authentication:** Required

**Description:** Create a new monitor for a URL.

**Request Body:**
```json
{
  "name": "My API Health Check",
  "url": "https://api.example.com/health",
  "method": "GET",
  "request_header": {
    "Authorization": "Bearer token123",
    "Content-Type": "application/json"
  },
  "check_interval": 60,
  "timeout": 10,
  "request_body": {
    "key": "value"
  },
  "is_active": false,
  "status": "PENDING"
}
```

**Field Descriptions:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | Yes | Monitor name |
| url | string | Yes | Must be valid URL |
| method | enum | Yes | GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS |
| request_header | object | No | Custom headers for request |
| check_interval | number | Yes | Minimum 10 seconds |
| timeout | number | Yes | Minimum 1 second |
| request_body | object | No | Request body payload |
| is_active | boolean | No | Default: false |
| status | enum | No | PENDING, UP, DOWN, PAUSED (default: PENDING) |

**Success Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "660e8400-e29b-41d4-a716-446655440111",
  "name": "My API Health Check",
  "url": "https://api.example.com/health",
  "method": "GET",
  "request_header": {
    "Authorization": "Bearer token123",
    "Content-Type": "application/json"
  },
  "check_interval": 60,
  "timeout": 10,
  "request_body": {
    "key": "value"
  },
  "is_active": false,
  "status": "PENDING",
  "created_at": "2026-02-03T10:00:00Z",
  "updated_at": "2026-02-03T10:00:00Z",
  "last_checked_at": null
}
```

**Error Response (400/401/500):**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "number",
      "path": ["check_interval"]
    }
  ]
}
```

---

### 4. Get All User Monitors

**Endpoint:** `GET /api/monitors`

**Authentication:** Required

**Description:** Retrieve all monitors belonging to the authenticated user.

**Query Parameters:** None

**Success Response (200):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "660e8400-e29b-41d4-a716-446655440111",
    "name": "My API Health Check",
    "url": "https://api.example.com/health",
    "method": "GET",
    "request_header": {},
    "check_interval": 60,
    "timeout": 10,
    "request_body": {},
    "is_active": true,
    "status": "UP",
    "created_at": "2026-02-03T10:00:00Z",
    "updated_at": "2026-02-03T10:00:00Z",
    "last_checked_at": "2026-02-03T10:05:00Z"
  }
]
```

**Error Response (401/500):**
```json
{
  "error": "Unauthorized"
}
```

---

### 5. Get Specific Monitor

**Endpoint:** `GET /api/monitors/:id`

**Authentication:** Required

**Description:** Retrieve a specific monitor by ID (with ownership verification).

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Monitor ID (UUID) |

**Success Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "660e8400-e29b-41d4-a716-446655440111",
  "name": "My API Health Check",
  "url": "https://api.example.com/health",
  "method": "GET",
  "request_header": {},
  "check_interval": 60,
  "timeout": 10,
  "request_body": {},
  "is_active": true,
  "status": "UP",
  "created_at": "2026-02-03T10:00:00Z",
  "updated_at": "2026-02-03T10:00:00Z",
  "last_checked_at": "2026-02-03T10:05:00Z"
}
```

**Error Responses:**
- (401) Unauthorized
- (403) Unauthorized access to this monitor
- (404) Monitor not found
- (500) Internal Server Error

---

### 6. Update Monitor

**Endpoint:** `PATCH /api/monitors/:id`

**Authentication:** Required

**Description:** Partially update a monitor. All fields are optional.

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Monitor ID (UUID) |

**Request Body (all optional):**
```json
{
  "name": "Updated Monitor Name",
  "url": "https://api.example.com/new-endpoint",
  "method": "POST",
  "request_header": {},
  "check_interval": 120,
  "timeout": 20,
  "request_body": {},
  "is_active": true,
  "status": "UP"
}
```

**Note:** If the monitor is active after update, it will be automatically rescheduled with the new settings.

**Success Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "660e8400-e29b-41d4-a716-446655440111",
  "name": "Updated Monitor Name",
  "url": "https://api.example.com/new-endpoint",
  "method": "POST",
  "request_header": {},
  "check_interval": 120,
  "timeout": 20,
  "request_body": {},
  "is_active": true,
  "status": "UP",
  "created_at": "2026-02-03T10:00:00Z",
  "updated_at": "2026-02-03T10:15:00Z",
  "last_checked_at": "2026-02-03T10:05:00Z"
}
```

**Error Responses:**
- (400) Validation error
- (404) Monitor not found or unauthorized
- (500) Internal Server Error

---

### 7. Delete Monitor

**Endpoint:** `DELETE /api/monitors/:id`

**Authentication:** Required

**Description:** Permanently delete a monitor and stop all health checks.

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Monitor ID (UUID) |

**Success Response (204):** No Content

**Error Responses:**
- (401) Unauthorized
- (404) Monitor not found or unauthorized
- (500) Internal Server Error

---

### 8. Start Monitor

**Endpoint:** `POST /api/monitors/start/:id`

**Authentication:** Required

**Description:** Activate a monitor and begin health checks.

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Monitor ID (UUID) |

**Success Response (200):**
```json
{
  "message": "success"
}
```

**Error Response (404):**
```json
{
  "error": "error occured while activating monitor"
}
```

---

### 9. Pause Monitor

**Endpoint:** `POST /api/monitors/pause/:id`

**Authentication:** Required

**Description:** Pause a monitor and stop health checks temporarily.

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Monitor ID (UUID) |

**Success Response (200):**
```json
{
  "message": "success"
}
```

**Error Response (500):**
```json
{
  "error": "error occured while pausing monitor"
}
```

---

### 10. Resume Monitor

**Endpoint:** `POST /api/monitors/resume/:id`

**Authentication:** Required

**Description:** Resume a paused monitor and restart health checks.

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Monitor ID (UUID) |

**Success Response (200):**
```json
{
  "message": "success"
}
```

**Error Response (500):**
```json
{
  "error": "error occured while resuming monitor"
}
```

---

### 11. Get Monitor History

**Endpoint:** `GET /api/monitors/:id/history`

**Authentication:** Required

**Description:** Retrieve health check history for a monitor (paginated).

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Monitor ID (UUID) |

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number for pagination |
| limit | number | 10 | Results per page |

**Success Response (200):**
```json
[
  {
    "id": "770e8400-e29b-41d4-a716-446655440222",
    "monitor_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": true,
    "response_time_ms": 245,
    "status_code": 200,
    "error_type": null,
    "error_message": null,
    "timestamp": "2026-02-03T10:05:00Z"
  },
  {
    "id": "770e8400-e29b-41d4-a716-446655440223",
    "monitor_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": false,
    "response_time_ms": 5000,
    "status_code": null,
    "error_type": "TimeoutError",
    "error_message": "Request timeout",
    "timestamp": "2026-02-03T10:04:00Z"
  }
]
```

**Error Responses:**
- (401) Unauthorized
- (403) Unauthorized access
- (404) Monitor not found
- (500) Internal Server Error

---

## Alert Channel APIs

Alert channels define how notifications are sent when monitors detect issues.

### 12. Create Alert Channel

**Endpoint:** `POST /api/v1/alert-channels`

**Authentication:** Required

**Description:** Create a new alert notification channel.

**Request Body:**
```json
{
  "type": "EMAIL",
  "name": "Team Email Alerts",
  "config": {
    "email": "team@example.com"
  }
}
```

**Supported Types:**
- `EMAIL` - Email notifications
- `WEBHOOK` - HTTP webhook notifications
- `SLACK` - Slack channel notifications
- `DISCORD` - Discord channel notifications

**Config Examples by Type:**

**EMAIL:**
```json
{
  "email": "alerts@example.com"
}
```

**WEBHOOK:**
```json
{
  "url": "https://your-webhook.example.com/alerts",
  "method": "POST",
  "headers": {
    "Authorization": "Bearer token"
  }
}
```

**SLACK:**
```json
{
  "webhook_url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
}
```

**DISCORD:**
```json
{
  "webhook_url": "https://discord.com/api/webhooks/YOUR/WEBHOOK"
}
```

**Success Response (201):**
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440333",
  "user_id": "660e8400-e29b-41d4-a716-446655440111",
  "type": "EMAIL",
  "name": "Team Email Alerts",
  "config": {
    "email": "team@example.com"
  },
  "created_at": "2026-02-03T10:00:00Z",
  "updated_at": "2026-02-03T10:00:00Z"
}
```

**Error Response (500):**
```json
{
  "error": "Failed to create alert channel"
}
```

---

### 13. List Alert Channels

**Endpoint:** `GET /api/v1/alert-channels`

**Authentication:** Required

**Description:** Retrieve all alert channels for the authenticated user.

**Success Response (200):**
```json
[
  {
    "id": "880e8400-e29b-41d4-a716-446655440333",
    "user_id": "660e8400-e29b-41d4-a716-446655440111",
    "type": "EMAIL",
    "name": "Team Email Alerts",
    "config": {
      "email": "team@example.com"
    },
    "created_at": "2026-02-03T10:00:00Z",
    "updated_at": "2026-02-03T10:00:00Z"
  }
]
```

**Error Response (500):**
```json
{
  "error": "Failed to list alert channels"
}
```

---

### 14. Update Alert Channel

**Endpoint:** `PATCH /api/v1/alert-channels/:id`

**Authentication:** Required

**Description:** Update an alert channel (all fields optional).

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Alert Channel ID (UUID) |

**Request Body (all optional):**
```json
{
  "type": "SLACK",
  "name": "Updated Channel Name",
  "config": {
    "webhook_url": "https://hooks.slack.com/services/NEW/WEBHOOK/URL"
  }
}
```

**Success Response (200):**
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440333",
  "user_id": "660e8400-e29b-41d4-a716-446655440111",
  "type": "SLACK",
  "name": "Updated Channel Name",
  "config": {
    "webhook_url": "https://hooks.slack.com/services/NEW/WEBHOOK/URL"
  },
  "created_at": "2026-02-03T10:00:00Z",
  "updated_at": "2026-02-03T10:15:00Z"
}
```

**Error Responses:**
- (404) Alert channel not found
- (500) Failed to update alert channel

---

### 15. Delete Alert Channel

**Endpoint:** `DELETE /api/v1/alert-channels/:id`

**Authentication:** Required

**Description:** Delete an alert channel.

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Alert Channel ID (UUID) |

**Success Response (200):**
```json
{
  "message": "Alert channel deleted successfully"
}
```

**Error Responses:**
- (404) Alert channel not found
- (500) Failed to delete alert channel

---

### 16. Test Alert Channel

**Endpoint:** `POST /api/v1/alert-channels/:id/test`

**Authentication:** Required

**Description:** Send a test notification to verify the alert channel configuration.

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Alert Channel ID (UUID) |

**Success Response (200):**
```json
{
  "message": "Test notification sent successfully"
}
```

**Error Responses:**
- (400) Failed to send test notification
- (500) Failed to test alert channel

---

## Incident APIs

Incidents are created when monitors detect failures and track their lifecycle from detection to resolution.

### 17. Create Incident

**Endpoint:** `POST /api/incidents`

**Authentication:** Required

**Description:** Create a new incident (typically called by the system when a monitor fails).

**Request Body:**
```json
{
  "monitor_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "OPEN",
  "severity": "CRITICAL",
  "failure_count": 1,
  "error_message": "Connection timeout after 10 seconds"
}
```

**Field Descriptions:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| monitor_id | string | Yes | Monitor ID that triggered incident |
| status | enum | No | OPEN, ACKNOWLEDGED, RESOLVED (default: OPEN) |
| severity | enum | No | CRITICAL, WARNING, INFO (default: CRITICAL) |
| failure_count | number | No | Default: 1, minimum: 1 |
| error_message | string | No | Description of the error |

**Success Response (201):**
```json
{
  "id": 1,
  "monitor_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "OPEN",
  "severity": "CRITICAL",
  "failure_count": 1,
  "error_message": "Connection timeout after 10 seconds",
  "started_at": "2026-02-03T10:00:00Z",
  "resolved_at": null,
  "acknowledged_at": null
}
```

**Error Response (500):**
```json
{
  "error": "Failed to create incident"
}
```

---

### 18. Get Incident by ID

**Endpoint:** `GET /api/incidents/:id`

**Authentication:** Required

**Description:** Retrieve a specific incident by ID.

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Incident ID |

**Success Response (200):**
```json
{
  "id": 1,
  "monitor_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "OPEN",
  "severity": "CRITICAL",
  "failure_count": 1,
  "error_message": "Connection timeout after 10 seconds",
  "started_at": "2026-02-03T10:00:00Z",
  "resolved_at": null,
  "acknowledged_at": null
}
```

**Error Responses:**
- (404) Incident not found
- (500) Failed to fetch incident

---

### 19. Get Monitor Incidents

**Endpoint:** `GET /api/monitors/:monitorId/incidents`

**Authentication:** Required

**Description:** Retrieve all incidents for a specific monitor (paginated).

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| monitorId | string | Yes | Monitor ID (UUID) |

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | number | 50 | Results per page |
| offset | number | 0 | Pagination offset |

**Success Response (200):**
```json
{
  "incidents": [
    {
      "id": 1,
      "monitor_id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "RESOLVED",
      "severity": "CRITICAL",
      "failure_count": 3,
      "error_message": "Connection timeout",
      "started_at": "2026-02-03T10:00:00Z",
      "resolved_at": "2026-02-03T10:15:00Z",
      "acknowledged_at": "2026-02-03T10:05:00Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "count": 1
  }
}
```

**Error Response (500):**
```json
{
  "error": "Failed to fetch incidents"
}
```

---

### 20. Get All Open Incidents

**Endpoint:** `GET /api/incidents/open`

**Authentication:** Required

**Description:** Retrieve all open incidents across all monitors.

**Success Response (200):**
```json
[
  {
    "id": 1,
    "monitor_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "OPEN",
    "severity": "CRITICAL",
    "failure_count": 5,
    "error_message": "Service unavailable",
    "started_at": "2026-02-03T10:00:00Z",
    "resolved_at": null,
    "acknowledged_at": null
  },
  {
    "id": 2,
    "monitor_id": "550e8400-e29b-41d4-a716-446655440001",
    "status": "ACKNOWLEDGED",
    "severity": "WARNING",
    "failure_count": 2,
    "error_message": "High response time",
    "started_at": "2026-02-03T09:30:00Z",
    "resolved_at": null,
    "acknowledged_at": "2026-02-03T09:35:00Z"
  }
]
```

**Error Response (500):**
```json
{
  "error": "Failed to fetch open incidents"
}
```

---

### 21. Acknowledge Incident

**Endpoint:** `PATCH /api/incidents/:id/acknowledge`

**Authentication:** Required

**Description:** Mark an incident as acknowledged (someone is working on it).

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Incident ID |

**Success Response (200):**
```json
{
  "id": 1,
  "monitor_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "ACKNOWLEDGED",
  "severity": "CRITICAL",
  "failure_count": 5,
  "error_message": "Service unavailable",
  "started_at": "2026-02-03T10:00:00Z",
  "resolved_at": null,
  "acknowledged_at": "2026-02-03T10:05:00Z"
}
```

**Error Responses:**
- (404) No open incident found for this monitor
- (500) Failed to acknowledge incident

---

### 22. Resolve Incident

**Endpoint:** `PATCH /api/incidents/:id/resolve`

**Authentication:** Required

**Description:** Mark an incident as resolved (problem is fixed).

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Incident ID |

**Success Response (200):**
```json
{
  "id": 1,
  "monitor_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "RESOLVED",
  "severity": "CRITICAL",
  "failure_count": 5,
  "error_message": "Service unavailable",
  "started_at": "2026-02-03T10:00:00Z",
  "resolved_at": "2026-02-03T10:20:00Z",
  "acknowledged_at": "2026-02-03T10:05:00Z"
}
```

**Error Responses:**
- (404) No open incident found for this monitor
- (500) Failed to resolve incident

---

### 23. Delete Incident

**Endpoint:** `DELETE /api/incidents/:id`

**Authentication:** Required

**Description:** Permanently delete an incident record.

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Incident ID |

**Success Response (200):**
```json
{
  "message": "Incident deleted successfully"
}
```

**Error Responses:**
- (404) Incident not found
- (500) Failed to delete incident

---

## Development APIs

**Note:** These endpoints are only available in development mode (`NODE_ENV !== 'production'`).

### 24. Clear Database

**Endpoint:** `POST /api/dev/clear-db`

**Authentication:** Not required

**Environment:** Development only

**Description:** Clear all data from the database. **WARNING: This is destructive and irreversible.**

**Request Body:** None

**Success Response:** Varies based on implementation

---

## Error Handling

### Standard Error Response Format

All errors follow a consistent format:

```json
{
  "error": "Error message or description"
}
```

### Validation Errors

For validation failures (typically 400 status):

```json
{
  "error": "Validation Error",
  "details": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "number",
      "path": ["fieldName"]
    }
  ]
}
```

### HTTP Status Codes

| Code | Meaning | Common Cause |
|------|---------|--------------|
| 200 | OK | Successful GET/PATCH request |
| 201 | Created | Successful POST request |
| 204 | No Content | Successful DELETE request |
| 400 | Bad Request | Validation error in request body |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions (e.g., accessing another user's monitor) |
| 404 | Not Found | Resource doesn't exist |
| 500 | Internal Server Error | Server-side error |

---

## API Summary

| Category | Endpoints | Count |
|----------|-----------|-------|
| Authentication | Register, Login | 2 |
| Monitors | CRUD, Start, Pause, Resume, History | 9 |
| Alert Channels | CRUD, Test | 5 |
| Incidents | CRUD, Acknowledge, Resolve, Open, History | 7 |
| Development | Clear DB | 1 |
| **Total** | | **24** |

---

## Usage Examples

### Example: Monitor a Service

```bash
# 1. Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePassword123"
  }'

# 2. Create Monitor
curl -X POST http://localhost:3000/api/monitors \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Health",
    "url": "https://api.example.com/health",
    "method": "GET",
    "check_interval": 60,
    "timeout": 10
  }'

# 3. Start Monitor
curl -X POST http://localhost:3000/api/monitors/YOUR_MONITOR_ID/start \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Get Monitor History
curl -X GET "http://localhost:3000/api/monitors/YOUR_MONITOR_ID/history?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example: Set Up Alerts

```bash
# Create Slack Alert Channel
curl -X POST http://localhost:3000/api/v1/alert-channels \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "SLACK",
    "name": "Ops Team",
    "config": {
      "webhook_url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
    }
  }'

# Test Alert Channel
curl -X POST http://localhost:3000/api/v1/alert-channels/YOUR_CHANNEL_ID/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Rate Limiting

Currently, there are no rate limits implemented. Consider implementing rate limiting in production.

## CORS

The API allows requests from:
- `https://pulse-guard-api.lovable.app`
- `https://api-monitoring-frontend-kvmrnx0ls-mahdynafi1221-5035s-projects.vercel.app`

---

**Last Updated:** February 3, 2026
