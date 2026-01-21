export {};

/**
 * @openapi
 * components:
 *   securitySchemes:
 *     cookieAuth:
 *       type: apiKey
 *       in: cookie
 *       name: token
 *   schemas:
 *     AuthRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 8
 *     AuthResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         userId:
 *           type: string
 *     MonitorCreate:
 *       type: object
 *       required:
 *         - name
 *         - url
 *         - method
 *         - check_interval
 *         - timeout
 *       properties:
 *         name:
 *           type: string
 *         url:
 *           type: string
 *           format: uri
 *         method:
 *           type: string
 *           description: HTTP method used for the check
 *           enum: [GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS]
 *         request_header:
 *           type: object
 *           additionalProperties:
 *             type: string
 *           description: Key-value headers sent with the request
 *         check_interval:
 *           type: integer
 *           minimum: 10
 *           description: Interval in seconds between checks (min 10s)
 *         timeout:
 *           type: integer
 *           minimum: 1
 *           description: Request timeout in seconds (min 1s)
 *         request_body:
 *           type: object
 *           additionalProperties:
 *             type: string
 *           description: Optional body sent with the request
 *         is_active:
 *           type: boolean
 *           default: true
 *         status:
 *           type: string
 *           description: Current monitor status
 *           enum: [PENDING, UP, DOWN, PAUSED]
 *     Monitor:
 *       allOf:
 *         - $ref: '#/components/schemas/MonitorCreate'
 *         - type: object
 *           properties:
 *             id:
 *               type: string
 *             user_id:
 *               type: string
 *             created_at:
 *               type: string
 *               format: date-time
 *             updated_at:
 *               type: string
 *               format: date-time
 *             last_checked_at:
 *               type: string
 *               format: date-time
 *               nullable: true
 *     HealthCheckResult:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         monitor_id:
 *           type: string
 *         status:
 *           type: boolean
 *         response_time_ms:
 *           type: integer
 *         status_code:
 *           type: integer
 *           nullable: true
 *         error_type:
 *           type: string
 *           nullable: true
 *         error_message:
 *           type: string
 *           nullable: true
 *         timestamp:
 *           type: string
 *           format: date-time
 *     Incident:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique incident ID
 *         monitor_id:
 *           type: string
 *           format: uuid
 *           description: The monitor this incident belongs to
 *         status:
 *           type: string
 *           enum: [OPEN, ACKNOWLEDGED, RESOLVED]
 *           description: Current incident status
 *         severity:
 *           type: string
 *           enum: [CRITICAL, WARNING, INFO]
 *           description: Incident severity level
 *         started_at:
 *           type: string
 *           format: date-time
 *           description: When the incident started
 *         resolved_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: When the incident was resolved
 *         acknowledged_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: When the incident was acknowledged
 *         failure_count:
 *           type: integer
 *           description: Number of consecutive failures
 *         error_message:
 *           type: string
 *           nullable: true
 *           description: Error message from the health check
 *     IncidentCreate:
 *       type: object
 *       required:
 *         - monitor_id
 *       properties:
 *         monitor_id:
 *           type: string
 *           format: uuid
 *         status:
 *           type: string
 *           enum: [OPEN, ACKNOWLEDGED, RESOLVED]
 *           default: OPEN
 *         severity:
 *           type: string
 *           enum: [CRITICAL, WARNING, INFO]
 *           default: CRITICAL
 *         failure_count:
 *           type: integer
 *           default: 1
 *         error_message:
 *           type: string
 *           nullable: true
 */

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthRequest'
 *     responses:
 *       201:
 *         description: User created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
 */

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login and receive an auth cookie
 *     description: Validates credentials and sets a JWT token in an HTTP-only cookie.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthRequest'
 *     responses:
 *       200:
 *         description: Logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 */

/**
 * @openapi
 * /profile:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Get current user profile (protected)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current authenticated user info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *       401:
 *         description: Unauthorized
 */

/**
 * @openapi
 * /api/monitors:
 *   post:
 *     tags:
 *       - Monitors
 *     summary: Create a new monitor
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MonitorCreate'
 *     responses:
 *       201:
 *         description: Monitor created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Monitor'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *   get:
 *     tags:
 *       - Monitors
 *     summary: List all monitors for the current user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of monitors for the authenticated user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Monitor'
 *       401:
 *         description: Unauthorized
 */

/**
 * @openapi
 * /api/monitors/{id}:
 *   get:
 *     tags:
 *       - Monitors
 *     summary: Get a single monitor by ID
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Monitor details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Monitor'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Monitor not found
 *   patch:
 *     tags:
 *       - Monitors
 *     summary: Update a monitor (partial update)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MonitorCreate'
 *     responses:
 *       200:
 *         description: Updated monitor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Monitor'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Monitor not found or unauthorized
 *   delete:
 *     tags:
 *       - Monitors
 *     summary: Delete a monitor
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Monitor deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Monitor not found or unauthorized
 */

/**
 * @openapi
 * /api/monitors/start/{id}:
 *   post:
 *     tags:
 *       - Monitors
 *     summary: Start/activate a monitor
 *     description: Activates a monitor to begin performing health checks
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Monitor ID to activate
 *     responses:
 *       200:
 *         description: Monitor activated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: success
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Error occurred while activating monitor
 */

/**
 * @openapi
 * /api/monitors/pause/{id}:
 *   post:
 *     tags:
 *       - Monitors
 *     summary: Pause a monitor
 *     description: Stops the health check scheduler for a monitor
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Monitor ID to pause
 *     responses:
 *       200:
 *         description: Monitor paused successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Error occurred while pausing monitor
 */

/**
 * @openapi
 * /api/monitors/resume/{id}:
 *   post:
 *     tags:
 *       - Monitors
 *     summary: Resume a monitor
 *     description: Restarts the health check scheduler for a monitor
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Monitor ID to resume
 *     responses:
 *       200:
 *         description: Monitor resumed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Error occurred while resuming monitor
 * /api/monitors/{id}/history:
 *   get:
 *     tags:
 *       - Monitors
 *     summary: Get monitor check history (paginated)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Monitor ID
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Monitor check history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/HealthCheckResult'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Monitor does not belong to user)
 *       404:
 *         description: Monitor not found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @openapi
 * /api/dev/clear-db:
 *   post:
 *     tags:
 *       - Dev Utilities
 *     summary: Clear the entire database (Dev only)
 *     description: Deletes all rows from monitors and users tables. Use with caution!
 *     responses:
 *       200:
 *         description: Database cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 tables:
 *                   type: array
 *                   items:
 *                     type: string
 *       500:
 *         description: Failed to clear database
 */

/**
 * @openapi
 * /api/incidents:
 *   post:
 *     tags:
 *       - Incidents
 *     summary: Create a new incident
 *     description: Manually create an incident for a monitor
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IncidentCreate'
 *     responses:
 *       201:
 *         description: Incident created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Incident'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to create incident
 */

/**
 * @openapi
 * /api/incidents/open:
 *   get:
 *     tags:
 *       - Incidents
 *     summary: Get all open incidents
 *     description: Retrieve all incidents with OPEN status across all monitors
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of open incidents
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Incident'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to fetch open incidents
 */

/**
 * @openapi
 * /api/incidents/{id}:
 *   get:
 *     tags:
 *       - Incidents
 *     summary: Get incident by ID
 *     description: Retrieve a specific incident by its ID
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Monitor ID (UUID)
 *     responses:
 *       200:
 *         description: Incident details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Incident'
 *       400:
 *         description: Invalid incident ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Incident not found
 *       500:
 *         description: Failed to fetch incident
 */

/**
 * @openapi
 * /api/incidents/{id}:
 *   delete:
 *     tags:
 *       - Incidents
 *     summary: Delete an incident
 *     description: Permanently delete an incident by ID
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Monitor ID (UUID)
 *     responses:
 *       200:
 *         description: Incident deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid incident ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Incident not found
 *       500:
 *         description: Failed to delete incident
 */

/**
 * @openapi
 * /api/incidents/{id}/acknowledge:
 *   patch:
 *     tags:
 *       - Incidents
 *     summary: Acknowledge an incident
 *     description: Mark an incident as acknowledged and set the acknowledged_at timestamp
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Monitor ID (UUID)
 *     responses:
 *       200:
 *         description: Incident acknowledged successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Incident'
 *       400:
 *         description: Invalid incident ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Incident not found
 *       500:
 *         description: Failed to acknowledge incident
 */

/**
 * @openapi
 * /api/incidents/{id}/resolve:
 *   patch:
 *     tags:
 *       - Incidents
 *     summary: Resolve an incident
 *     description: Mark an incident as resolved and set the resolved_at timestamp
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Monitor ID (UUID)
 *     responses:
 *       200:
 *         description: Incident resolved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Incident'
 *       400:
 *         description: Invalid incident ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Incident not found
 *       500:
 *         description: Failed to resolve incident
 */

/**
 * @openapi
 * /api/monitors/{monitorId}/incidents:
 *   get:
 *     tags:
 *       - Incidents
 *     summary: Get all incidents for a monitor
 *     description: Retrieve paginated incidents for a specific monitor
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: monitorId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Monitor UUID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of incidents to return per page
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of incidents to skip
 *     responses:
 *       200:
 *         description: Paginated list of incidents
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 incidents:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Incident'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *                     count:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to fetch incidents
 */
