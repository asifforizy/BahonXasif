import { UserRole } from "../../../generated/prisma/enums";

export interface IRegisterUserPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: UserRole;
}

export interface ILoginUserPayload {
	email: string;
	password: string;
}


export interface IForgotPasswordPayload {
	email: string;
}


export interface IResetPasswordPayload {
	email: string;
	newPassword: string;
	otp: string;
}


export interface IGoogleLoginPayload {
	idToken: string;
}

