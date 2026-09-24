import { Router } from "express";
import { AuthController } from "./auth.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { UserValidation } from "./auth.validation";



const router = Router();



router.post("/register",validateRequest(UserValidation.UserRegistrationZodSchema), AuthController.registerUser);



export const AuthRoutes = router;