import { UserRole } from "../../../generated/prisma/enums";

export interface IRegisterUserPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: UserRole;
}