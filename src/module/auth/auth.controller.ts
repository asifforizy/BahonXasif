import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from 'http-status';
import { AuthService } from "./auth.service";

const registerUser = catchAsync(async (req: Request, res: Response) => { 

  const payload = req.body;
  await AuthService.registerUser(payload);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Verification OTP Sent",
    data: null,
  });
});



export const AuthController = {
	registerUser
};


