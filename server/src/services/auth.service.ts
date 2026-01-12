import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import * as userRepo from '../Repository/AuthRepo.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret';

export const Authregister = async (email:string,Plainpassword:string) => {
  console.log('Starting registration process');
  console.log('Looking up user by email:', email);
  const existinguser = await userRepo.findUserByEmail(email);
  
  if(existinguser){
      console.log('User already exists');
      throw new Error("User Already Exits");
  }
  console.log('User does not exist, proceeding with registration');
  const hashpassword = await argon2.hash(Plainpassword);
  console.log('Password hashed, creating user');
  const result = await userRepo.createUser(email,hashpassword);
  console.log('User created successfully');
  return result;
};


export const Authlogin = async (email:string , Plainpassword:string) => {
     const existinguser = await userRepo.findUserByEmail(email)
     if(!existinguser){
        throw new Error("Account Doesnt Exit");
     }

     const isValid = await argon2.verify(existinguser.password,Plainpassword);
     if(!isValid) {
        throw new Error ("Invalid credentials");
     }
     const token = jwt.sign({id:existinguser.id,email:existinguser.email},JWT_SECRET,{
        expiresIn: '1h',
     });

     return {user: existinguser , token};
};