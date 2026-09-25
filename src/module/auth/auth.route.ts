import { Router } from "express";
import { AuthController } from "./auth.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { UserValidation } from "./auth.validation";



const router = Router();



router.post("/register",validateRequest(UserValidation.UserRegistrationZodSchema), AuthController.registerUser);
router.post("/login",validateRequest(UserValidation.LoginZodSchema),AuthController.loginUser,)
router.post("/forgot-password",validateRequest(UserValidation.ForgotPasswordZodSchema),AuthController.forgotPassword,);
router.post("/reset-password",validateRequest(UserValidation.ResetPasswordZodSchema),AuthController.resetPassword,);


export const AuthRoutes = router;