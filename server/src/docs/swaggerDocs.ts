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
