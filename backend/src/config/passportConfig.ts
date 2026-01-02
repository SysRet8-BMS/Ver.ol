import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt} from 'passport-jwt';
import type {StrategyOptions} from 'passport-jwt'
import bcrypt from 'bcryptjs';
import User from '../models/user.js'; // Adjust path and type as needed
import type {IUser} from '../models/user.js'

/**
 * Configures and sets up all Passport strategies (Local and JWT).
 */
export const configurePassport = (): void => {
    
    // Ensure JWT_SECRET is available
    if (!process.env.JWT_SECRET) {
        console.error("FATAL ERROR: JWT_SECRET environment variable is not set.");
        return;
    }

    // ==========================================================
    // 1. LOCAL STRATEGY (Used for Login)
    // ==========================================================
    passport.use(new LocalStrategy(
        {
            usernameField: 'username', 
            passwordField: 'password',
            session: false 
        },
        async (username, password, done) => {
            try {
                // Includes the essential .select('+password') fix
                const user = await User.findOne({ username: username.toLowerCase() }).select('+password');

                if (!user) {
                    return done(null, false, { message: 'Incorrect username.' });
                }

                const isMatch = await bcrypt.compare(password, user.password);

                if (!isMatch) {
                    return done(null, false, { message: 'Incorrect password.' });
                }

                // Success: Return the user object (excluding the hash again)
                return done(null, user);

            } catch (error) {
                return done(error);
            }
        }
    ));

    // ==========================================================
    // 2. JWT STRATEGY (Used for Protected Routes)
    // ==========================================================

    const jwtOptions: StrategyOptions = {
        // Tells Passport to look for the token in the Authorization: Bearer <token> header
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), 
        // The secret key used to verify the token's signature
        secretOrKey: process.env.JWT_SECRET, 
        // Optional: Ignores tokens that have expired (recommended to keep true)
        ignoreExpiration: false 
    };

    passport.use(new JwtStrategy(jwtOptions, async (jwt_payload, done) => {
        try {
            // jwt_payload contains the data you put in the token (e.g., user ID)
            const user = await User.findById(jwt_payload.user.id); // Assuming you store 'id' in the token payload, go to Authcontroller to see payload

            console.log(user)
            if (user) {
                // Success: Token is valid and user exists. Passport attaches this user object to req.user
                return done(null, user); 
            } else {
                // Token is valid, but user no longer exists in DB (e.g., user was deleted)
                return done(null, false);
            }
        } catch (error) {
            // Database or server error during lookup
            return done(error, false);
        }
    }));
    
    // Required even if not using sessions, but kept minimal.
    passport.serializeUser((user, done) => {
        done(null, (user as IUser).id);
    });

    passport.deserializeUser(async (id: string, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (error) {
            done(error);
        }
    });
};
