import express from 'express';
import cors from "cors";
import ApiError from './utils/ApiError.js';
import AsyncHandler from './utils/AsyncHandler.js';
import errorHandler from './middlewares/error.middleware.js';
import { clerkMiddleware } from '@clerk/express'

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true
    })
)
app.use(express.json());
app.use(clerkMiddleware());

//AUTH PROTECTION
app.use(AsyncHandler((req, res, next)=>{
    const userId = req.auth().userId
    // if(!userId) throw new ApiError(401, "User not authenticated.")
    next();
}))

//importing routes
import healthcheckRouter from './routes/healthcheck.route.js';
import vaultRouter from './routes/vault.route.js';

//routes
app.use("/api/healthcheck", healthcheckRouter);
app.use("/api/vaults", vaultRouter);

app.use(errorHandler);
export default app;
