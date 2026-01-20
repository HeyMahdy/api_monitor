import { pool } from "../db/db_config.js";

export interface User {
  id: string;
  email: string;
  password: string;
}

export const createUser = async (email: string, passwordHash: string): Promise<User> => {
  
  const sql = `
    INSERT INTO users (email, password_hash) 
    VALUES ($1, $2) 
    RETURNING id, email, password_hash AS password;
  `;

  try {
    const result = await pool.query(sql, [email, passwordHash]);
    return result.rows[0];
  } catch (error: any) {
    console.error('Error in createUser:', error);
    if (error.code === '23505') {
      throw new Error('Email already exists');
    }
    throw error;
  }
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
  
  const sql = `SELECT id, email, password_hash AS password FROM users WHERE email = $1;`
  
  try {
    const result = await pool.query(sql, [email]);
    return result.rows[0] ;
  } catch (error) {
    console.error('Error in findUserByEmail:', error);
    throw error;
  }
};