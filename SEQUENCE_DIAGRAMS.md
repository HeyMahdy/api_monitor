# API Monitor - Sequence Diagrams

This document provides detailed sequence diagrams for all major flows in the API Monitor application. The diagrams illustrate how different components interact to provide API monitoring, incident management, and alerting capabilities.

## Table of Contents
1. [User Authentication Flow](#1-user-authentication-flow)
2. [Monitor Creation Flow](#2-monitor-creation-flow)
3. [Monitor Lifecycle (Start/Pause/Resume)](#3-monitor-lifecycle-startpauseresume)
4. [Health Check Execution Flow](#4-health-check-execution-flow)
5. [Incident Creation & Management Flow](#5-incident-creation--management-flow)
6. [Alert Notification Flow](#6-alert-notification-flow)
7. [Monitor Update Flow](#7-monitor-update-flow)
8. [Get Monitor History Flow](#8-get-monitor-history-flow)

---

## 1. User Authentication Flow

### 1.1 Registration Flow

```mermaid
sequenceDiagram
    participant Client
    participant AuthController
    participant AuthService
    participant Database
    
    Client->>AuthController: POST /auth/register<br/>{email, password}
    AuthController->>AuthController: Validate request body
    AuthController->>AuthService: register(email, password)
    AuthService->>AuthService: Hash password
    AuthService->>Database: INSERT user record
    Database-->>AuthService: User created
    AuthService-->>AuthController: Return success
    AuthController-->>Client: 201 Created<br/>{message: "User created"}
```

### 1.2 Login Flow

```mermaid
sequenceDiagram
    participant Client
    participant AuthController
    participant AuthService
    participant Database
    
    Client->>AuthController: POST /auth/login<br/>{email, password}
    AuthController->>AuthController: Validate request body
    AuthController->>AuthService: login(email, password)
    AuthService->>Database: SELECT user by email
    Database-->>AuthService: User record
    AuthService->>AuthService: Compare password hash
    AuthService->>AuthService: Generate JWT token
    AuthService-->>AuthController: {userId, token}
    AuthController-->>Client: 200 OK<br/>{message, userId, token}
```

---

## 2. Monitor Creation Flow

```mermaid
sequenceDiagram
    participant Client
    participant MonitorController
    participant AuthMiddleware
    participant MonitorService
    participant MonitorRepo
    participant Database
    
    Client->>MonitorController: POST /api/monitors<br/>Authorization: Bearer <token><br/>{name, url, method, check_interval, timeout}
    MonitorController->>AuthMiddleware: Verify JWT token
    AuthMiddleware-->>MonitorController: userId extracted
    MonitorController->>MonitorController: Validate request body
    MonitorController->>MonitorService: createMonitor(data)
    MonitorService->>MonitorRepo: createMonitor(data)
    MonitorRepo->>Database: INSERT monitor record
    Database-->>MonitorRepo: Monitor created
    MonitorRepo-->>MonitorService: Monitor object
    MonitorService-->>MonitorController: Monitor object
    MonitorController-->>Client: 201 Created<br/>{id, name, url, status: "PENDING", is_active: false}
```

---

## 3. Monitor Lifecycle (Start/Pause/Resume)

### 3.1 Start Monitor Flow

```mermaid
sequenceDiagram
    participant Client
    participant MonitorController
    participant MonitorService
    participant MonitorRepo
    participant MonitorQueue
    participant Redis
    participant Database
    
    Client->>MonitorController: POST /api/monitors/start/:id<br/>Authorization: Bearer <token>
    MonitorController->>MonitorService: startMonitor(monitorId)
    MonitorService->>MonitorRepo: findMonitorById(monitorId)
    MonitorRepo->>Database: SELECT monitor
    Database-->>MonitorRepo: Monitor record
    MonitorRepo-->>MonitorService: Monitor object
    MonitorService->>MonitorRepo: setMonitorActiveStatus(monitorId, true)
    MonitorRepo->>Database: UPDATE is_active = true
    Database-->>MonitorRepo: Success
    MonitorService->>MonitorQueue: upsertJobScheduler(monitorId, config, jobData)
    MonitorQueue->>Redis: Create repeatable job<br/>every: check_interval
    Redis-->>MonitorQueue: Job scheduled
    MonitorQueue-->>MonitorService: Success
    MonitorService-->>MonitorController: true
    MonitorController-->>Client: 200 OK<br/>{message: "success"}
```

### 3.2 Pause Monitor Flow

```mermaid
sequenceDiagram
    participant Client
    participant MonitorController
    participant MonitorService
    participant MonitorRepo
    participant MonitorQueue
    participant Redis
    participant Database
    
    Client->>MonitorController: POST /api/monitors/pause/:id
    MonitorController->>MonitorService: pauseMonitor(monitorId)
    MonitorService->>MonitorRepo: setMonitorInActiveStatus(monitorId)
    MonitorRepo->>Database: UPDATE is_active = false, status = 'PAUSED'
    Database-->>MonitorRepo: Success
    MonitorService->>MonitorQueue: removeJobScheduler(monitorId)
    MonitorQueue->>Redis: Remove repeatable job
    Redis-->>MonitorQueue: Job removed
    MonitorQueue-->>MonitorService: Success
    MonitorService-->>MonitorController: true
    MonitorController-->>Client: 200 OK<br/>{message: "success"}
```

### 3.3 Resume Monitor Flow

```mermaid
sequenceDiagram
    participant Client
    participant MonitorController
    participant MonitorService
    participant MonitorRepo
    participant MonitorQueue
    participant Redis
    participant Database
    
    Client->>MonitorController: POST /api/monitors/resume/:id
    MonitorController->>MonitorService: resumeMonitor(monitorId)
    MonitorService->>MonitorRepo: findMonitorById(monitorId)
    MonitorRepo->>Database: SELECT monitor
    Database-->>MonitorRepo: Monitor record
    MonitorRepo-->>MonitorService: Monitor object
    MonitorService->>MonitorRepo: setMonitorActiveStatus(monitorId, true)
    MonitorRepo->>Database: UPDATE is_active = true
    Database-->>MonitorRepo: Success
    MonitorService->>MonitorQueue: upsertJobScheduler(monitorId, config, jobData)
    MonitorQueue->>Redis: Create repeatable job
    Redis-->>MonitorQueue: Job scheduled
    MonitorQueue-->>MonitorService: Success
    MonitorService-->>MonitorController: true
    MonitorController-->>Client: 200 OK<br/>{message: "success"}
```

---

## 4. Health Check Execution Flow

This is the core monitoring flow that runs periodically for each active monitor.

```mermaid
sequenceDiagram
    participant RedisScheduler
    participant MonitorWorker
    participant HealthCheckService
    participant TargetAPI
    participant RedisStream
    participant IncidentService
    participant IncidentRepo
    participant MonitorRepo
    participant Database
    
    Note over RedisScheduler: Scheduled job triggers<br/>(every check_interval seconds)
    RedisScheduler->>MonitorWorker: Process job<br/>{monitorId, url, method, headers, body, timeout}
    MonitorWorker->>MonitorWorker: Validate monitor exists
    MonitorWorker->>HealthCheckService: check(monitorId, url, method, headers, body, timeout)
    HealthCheckService->>HealthCheckService: Start timer
    HealthCheckService->>TargetAPI: HTTP Request<br/>(GET/POST/etc with configured params)
    
    alt Request Successful (2xx)
        TargetAPI-->>HealthCheckService: 2xx Response
        HealthCheckService->>HealthCheckService: Calculate response time
        HealthCheckService-->>MonitorWorker: {status: true, statusCode, responseTimeMs}
        MonitorWorker->>RedisStream: addToStream(result)
        RedisStream->>Database: Store health check result
        MonitorWorker->>MonitorWorker: Job completed event
        MonitorWorker->>IncidentService: getIncidentById(monitorId)
        IncidentService->>IncidentRepo: findIncidents({monitor_id})
        IncidentRepo->>Database: SELECT incident WHERE monitor_id = ? AND status = 'OPEN'
        Database-->>IncidentRepo: Incident record (if exists)
        alt Open Incident Exists
            MonitorWorker->>IncidentService: resolveIncident(monitorId)
            IncidentService->>IncidentRepo: updateIncidentStatus(id, 'RESOLVED')
            IncidentRepo->>Database: UPDATE incident SET status='RESOLVED', resolved_at=NOW()
            Database-->>IncidentRepo: Success
            IncidentService->>IncidentService: NotifyIncidentResolved(data)
            Note over IncidentService: Sends webhook/email alerts
        end
    else Request Failed (Non-2xx or Network Error)
        TargetAPI-->>HealthCheckService: Error/Non-2xx Response
        HealthCheckService->>HealthCheckService: Calculate response time
        HealthCheckService-->>MonitorWorker: {status: false, errorType, errorMessage}
        MonitorWorker->>RedisStream: addToStream(result)
        RedisStream->>Database: Store health check result
        MonitorWorker->>MonitorWorker: Throw error (triggers retry)
    end
    
    alt Max Retries Exceeded
        Note over MonitorWorker: After all retry attempts fail
        MonitorWorker->>IncidentService: handleMonitorFailure(monitorId, healthResult)
        IncidentService->>IncidentRepo: findLatestOpenIncident(monitorId)
        IncidentRepo->>Database: SELECT latest OPEN incident
        
        alt Existing Open Incident
            Database-->>IncidentRepo: Existing incident
            IncidentService->>IncidentRepo: incrementFailureCount(incidentId)
            IncidentRepo->>Database: UPDATE failure_count = failure_count + 1
        else No Open Incident
            Database-->>IncidentRepo: null
            IncidentService->>IncidentRepo: createIncident({monitor_id, status: 'OPEN', severity: 'CRITICAL'})
            IncidentRepo->>Database: INSERT incident record
            Database-->>IncidentRepo: New incident
            IncidentService->>IncidentService: NotifyIncidentCreated(monitor_id, data)
            Note over IncidentService: Sends webhook/email alerts
        end
        
        MonitorWorker->>MonitorRepo: setMonitorInActiveStatus(monitorId)
        MonitorRepo->>Database: UPDATE is_active = false
        Database-->>MonitorRepo: Success
    end
```

---

## 5. Incident Creation & Management Flow

### 5.1 Incident Creation (Automatic)

```mermaid
sequenceDiagram
    participant MonitorWorker
    participant IncidentService
    participant IncidentRepo
    participant AlertService
    participant AlertChannelRepo
    participant WebhookService
    participant Database
    
    Note over MonitorWorker: After monitor check fails<br/>3 times (max retries)
    MonitorWorker->>IncidentService: handleMonitorFailure(monitorId, healthResult)
    IncidentService->>IncidentRepo: findLatestOpenIncident(monitorId)
    IncidentRepo->>Database: SELECT * FROM incidents<br/>WHERE monitor_id = ? AND status = 'OPEN'
    Database-->>IncidentRepo: null (no existing incident)
    IncidentRepo-->>IncidentService: null
    
    IncidentService->>IncidentRepo: createIncident({monitor_id, status: 'OPEN',<br/>severity: 'CRITICAL', error_message})
    IncidentRepo->>Database: INSERT incident
    Database-->>IncidentRepo: New incident with ID
    IncidentRepo-->>IncidentService: Incident object
    
    IncidentService->>AlertService: NotifyIncidentCreated(monitor_id, incident_data)
    AlertService->>AlertChannelRepo: getAlertConfigsByMonitorId(monitor_id)
    AlertChannelRepo->>Database: SELECT alert channels for monitor
    Database-->>AlertChannelRepo: List of alert channels
    AlertChannelRepo-->>AlertService: Alert channels array
    
    loop For each alert channel
        alt Channel Type = WEBHOOK
            AlertService->>WebhookService: notifyIncidentCreated(url, incident, monitor_data)
            WebhookService->>WebhookService: Send HTTP POST to webhook URL
        else Channel Type = EMAIL
            AlertService->>AlertService: Send email notification
        else Channel Type = SLACK
            AlertService->>AlertService: Send Slack notification
        else Channel Type = DISCORD
            AlertService->>AlertService: Send Discord notification
        end
    end
    
    AlertService-->>IncidentService: Notifications sent
    IncidentService-->>MonitorWorker: Incident created
```

### 5.2 Acknowledge Incident Flow

```mermaid
sequenceDiagram
    participant Client
    participant IncidentController
    participant IncidentService
    participant IncidentRepo
    participant AlertService
    participant Database
    
    Client->>IncidentController: PATCH /api/incidents/:id/acknowledge
    IncidentController->>IncidentService: acknowledgeIncident(id)
    IncidentService->>IncidentRepo: updateIncidentStatus(id, 'ACKNOWLEDGED')
    IncidentRepo->>Database: UPDATE incidents<br/>SET status = 'ACKNOWLEDGED',<br/>acknowledged_at = NOW()<br/>WHERE id = ?
    Database-->>IncidentRepo: Updated incident with monitor_data
    IncidentRepo-->>IncidentService: Incident object
    
    IncidentService->>AlertService: NotifyIncidentAcknowledged(incident_data)
    AlertService->>AlertService: Get alert channels & send notifications
    Note over AlertService: Similar to incident creation,<br/>sends webhook/email/Slack/Discord alerts
    AlertService-->>IncidentService: Notifications sent
    
    IncidentService-->>IncidentController: Updated incident
    IncidentController-->>Client: 200 OK<br/>{id, status: 'ACKNOWLEDGED', acknowledged_at}
```

### 5.3 Resolve Incident Flow

```mermaid
sequenceDiagram
    participant Client
    participant IncidentController
    participant IncidentService
    participant IncidentRepo
    participant AlertService
    participant Database
    
    Client->>IncidentController: PATCH /api/incidents/:id/resolve
    IncidentController->>IncidentService: resolveIncident(id)
    IncidentService->>IncidentRepo: updateIncidentStatus(id, 'RESOLVED')
    IncidentRepo->>Database: UPDATE incidents<br/>SET status = 'RESOLVED',<br/>resolved_at = NOW()<br/>WHERE id = ?
    Database-->>IncidentRepo: Updated incident with monitor_data
    IncidentRepo-->>IncidentService: Incident object
    
    IncidentService->>AlertService: NotifyIncidentResolved(incident_data)
    AlertService->>AlertService: Get alert channels & send notifications
    Note over AlertService: Sends resolved notification<br/>to all configured channels
    AlertService-->>IncidentService: Notifications sent
    
    IncidentService-->>IncidentController: Updated incident
    IncidentController-->>Client: 200 OK<br/>{id, status: 'RESOLVED', resolved_at}
```

---

## 6. Alert Notification Flow

### 6.1 Create Alert Channel Flow

```mermaid
sequenceDiagram
    participant Client
    participant AlertChannelController
    participant AlertChannelService
    participant AlertChannelRepo
    participant Database
    
    Client->>AlertChannelController: POST /api/v1/alert-channels<br/>{type: 'EMAIL', name: 'Team Alerts',<br/>config: {email: 'team@example.com'}}
    AlertChannelController->>AlertChannelController: Validate request body
    AlertChannelController->>AlertChannelService: createAlertChannel(userId, data)
    AlertChannelService->>AlertChannelRepo: createAlertChannel(data)
    AlertChannelRepo->>Database: INSERT alert_channel
    Database-->>AlertChannelRepo: Alert channel created
    AlertChannelRepo-->>AlertChannelService: Alert channel object
    AlertChannelService-->>AlertChannelController: Alert channel object
    AlertChannelController-->>Client: 201 Created<br/>{id, type, name, config}
```

### 6.2 Test Alert Channel Flow

```mermaid
sequenceDiagram
    participant Client
    participant AlertChannelController
    participant AlertChannelService
    participant AlertChannelRepo
    participant WebhookService
    participant Database
    participant ExternalService
    
    Client->>AlertChannelController: POST /api/v1/alert-channels/:id/test
    AlertChannelController->>AlertChannelService: testAlertChannel(id, userId)
    AlertChannelService->>AlertChannelRepo: getAlertChannelById(id)
    AlertChannelRepo->>Database: SELECT alert_channel
    Database-->>AlertChannelRepo: Alert channel config
    AlertChannelRepo-->>AlertChannelService: Alert channel object
    
    alt Channel Type = WEBHOOK
        AlertChannelService->>WebhookService: Send test webhook
        WebhookService->>ExternalService: POST test message
        ExternalService-->>WebhookService: 200 OK
    else Channel Type = EMAIL
        AlertChannelService->>AlertChannelService: Send test email
    else Channel Type = SLACK
        AlertChannelService->>AlertChannelService: Send test Slack message
    else Channel Type = DISCORD
        AlertChannelService->>AlertChannelService: Send test Discord message
    end
    
    AlertChannelService-->>AlertChannelController: Test sent successfully
    AlertChannelController-->>Client: 200 OK<br/>{message: "Test notification sent successfully"}
```

---

## 7. Monitor Update Flow

```mermaid
sequenceDiagram
    participant Client
    participant MonitorController
    participant MonitorService
    participant MonitorRepo
    participant MonitorQueue
    participant Redis
    participant Database
    
    Client->>MonitorController: PATCH /api/monitors/:id<br/>{name: "Updated Name", check_interval: 120}
    MonitorController->>MonitorController: Validate request body
    MonitorController->>MonitorService: updateMonitor(monitorId, userId, data)
    MonitorService->>MonitorRepo: updateMonitor(monitorId, userId, data)
    MonitorRepo->>Database: UPDATE monitor<br/>SET name = ?, check_interval = ?<br/>WHERE id = ? AND user_id = ?
    Database-->>MonitorRepo: Updated monitor
    MonitorRepo-->>MonitorService: Monitor object
    
    MonitorService->>MonitorQueue: removeJobScheduler(monitorId)
    MonitorQueue->>Redis: Remove existing repeatable job
    Redis-->>MonitorQueue: Job removed
    
    alt Monitor is Active
        MonitorService->>MonitorService: startMonitor(monitorId)
        Note over MonitorService: Re-schedules job with new settings
        MonitorService->>MonitorQueue: upsertJobScheduler(monitorId, new_config)
        MonitorQueue->>Redis: Create new repeatable job<br/>with updated interval
        Redis-->>MonitorQueue: Job scheduled
    end
    
    MonitorService-->>MonitorController: Updated monitor
    MonitorController-->>Client: 200 OK<br/>{id, name, check_interval, ...}
```

---

## 8. Get Monitor History Flow

```mermaid
sequenceDiagram
    participant Client
    participant MonitorController
    participant CheckResultController
    participant CheckResultRepo
    participant Database
    
    Client->>MonitorController: GET /api/monitors/:id/history?page=1&limit=10
    MonitorController->>CheckResultController: getMonitorHistory(monitorId, page, limit)
    CheckResultController->>CheckResultRepo: getHealthChecksByMonitorId(monitorId, page, limit)
    CheckResultRepo->>Database: SELECT * FROM health_checks<br/>WHERE monitor_id = ?<br/>ORDER BY timestamp DESC<br/>LIMIT ? OFFSET ?
    Database-->>CheckResultRepo: Health check records
    CheckResultRepo-->>CheckResultController: Array of health checks
    CheckResultController-->>MonitorController: Health check history
    MonitorController-->>Client: 200 OK<br/>[{id, status, response_time_ms,<br/>status_code, timestamp}, ...]
```

---

## System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        Client[Web Client/API Consumer]
    end
    
    subgraph "API Layer"
        Express[Express.js Server<br/>Port 3000]
        Auth[Auth Middleware]
        Controllers[Controllers<br/>- Auth<br/>- Monitor<br/>- Incident<br/>- AlertChannel]
    end
    
    subgraph "Service Layer"
        MonitorService[Monitor Service]
        IncidentService[Incident Service]
        AlertService[Alert Service]
        HealthCheckService[HealthCheck Service]
        AuthService[Auth Service]
    end
    
    subgraph "Queue System"
        Redis[(Redis)]
        MonitorQueue[Monitor Queue<br/>BullMQ]
        Workers[Workers<br/>- Health Check Worker<br/>- Alert Worker<br/>- DB Flush Worker]
    end
    
    subgraph "Data Layer"
        Repos[Repositories<br/>- MonitorRepo<br/>- IncidentRepo<br/>- AlertChannelRepo]
        DB[(PostgreSQL<br/>Database)]
        RedisStream[Redis Streams<br/>Health Check Results]
    end
    
    subgraph "External Services"
        TargetAPI[Target APIs<br/>Being Monitored]
        Webhooks[Webhook Endpoints]
        EmailService[Email Service]
        Slack[Slack API]
        Discord[Discord API]
    end
    
    Client -->|HTTP Requests| Express
    Express --> Auth
    Auth --> Controllers
    Controllers --> MonitorService
    Controllers --> IncidentService
    Controllers --> AlertService
    Controllers --> AuthService
    
    MonitorService --> Repos
    IncidentService --> Repos
    AlertService --> Repos
    AuthService --> Repos
    
    Repos --> DB
    
    MonitorService -->|Schedule Jobs| MonitorQueue
    MonitorQueue --> Redis
    Redis -->|Trigger Jobs| Workers
    
    Workers -->|Health Checks| HealthCheckService
    HealthCheckService -->|HTTP Requests| TargetAPI
    Workers -->|Store Results| RedisStream
    RedisStream --> DB
    
    Workers -->|Handle Failures| IncidentService
    IncidentService -->|Notify| AlertService
    AlertService -->|Send Alerts| Webhooks
    AlertService -->|Send Alerts| EmailService
    AlertService -->|Send Alerts| Slack
    AlertService -->|Send Alerts| Discord
    
    style Express fill:#4CAF50
    style Redis fill:#DC382D
    style DB fill:#336791
    style Workers fill:#FFA500
    style TargetAPI fill:#2196F3
```

---

## Key Components Description

### 1. **Express Server (app.ts)**
- Main entry point for the API
- Handles routing and middleware
- Manages CORS and authentication

### 2. **Controllers**
- Handle HTTP requests and responses
- Validate input data
- Call appropriate services

### 3. **Services**
- Contain business logic
- Orchestrate between repositories and external services
- Handle complex workflows

### 4. **Repositories**
- Direct database access layer
- Execute SQL queries
- Return data objects

### 5. **Queue System (BullMQ + Redis)**
- Manages scheduled health checks
- Handles job retries with backoff
- Provides job persistence

### 6. **Workers**
- Process background jobs
- Execute health checks
- Handle success/failure scenarios
- Manage incidents

### 7. **Redis Streams**
- Store health check results
- Provide real-time data streaming
- Enable historical data analysis

### 8. **Alert System**
- Multi-channel notification support
- Webhook integration
- Email, Slack, Discord support

---

## Data Flow Summary

1. **Monitor Creation**: User creates a monitor via API → Stored in database with `is_active: false`

2. **Monitor Activation**: User starts monitor → Job scheduled in Redis → Worker picks up job periodically

3. **Health Check**: Worker executes HTTP request to target API → Result stored in Redis Stream → Synced to database

4. **Success Scenario**: If check succeeds and incident was open → Auto-resolve incident → Send resolution notification

5. **Failure Scenario**: If check fails after retries → Create/update incident → Pause monitor → Send alert notifications

6. **Alert Flow**: Incident state change → Alert service retrieves channels → Sends notifications via configured channels

---

## Notes

- **Authentication**: All protected endpoints require JWT token in Authorization header
- **Monitoring Interval**: Minimum 10 seconds between checks
- **Retry Policy**: 3 attempts with 2-second fixed backoff
- **Auto-Pause**: Monitors auto-pause after max retries to prevent alert spam
- **Incident Lifecycle**: OPEN → ACKNOWLEDGED → RESOLVED
- **Alert Channels**: EMAIL, WEBHOOK, SLACK, DISCORD

---

**Last Updated**: February 4, 2026
**Version**: 1.0
