


import type { Request, Response } from "express";
import {authSchema} from '../schema/user.js'
import {Authregister,Authlogin} from '../services/auth.service.js'




export const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = authSchema.parse(req.body);
    await Authregister(email, password);
    res.status(201).json({ message: 'User created' });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};



export const login = async (req: Request, res: Response) => {
  try {
    // 1. Validate Input
    const { email, password } = authSchema.parse(req.body);
    
    // 2. Call Service
    const { user, token } = await Authlogin(email, password);

    // 3. Set Cookie (Commented out for development)

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 3600000,
    });


    // 4. Send Response (Token included directly)
    res.json({ 
      message: 'Logged in successfully', 
      userId: user.id,
      token: token
      
    });

  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
};