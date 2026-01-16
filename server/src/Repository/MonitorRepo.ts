

import { json } from 'zod';
import {pool} from '../db/db_config.js'
import type {CreateMonitorInput,Monitor,MonitorStatus} from '../schema/monitor.js'


export const createMonitor = async (data: CreateMonitorInput): Promise<Monitor> => {


  const sql = `
    INSERT INTO monitors (
      user_id, name, url, method, request_header, request_body, 
      check_interval, timeout, is_active, status
    ) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
    RETURNING *;
  `;

  const values = [
    data.user_id,
    data.name,
    data.url,
    data.method,
    JSON.stringify(data.request_header), 
    data.request_body,
    data.check_interval,
    data.timeout,
    data.is_active,
    data.status // Zod handles the default 'PENDING' for you if you parse it
  ];

  const result = await pool.query(sql, values);
  
  // The DB returns a raw row. Since your 'Monitor' type comes from Zod,
  // this is type-safe as long as your DB columns match the Zod types.
  return result.rows[0] as Monitor; 
};


export const findMonitorById = async (id: string): Promise<Monitor | null> => {
  const sql = `
    SELECT * FROM monitors 
    WHERE id = $1;
  `;

  const result = await pool.query(sql, [id]);
  return result.rows[0] || null;
};

export const findMonitorsByUserId = async (userId: string): Promise<Monitor[]> => {
  const sql = `
    SELECT * FROM monitors 
    WHERE user_id = $1
    ORDER BY created_at DESC;
  `;

  const result = await pool.query(sql, [userId]);
  return result.rows; // Returns array of monitors
};

export const findAllActiveMonitors = async (): Promise<Monitor[]> => {
  const sql = `
    SELECT * FROM monitors 
    WHERE is_active = true;
  `;
  
  const result = await pool.query(sql);
  return result.rows;
};



export const updateMonitor = async (id: string, userId: string, data: CreateMonitorInput): Promise<Monitor | null> => {
  // Dynamically build SET clause to update only provided fields
  const updates: string[] = [];
  const values: any[] = [id, userId]; // $1 is id, $2 is user_id (for security ownership check)
  let paramIndex = 3;

  const keys = Object.keys(data) as Array<keyof CreateMonitorInput>;

  if (keys.length === 0) return null; // Nothing to update

  for (const key of keys) {
    updates.push(`${key} = $${paramIndex}`);
    
    // Handle JSON stringify for headers if necessary
    if (key === 'request_header') {
        values.push(JSON.stringify(data[key]));
    } else {
        values.push(data[key]);
    }
    paramIndex++;
  }

  // Always update the updated_at timestamp
  updates.push(`updated_at = NOW()`);

  const sql = `
    UPDATE monitors 
    SET ${updates.join(', ')} 
    WHERE id = $1 AND user_id = $2
    RETURNING *;
  `;

  const result = await pool.query(sql, values);
  return result.rows[0] || null;
};


export const updateMonitorStatus = async (
    id: string, 
    status: MonitorStatus , 
    lastCheckedAt: Date
): Promise<Monitor | null> => {
    const sql = `
        UPDATE monitors
        SET status = $2, last_checked_at = $3
        WHERE id = $1
        RETURNING *;
    `;
    const result = await pool.query(sql, [id, status, lastCheckedAt]);
    return result.rows[0] || null;
};


// --- DELETE ---

export const deleteMonitor = async (id: string, userId: string): Promise<boolean> => {
  const sql = `
    DELETE FROM monitors 
    WHERE id = $1 AND user_id = $2;
  `;

  const result = await pool.query(sql, [id, userId]);
  return (result.rowCount || 0) > 0;
};



export const setMonitorActiveStatus = async (id: string, isActive: boolean): Promise<boolean> => {

const sql  = `
update monitors
set is_active = $2 , updated_at = NOW()
where id = $1;
`;

const result = await pool.query(sql,[id,isActive]);
return (result.rowCount || 0) > 0;

}

export const setMonitorInActiveStatus = async (id: string): Promise<boolean> => {

const sql  = `
update monitors
set is_active = $2 , updated_at = NOW()
where id = $1;
`;

const result = await pool.query(sql,[id,false]);
return (result.rowCount || 0) > 0;

}