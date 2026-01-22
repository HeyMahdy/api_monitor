import { pool } from '../db/db_config.js';
import type { AlertChannel, AlertChannelInput, UpdateAlertChannelInput } from '../schema/alertChannel.js';

export const createAlertChannel = async (data: AlertChannelInput): Promise<AlertChannel> => {
    const sql = `
        INSERT INTO alert_channels (user_id, type, name, config)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
    `;
    const values = [data.user_id, data.type, data.name, JSON.stringify(data.config)];
    const result = await pool.query(sql, values);
    return result.rows[0];
};

export const findAlertChannelsByUserId = async (userId: string): Promise<AlertChannel[]> => {
    const sql = `SELECT * FROM alert_channels WHERE user_id = $1 ORDER BY created_at DESC;`;
    const result = await pool.query(sql, [userId]);
    return result.rows;
};

export const findAlertChannelById = async (id: string, userId: string): Promise<AlertChannel | null> => {
    const sql = `SELECT * FROM alert_channels WHERE id = $1 AND user_id = $2;`;
    const result = await pool.query(sql, [id, userId]);
    return result.rows[0] || null;
};

export const updateAlertChannel = async (id: string, userId: string, data: UpdateAlertChannelInput): Promise<AlertChannel | null> => {
    const fields: string[] = [];
    const values: any[] = [];
    let index = 1;

    if (data.name !== undefined) {
        fields.push(`name = $${index++}`);
        values.push(data.name);
    }
    if (data.type !== undefined) {
        fields.push(`type = $${index++}`);
        values.push(data.type);
    }
    if (data.config !== undefined) {
        fields.push(`config = $${index++}`);
        values.push(JSON.stringify(data.config));
    }

    if (fields.length === 0) return await findAlertChannelById(id, userId);

    fields.push(`updated_at = NOW()`);
    values.push(id, userId);

    const sql = `
        UPDATE alert_channels 
        SET ${fields.join(', ')} 
        WHERE id = $${index++} AND user_id = $${index++}
        RETURNING *;
    `;

    const result = await pool.query(sql, values);
    return result.rows[0] || null;
};

export const deleteAlertChannel = async (id: string, userId: string): Promise<boolean> => {
    const sql = `DELETE FROM alert_channels WHERE id = $1 AND user_id = $2;`;
    const result = await pool.query(sql, [id, userId]);
    return (result.rowCount || 0) > 0;
};

export const getAlertConfigsByMonitorId = async (monitorId: string) => {
    const sql = `
        SELECT 
            alert_channels.type, 
            alert_channels.config
        FROM monitors
        JOIN alert_channels ON monitors.user_id = alert_channels.user_id
        WHERE monitors.id = $1;
    `;

    const values = [monitorId];

    const result = await pool.query(sql, values);
    
    // Returns an array of configs (e.g., one for Email, one for Webhook)
    // Example: [{ type: 'WEBHOOK', config: { url: '...' } }]
    return result.rows; 
};