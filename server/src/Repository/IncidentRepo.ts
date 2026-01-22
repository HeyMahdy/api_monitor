import { pool } from '../db/db_config.js';
import type { Incident, CreateIncidentInput, IncidentStatus } from '../schema/incident.js';

/**
 * Create a new incident for a monitor
 */
export const createIncident = async (data: CreateIncidentInput): Promise<any> => {
    const sql = `
        WITH new_incident AS (
            INSERT INTO incidents (
                monitor_id, status, severity, failure_count, error_message
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        )
        SELECT 
            new_incident.*, 
            to_jsonb(monitors.*) as monitor_data
        FROM new_incident
        JOIN monitors ON new_incident.monitor_id = monitors.id;
    `;

    const values = [
        data.monitor_id,
        data.status || 'OPEN',
        data.severity || 'CRITICAL',
        data.failure_count || 1,
        data.error_message || null,
    ];

    const result = await pool.query(sql, values);
    
    // result.rows[0] will contain all incident fields + a "monitor_data" object
    return result.rows[0];
};

/**
 * Find incidents with filters
 */
export const findIncidents = async (
    filters: {
        monitor_id?: string;
        status?: IncidentStatus;
        severity?: string;
    },
    limit: number = 50,
    offset: number = 0
): Promise<Incident[]> => {
    let sql = `SELECT * FROM incidents WHERE 1=1`;
    const values: any[] = [];
    let paramIndex = 1;

    if (filters.monitor_id) {
        sql += ` AND monitor_id = $${paramIndex++}`;
        values.push(filters.monitor_id);
    }
    if (filters.status) {
        sql += ` AND status = $${paramIndex++}`;
        values.push(filters.status);
    }
    if (filters.severity) {
        sql += ` AND severity = $${paramIndex++}`;
        values.push(filters.severity);
    }

    sql += ` ORDER BY started_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    values.push(limit, offset);

    const result = await pool.query(sql, values);
    return result.rows;
};

/**
 * Find incident by monitor ID
 */
export const findIncidentByMonitorId = async (id: string): Promise<Incident | null> => {
    const sql = `SELECT * FROM incidents WHERE monitor_id = $1 ORDER BY started_at DESC LIMIT 1;`;
    const result = await pool.query(sql, [id]);
    return result.rows[0] || null;
};

/**
 * Find all incidents for a specific monitor
 */
export const findIncidentsByMonitorId = async (
    monitorId: string,
    limit: number = 50,
    offset: number = 0
): Promise<Incident[]> => {
    const sql = `
        SELECT * FROM incidents
        WHERE monitor_id = $1
        ORDER BY started_at DESC
        LIMIT $2 OFFSET $3;
    `;
    const result = await pool.query(sql, [monitorId, limit, offset]);
    return result.rows;
};

/**
 * Find the latest open incident for a monitor
 */
export const findLatestOpenIncident = async (monitorId: string): Promise<Incident | null> => {
    const sql = `
        SELECT * FROM incidents
        WHERE monitor_id = $1 AND status = 'OPEN'
        ORDER BY started_at DESC
        LIMIT 1;
    `;
    const result = await pool.query(sql, [monitorId]);
    return result.rows[0] || null;
};

/**
 * Update incident status by monitor_id (for the latest open one)
 */
export const updateIncidentStatus = async (
    monitorId: string,
    status: IncidentStatus
): Promise<Incident | null> => {
    let sql: string;

    if (status === 'RESOLVED') {
        sql = `
            WITH updated_incident AS (
            UPDATE incidents
            SET status = $2, resolved_at = CURRENT_TIMESTAMP
            WHERE monitor_id = $1 AND status = 'OPEN'
            RETURNING *
        )
        SELECT 
            updated_incident.*, 
            to_jsonb(monitors.*) as monitor_data
        FROM updated_incident
        JOIN monitors ON updated_incident.monitor_id = monitors.id;
        `;
    } else if (status === 'ACKNOWLEDGED') {
        sql = `
          WITH updated_incident AS (
            UPDATE incidents
            SET status = $2, resolved_at = CURRENT_TIMESTAMP
            WHERE monitor_id = $1 AND status = 'OPEN'
            RETURNING *
        )
        SELECT 
            updated_incident.*, 
            to_jsonb(monitors.*) as monitor_data
        FROM updated_incident
        JOIN monitors ON updated_incident.monitor_id = monitors.id;
        `;
    } else {
        sql = `
           WITH updated_incident AS (
            UPDATE incidents
            SET status = $2, resolved_at = CURRENT_TIMESTAMP
            WHERE monitor_id = $1 AND status = 'OPEN'
            RETURNING *
        )
        SELECT 
            updated_incident.*, 
            to_jsonb(monitors.*) as monitor_data
        FROM updated_incident
        JOIN monitors ON updated_incident.monitor_id = monitors.id;
        `;
    }

    const result = await pool.query(sql, [monitorId, status]);
    return result.rows[0] || null;
};

/**
 * Increment failure count for an incident by ID
 */
export const incrementFailureCount = async (id: number): Promise<Incident | null> => {
    const sql = `
        UPDATE incidents
        SET failure_count = failure_count + 1
        WHERE id = $1
        RETURNING *;
    `;
    const result = await pool.query(sql, [id]);
    return result.rows[0] || null;
};

/**
 * Get all open incidents
 */
export const findAllOpenIncidents = async (): Promise<Incident[]> => {
    const sql = `
        SELECT * FROM incidents
        WHERE status = 'OPEN'
        ORDER BY started_at DESC;
    `;
    const result = await pool.query(sql);
    return result.rows;
};

/**
 * Delete incident by monitor_id
 */
export const deleteIncident = async (id: string): Promise<boolean> => {
    const sql = `DELETE FROM incidents WHERE monitor_id = $1;`;
    const result = await pool.query(sql, [id]);
    return (result.rowCount || 0) > 0;
};
