# API Monitor - Architecture Diagram

This document provides visual architecture diagrams for the API Monitor system.

## System Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        Client[Web Client/API Consumer]
    end
    
    subgraph "API Layer - Port 3000"
        Express[Express.js Server]
        Auth[Auth Middleware<br/>JWT Validation]
        Routes[Route Handlers<br/>- /auth/*<br/>- /api/monitors/*<br/>- /api/incidents/*<br/>- /api/v1/alert-channels/*]
        Controllers[Controllers<br/>- AuthController<br/>- MonitorController<br/>- IncidentController<br/>- AlertChannelController]
    end
    
    subgraph "Service Layer"
        AuthService[Auth Service<br/>- register<br/>- login<br/>- password hashing]
        MonitorService[Monitor Service<br/>- CRUD operations<br/>- start/pause/resume<br/>- schedule management]
        IncidentService[Incident Service<br/>- create/update incidents<br/>- acknowledge/resolve<br/>- failure handling]
        AlertService[Alert Service<br/>- notification dispatch<br/>- multi-channel support]
        HealthCheckService[HealthCheck Service<br/>- HTTP request execution<br/>- response time tracking<br/>- error handling]
    end
    
    subgraph "Queue System - BullMQ"
        Redis[(Redis<br/>Queue Storage<br/>+ Streams)]
        MonitorQueue[Monitor Queue<br/>Repeatable Jobs]
        Workers[Background Workers]
        HealthWorker[Health Check Worker<br/>- Execute checks<br/>- Handle success/failure<br/>- Retry logic]
    end
    
    subgraph "Data Layer"
        Repos[Repositories<br/>- MonitorRepo<br/>- IncidentRepo<br/>- AlertChannelRepo<br/>- UserRepo]
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
    
    Client -->|HTTP/REST| Express
    Express --> Auth
    Auth --> Routes
    Routes --> Controllers
    
    Controllers --> AuthService
    Controllers --> MonitorService
    Controllers --> IncidentService
    Controllers --> AlertService
    
    AuthService --> Repos
    MonitorService --> Repos
    IncidentService --> Repos
    AlertService --> Repos
    
    Repos <-->|SQL Queries| DB
    
    MonitorService -->|Schedule Jobs| MonitorQueue
    MonitorQueue <-->|Job Persistence| Redis
    Redis -->|Job Triggers| HealthWorker
    Workers --> HealthWorker
    
    HealthWorker -->|Execute Check| HealthCheckService
    HealthCheckService -->|HTTP Request| TargetAPI
    TargetAPI -->|Response/Error| HealthCheckService
    
    HealthWorker -->|Stream Results| RedisStream
    RedisStream -->|Persist| DB
    
    HealthWorker -->|On Failure| IncidentService
    HealthWorker -->|On Recovery| IncidentService
    
    IncidentService -->|Trigger Alerts| AlertService
    AlertService -->|POST Request| Webhooks
    AlertService -->|Send Email| EmailService
    AlertService -->|Post Message| Slack
    AlertService -->|Post Message| Discord
    
    style Express fill:#4CAF50,color:#fff
    style Redis fill:#DC382D,color:#fff
    style DB fill:#336791,color:#fff
    style Workers fill:#FFA500,color:#fff
    style TargetAPI fill:#2196F3,color:#fff
    style HealthCheckService fill:#9C27B0,color:#fff
```

## Component Interaction Flow

```mermaid
graph LR
    A[User Action] --> B[API Controller]
    B --> C[Service Layer]
    C --> D[Repository]
    D --> E[Database]
    C --> F[Queue System]
    F --> G[Background Worker]
    G --> H[External Service]
    H --> G
    G --> I[Incident System]
    I --> J[Alert System]
```

## Database Schema Overview

```mermaid
erDiagram
    users ||--o{ monitors : "owns"
    users ||--o{ alert_channels : "configures"
    monitors ||--o{ health_checks : "has"
    monitors ||--o{ incidents : "triggers"
    monitors ||--o{ monitor_alert_channels : "uses"
    alert_channels ||--o{ monitor_alert_channels : "assigned_to"
    
    users {
        uuid id PK
        string email
        string password_hash
        timestamp created_at
        timestamp updated_at
    }
    
    monitors {
        uuid id PK
        uuid user_id FK
        string name
        string url
        string method
        jsonb request_header
        jsonb request_body
        int check_interval
        int timeout
        boolean is_active
        string status
        timestamp last_checked_at
        timestamp created_at
        timestamp updated_at
    }
    
    health_checks {
        uuid id PK
        uuid monitor_id FK
        boolean status
        int response_time_ms
        int status_code
        string error_type
        string error_message
        timestamp timestamp
    }
    
    incidents {
        int id PK
        uuid monitor_id FK
        string status
        string severity
        int failure_count
        string error_message
        timestamp started_at
        timestamp resolved_at
        timestamp acknowledged_at
    }
    
    alert_channels {
        uuid id PK
        uuid user_id FK
        string type
        string name
        jsonb config
        timestamp created_at
        timestamp updated_at
    }
    
    monitor_alert_channels {
        uuid monitor_id FK
        uuid alert_channel_id FK
    }
```

## Monitor State Machine

```mermaid
stateDiagram-v2
    [*] --> PENDING: Monitor Created
    PENDING --> UP: Start Monitor + First Check Success
    PENDING --> DOWN: Start Monitor + First Check Fails
    
    UP --> DOWN: Health Check Fails (3x retry)
    DOWN --> UP: Health Check Succeeds
    
    UP --> PAUSED: User Pauses Monitor
    DOWN --> PAUSED: User Pauses Monitor
    PAUSED --> UP: User Resumes + Check Success
    PAUSED --> DOWN: User Resumes + Check Fails
    
    UP --> [*]: Monitor Deleted
    DOWN --> [*]: Monitor Deleted
    PAUSED --> [*]: Monitor Deleted
    PENDING --> [*]: Monitor Deleted
```

## Incident State Machine

```mermaid
stateDiagram-v2
    [*] --> OPEN: Health Check Fails
    OPEN --> ACKNOWLEDGED: User Acknowledges
    ACKNOWLEDGED --> RESOLVED: User Resolves
    OPEN --> RESOLVED: Auto-Resolved (Health Check Succeeds)
    ACKNOWLEDGED --> OPEN: Failure Count Incremented
    RESOLVED --> [*]
```

## Health Check Worker Flow

```mermaid
flowchart TD
    Start([Job Triggered by Scheduler]) --> GetJob[Get Job Data<br/>monitorId, url, method, etc.]
    GetJob --> CheckExists{Monitor<br/>Still Exists?}
    CheckExists -->|No| End([Job Complete])
    CheckExists -->|Yes| ExecuteCheck[Execute Health Check]
    
    ExecuteCheck --> MakeRequest[Make HTTP Request<br/>with Timeout]
    MakeRequest --> CheckResponse{Response?}
    
    CheckResponse -->|Success 2xx| RecordSuccess[Record Success<br/>status: true]
    CheckResponse -->|Error/Non-2xx| RecordFailure[Record Failure<br/>status: false]
    
    RecordSuccess --> StreamSuccess[Save to Redis Stream]
    RecordFailure --> StreamFailure[Save to Redis Stream]
    
    StreamSuccess --> CheckIncident{Open<br/>Incident?}
    CheckIncident -->|Yes| ResolveIncident[Auto-Resolve Incident]
    CheckIncident -->|No| End
    ResolveIncident --> NotifyResolved[Send Resolved Alerts]
    NotifyResolved --> End
    
    StreamFailure --> ThrowError[Throw Error<br/>for Retry]
    ThrowError --> RetryCheck{Retries<br/>Remaining?}
    
    RetryCheck -->|Yes| Wait[Wait 2s]
    Wait --> ExecuteCheck
    
    RetryCheck -->|No| HandleFailure[Handle Monitor Failure]
    HandleFailure --> CheckExisting{Existing<br/>Open Incident?}
    
    CheckExisting -->|Yes| IncrementCount[Increment Failure Count]
    CheckExisting -->|No| CreateIncident[Create New Incident]
    
    CreateIncident --> SendAlerts[Send Alert Notifications]
    IncrementCount --> PauseMonitor[Pause Monitor]
    SendAlerts --> PauseMonitor
    PauseMonitor --> End
```

## Alert Notification Flow

```mermaid
flowchart TD
    Start([Incident State Change]) --> GetChannels[Get Alert Channels<br/>for Monitor]
    GetChannels --> HasChannels{Channels<br/>Configured?}
    HasChannels -->|No| End([Complete])
    HasChannels -->|Yes| LoopChannels[Iterate Each Channel]
    
    LoopChannels --> CheckType{Channel<br/>Type?}
    
    CheckType -->|WEBHOOK| Webhook[Send POST Request<br/>to Webhook URL]
    CheckType -->|EMAIL| Email[Send Email<br/>via SMTP]
    CheckType -->|SLACK| Slack[Post to Slack<br/>Webhook]
    CheckType -->|DISCORD| Discord[Post to Discord<br/>Webhook]
    
    Webhook --> Next{More<br/>Channels?}
    Email --> Next
    Slack --> Next
    Discord --> Next
    
    Next -->|Yes| LoopChannels
    Next -->|No| End
```

## Data Flow: Monitor Lifecycle

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant API
    participant Service
    participant Queue
    participant Worker
    participant DB
    
    Note over User,DB: 1. CREATE MONITOR
    User->>API: POST /api/monitors
    API->>Service: createMonitor()
    Service->>DB: INSERT monitor (is_active: false)
    DB-->>User: Monitor created
    
    Note over User,DB: 2. START MONITOR
    User->>API: POST /api/monitors/start/:id
    API->>Service: startMonitor()
    Service->>DB: UPDATE is_active = true
    Service->>Queue: Schedule repeatable job
    Queue-->>User: Monitor started
    
    Note over User,DB: 3. HEALTH CHECK EXECUTION (Repeating)
    Queue->>Worker: Trigger job every interval
    Worker->>Worker: Execute HTTP request
    Worker->>DB: Store health check result
    
    Note over User,DB: 4. FAILURE SCENARIO
    Worker->>Worker: Check fails 3 times
    Worker->>DB: Create/update incident
    Worker->>DB: Pause monitor
    Worker->>Worker: Send alerts
    
    Note over User,DB: 5. RECOVERY
    User->>API: POST /api/monitors/resume/:id
    API->>Service: resumeMonitor()
    Service->>Queue: Re-schedule job
    Queue->>Worker: Health check succeeds
    Worker->>DB: Auto-resolve incident
```

## Technology Stack Details

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **API Server** | Express.js + TypeScript | HTTP server and routing |
| **Authentication** | JWT (jsonwebtoken) | Stateless authentication |
| **Job Queue** | BullMQ | Reliable job scheduling and retry logic |
| **Cache & Streams** | Redis | Job storage, result streaming |
| **Database** | PostgreSQL | Persistent data storage |
| **HTTP Client** | Axios | Health check HTTP requests |
| **Validation** | Zod | Request schema validation |
| **ORM** | Direct SQL | Database queries |

## Scalability Considerations

```mermaid
graph TB
    subgraph "Horizontal Scaling"
        API1[API Server 1]
        API2[API Server 2]
        API3[API Server N]
        LB[Load Balancer]
    end
    
    subgraph "Worker Scaling"
        W1[Worker 1<br/>concurrency: 10]
        W2[Worker 2<br/>concurrency: 10]
        W3[Worker N<br/>concurrency: 10]
    end
    
    subgraph "Data Layer"
        Redis[(Redis Cluster)]
        DB[(PostgreSQL<br/>with Read Replicas)]
    end
    
    Users --> LB
    LB --> API1
    LB --> API2
    LB --> API3
    
    API1 --> Redis
    API2 --> Redis
    API3 --> Redis
    
    Redis --> W1
    Redis --> W2
    Redis --> W3
    
    W1 --> DB
    W2 --> DB
    W3 --> DB
    
    API1 --> DB
    API2 --> DB
    API3 --> DB
```

### Scaling Strategies:

1. **API Server**: Stateless design allows horizontal scaling behind load balancer
2. **Workers**: Multiple workers can process jobs concurrently from Redis
3. **Database**: Read replicas for health check history queries
4. **Redis**: Cluster mode for high availability
5. **Job Concurrency**: Each worker processes 10 jobs simultaneously

---

**Last Updated**: February 4, 2026
