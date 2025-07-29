import express from 'express';
import cors from "cors";
import { clerkMiddleware, requireAuth } from '@clerk/express'
const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true
    })
)
app.use(clerkMiddleware());

// app.use(async(req, res, next)=>{
//     const userId = req.auth.userId
//     if(!userId) return res.status(401).json({msg:"ERROR"});
// })

//importing routes
import healthcheckRouter from './routes/healthcheck.route.js';
app.use("/api/healthcheck", healthcheckRouter);
export default app;
