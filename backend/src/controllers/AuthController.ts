import passport from 'passport';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs'

import type { Request, Response, NextFunction } from 'express';
import type { IUser } from '../models/user.js';
import User from '../models/user.js'

// --- SIGN UP ---
export const signUp = async (req: Request, res: Response): Promise<Response> => {
    try {
        console.log(req.body)
        const {email, password } = req.body;

        let {username} = req.body;

        if(!email || !username || !password){
            return res.status(400).json({msg:'Missing credentials!'})
        }
        username = username.toLowerCase()
        // 1. Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // 2. Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Create and save user
        user = new User({ username, email, password: hashedPassword, repoList: [] });
        await user.save();

        // 4. Generate and return token for immediate login
        return res.status(201).json({ message: 'User created successfully. Please log in.' });
    } catch (err) {
        console.error(err);
        return res.status(500).send('Server Error during signup');
    }
};
// Using the Passport Local strategy logic for validation
export const logIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    console.log(req.body)
    passport.authenticate(
        'local',
        { session: false },
        (err: Error | null, user: IUser | false, info: { message: string } | undefined) => {
            if (err) {
                return res.status(500).json({
                    message: 'Authentication error occurred',
                    error: err.message
                });
            }

            if (!user) {
                return res.status(401).json({
                    message: info?.message || 'Invalid credentials'
                });
            }

            try {
                // If authentication succeeded, create the JWT
                const payload = { 
                    user: { 
                            id: (user as IUser).id,
                            userName:(user as IUser).username
                    } 
                };

                const token = jwt.sign(
                    payload,
                    process.env.JWT_SECRET || 'your-fallback-secret',
                    { expiresIn: '1h' }
                );

                res.status(200).json({ 
                    token,
                    user: {
                            id: (user as IUser).id,
                        userName:(user as IUser).username
                    }
                });
            } catch (error) {
                res.status(500).json({
                    message: 'Error generating token',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    )(req, res, next);
};

// NOTE: The signUp route still needs manual password hashing (Step 2 in the previous response) 
// and cannot be fully simplified by Passport.