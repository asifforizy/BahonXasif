import cookieParser from "cookie-parser";
import express, { Application, NextFunction, Request, Response } from "express";
import config from "./config";
import cors from 'cors';
import { notFound } from "./middleware/notFound";
import { globalErrorHandler } from "./middleware/globalErrorhandler";
import { AuthRoutes } from "./module/auth/auth.route";
import { redisClient } from "./lib/redis";
import httpStatus from 'http-status';
import crypto from 'crypto';


const app: Application = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: config.app_url,
    credentials: true
  })
);



app.use("/api/v1/auth", AuthRoutes);

app.get("/test", async (req: Request, res: Response, next: NextFunction) => {
	try {
    const otp = crypto.randomInt(100000, 999999).toString();
    
		
    await redisClient.set("forget-password-opt:testerUser@gmail.com", "123456", {
      expiration: {
        type: "EX",
        value: 60,
      },
    });

		res.status(httpStatus.OK).json({
			success: true,
			message: "Welcome to PH Healthcare System Backend",
			data: null,
		});
	} catch (error) {
		console.log(error);
		next(error);
	}
});





app.get("/", async (req: Request, res: Response) => {
  res.send("BahonXasif Backend is running successfully");
});




app.use(notFound)
app.use(globalErrorHandler)
export default app;