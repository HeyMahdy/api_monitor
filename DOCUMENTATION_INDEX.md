# API Monitor - Documentation Index

Welcome to the API Monitor documentation! This index will help you navigate through all available documentation.

## 📚 Documentation Overview

### 1. [README.md](README.md)
**Overview and Quick Start Guide**
- Project introduction and features
- Quick start instructions
- Technology stack overview
- Links to detailed documentation

### 2. [SEQUENCE_DIAGRAMS.md](SEQUENCE_DIAGRAMS.md)
**Detailed Sequence Diagrams for All Flows**

Complete sequence diagrams showing how different components interact:

#### Authentication Flows
- User Registration Flow
- User Login Flow

#### Monitor Management Flows
- Monitor Creation Flow
- Monitor Start Flow
- Monitor Pause Flow
- Monitor Resume Flow
- Monitor Update Flow
- Get Monitor History Flow

#### Health Check Flow
- Complete health check execution
- Success and failure scenarios
- Retry logic and error handling
- Automatic incident creation/resolution

#### Incident Management Flows
- Automatic Incident Creation (on monitor failure)
- Manual Incident Acknowledgment
- Manual Incident Resolution
- Auto-resolution on recovery

#### Alert Notification Flows
- Create Alert Channel Flow
- Test Alert Channel Flow
- Multi-channel notification dispatch

### 3. [ARCHITECTURE.md](ARCHITECTURE.md)
**System Architecture and Design**

Comprehensive architecture documentation including:

#### Visual Diagrams
- System Architecture Overview
- Component Interaction Flow
- Database Schema (ERD)
- State Machines (Monitor & Incident states)

#### Flow Diagrams
- Health Check Worker Detailed Flow
- Alert Notification Process
- Monitor Lifecycle Data Flow

#### Technical Details
- Technology stack breakdown
- Scalability considerations
- Horizontal scaling strategies

### 4. [api.README.md](api.README.md)
**Complete API Reference**

Full REST API documentation with:
- All 24 API endpoints
- Request/response formats
- Authentication requirements
- Field descriptions and validation rules
- Example curl commands
- Error handling guide

## 🎯 Quick Navigation by Use Case

### "I want to understand how the system works"
1. Start with [README.md](README.md) for overview
2. Review [ARCHITECTURE.md](ARCHITECTURE.md) for system design
3. Explore [SEQUENCE_DIAGRAMS.md](SEQUENCE_DIAGRAMS.md) for detailed flows

### "I want to integrate with the API"
1. Start with [api.README.md](api.README.md) for API reference
2. Review authentication flows in [SEQUENCE_DIAGRAMS.md](SEQUENCE_DIAGRAMS.md#1-user-authentication-flow)
3. Check specific endpoint documentation in [api.README.md](api.README.md)

### "I want to understand the monitoring process"
1. Review [Health Check Execution Flow](SEQUENCE_DIAGRAMS.md#4-health-check-execution-flow)
2. Check [Health Check Worker Flow](ARCHITECTURE.md#health-check-worker-flow) diagram
3. Understand [Monitor State Machine](ARCHITECTURE.md#monitor-state-machine)

### "I want to understand incident management"
1. Review [Incident Creation & Management Flow](SEQUENCE_DIAGRAMS.md#5-incident-creation--management-flow)
2. Check [Incident State Machine](ARCHITECTURE.md#incident-state-machine)
3. Review incident API endpoints in [api.README.md](api.README.md#incident-apis)

### "I want to set up alerts"
1. Review [Alert Notification Flow](SEQUENCE_DIAGRAMS.md#6-alert-notification-flow)
2. Check alert channel API in [api.README.md](api.README.md#alert-channel-apis)
3. Review supported notification channels and configuration

## 📊 Visual Diagram Summary

The documentation includes the following types of diagrams:

| Diagram Type | Location | Purpose |
|--------------|----------|---------|
| **Sequence Diagrams** | [SEQUENCE_DIAGRAMS.md](SEQUENCE_DIAGRAMS.md) | Show component interactions over time |
| **Architecture Diagrams** | [ARCHITECTURE.md](ARCHITECTURE.md) | Show system structure and relationships |
| **Flow Diagrams** | [ARCHITECTURE.md](ARCHITECTURE.md) | Show process flows and decision points |
| **State Machines** | [ARCHITECTURE.md](ARCHITECTURE.md) | Show state transitions for monitors and incidents |
| **ERD (Database Schema)** | [ARCHITECTURE.md](ARCHITECTURE.md) | Show database relationships |

## 🔍 Key Concepts

### Monitor
A configuration that defines what to monitor (URL, method, interval, etc.). Monitors can be in states: PENDING, UP, DOWN, or PAUSED.

### Health Check
An HTTP request executed by the system to check if a monitored endpoint is responding correctly. Results include response time, status code, and errors.

### Incident
Created automatically when a monitor fails after retries. Tracks the failure with states: OPEN, ACKNOWLEDGED, RESOLVED.

### Alert Channel
Configuration for where to send notifications (Email, Webhook, Slack, Discord) when incidents occur.

### Worker
Background process that executes health checks from the job queue, handles retries, and manages incidents.

### Job Queue (BullMQ)
Redis-backed queue system that schedules and executes health checks at configured intervals.

## 🚀 System Components

```
┌─────────────┐
│   Client    │  (Web/Mobile/CLI)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Express    │  HTTP API Server (Port 3000)
│   Server    │  - Authentication (JWT)
└──────┬──────┘  - Request validation
       │         - Route handling
       ▼
┌─────────────┐
│  Services   │  Business Logic Layer
└──────┬──────┘  - MonitorService
       │         - IncidentService
       │         - AlertService
       ▼
┌─────────────┐
│Repositories │  Data Access Layer
└──────┬──────┘  - SQL queries
       │         - Data mapping
       ▼
┌─────────────┐
│ PostgreSQL  │  Persistent Storage
└─────────────┘  - Monitors, Incidents
                 - Health checks, Users
                 
┌─────────────┐
│    Redis    │  Queue & Streaming
└──────┬──────┘  - Job queue (BullMQ)
       │         - Health check results
       ▼
┌─────────────┐
│   Workers   │  Background Processing
└─────────────┘  - Health check execution
                 - Incident handling
                 - Alert dispatching
```

## 📝 Documentation Standards

All diagrams use **Mermaid** syntax and will render automatically on GitHub. You can also:

1. **View on GitHub**: All `.md` files render Mermaid diagrams natively
2. **Local Preview**: Use VS Code with Mermaid extension
3. **Export**: Use Mermaid Live Editor (https://mermaid.live) to export as images

## 🔄 Update History

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-04 | 1.0 | Initial documentation release with all diagrams |

## 📮 Feedback

For documentation improvements or corrections, please open an issue or submit a pull request.

---

**Documentation Version**: 1.0  
**Last Updated**: February 4, 2026  
**Project**: API Monitor  
**License**: See LICENSE file
