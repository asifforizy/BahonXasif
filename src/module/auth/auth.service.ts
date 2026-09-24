import bcrypt from "bcryptjs";
import crypto from "crypto";
import path from "path";
import ejs from "ejs";
import { prisma } from "../../lib/prisma";
import httpStatus from "http-status";
import { IRegisterUserPayload } from "./auth.interface";
import { AppError } from "../../utils/AppError";
import { redisClient } from "../../lib/redis";
import { transporter } from "../../lib/nodemailer";
import config from "../../config";


const registerUser = async (payload: IRegisterUserPayload) => {
  const {name,password,phone,role = "CUSTOMER", } = payload;
  const email = payload.email.trim().toLowerCase();

  const isUserExists = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (isUserExists) {
    throw new AppError(
      httpStatus.CONFLICT,
      "User with this email already exists",
    );
  }

  const hashedPassword = await bcrypt.hash(password, 8);

  const expirationSeconds = 5 * 60;

  const otpKey = `user-registration-otp:${email}`;

  const otpValue = crypto
    .randomInt(100000, 1000000)
    .toString();

  await redisClient.set(otpKey, otpValue, {
    expiration: {
      type: "EX",
      value: expirationSeconds,
    },
  });

  const registrationKey = `user-registration-data:${email}`;

  const redisUserDataPayload = {
    name,
    email,
    password: hashedPassword,
    phone,
    role,
  };

  await redisClient.set(
    registrationKey,
    JSON.stringify(redisUserDataPayload),
    {
      expiration: {
        type: "EX",
        value: expirationSeconds,
      },
    },
  );

  const templatePath = path.join(
    process.cwd(),
    "src/app/templates/registration-user-otp.ejs",
  );

  const templateData = {
    name,
    email,
    otp: otpValue,
    expirationMinutes: expirationSeconds / 60,
  };

  const html = await ejs.renderFile(
    templatePath,
    templateData,
  );

  await transporter.sendMail({
    from: config.email_sender,
    to: email,
    subject: "Email Verification",
    html,
  });

  return {
    message:
      "Registration initiated. Please check your email for the verification code.",
  };
};

export const AuthService = {
  registerUser,
};