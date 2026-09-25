import bcrypt from "bcryptjs";
import crypto from "crypto";
import path from "path";
import ejs from "ejs";
import { prisma } from "../../lib/prisma";
import httpStatus from "http-status";
import { IForgotPasswordPayload, ILoginUserPayload, IRegisterUserPayload, IResetPasswordPayload } from "./auth.interface";
import { AppError } from "../../utils/AppError";
import { redisClient } from "../../lib/redis";
import { transporter } from "../../lib/nodemailer";
import config from "../../config";
import { UserStatus } from "../../../generated/prisma/client";
import { jwtUtils } from "../../utils/jwt";
import { SignOptions } from "jsonwebtoken";


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


const loginUser = async (payload: ILoginUserPayload) => {

	const { password } = payload;
	const email = payload.email.trim().toLowerCase();

	const user = await prisma.user.findUnique({
		where: { email },
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User Not Found")
	}

	if (user.status === UserStatus.BANNED) {
		throw new AppError(httpStatus.FORBIDDEN, "User is blocked");
	}


	if (user.password === null && user.googleId !== null) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"User Already Has Account Registered With Google. Try To Login With Google.",
		);
	}

	const isPasswordMatched = await bcrypt.compare(
		password,
		user.password as string,
	);

	if (!isPasswordMatched) {
		throw new AppError(httpStatus.UNAUTHORIZED, "Invalid credentials");
	}

	const jwtPayload = {
		userId: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
	};

	const accessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_access_secret,
		config.jwt_access_expires_in as SignOptions,
	);

	const refreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_refresh_secret,
		config.jwt_refresh_expires_in as SignOptions,
	);

	return {
		accessToken,
		refreshToken,
	};
};




const forgotPassword = async (payload: IForgotPasswordPayload) => {
	const { email } = payload;

	const isUserExist = await prisma.user.findUnique({
		where: {
			email,
		},
	});

	if (!isUserExist) {
		throw new AppError(httpStatus.NOT_FOUND, "User Does Not Exist!");
	}

	if (isUserExist.status === "BANNED") {
		throw new AppError(httpStatus.FORBIDDEN, "User is Blocked");
	}

	if (!isUserExist.emailVerifiedAt) {
		throw new AppError(httpStatus.FORBIDDEN, "User Not Verified");
	}


	if (isUserExist.googleId && isUserExist.authProvider === "GOOGLE") {
		throw new AppError(httpStatus.BAD_REQUEST, "User Has Account With Google");
	}

	const otp = crypto.randomInt(100000, 1000000).toString();

	const key = `forgor-password-otp:${isUserExist.email}`;

	const expirationSeconds = 5 * 60;

	await redisClient.set(key, otp, {
		expiration: {
			type: "EX",
			value: expirationSeconds,
		},
	});

	const tempatePath = path.join(
		process.cwd(),
		"src/app/templates/forgot-password.ejs",
	);

	const templateData = {
		name: isUserExist.name,
		otp,
		expirationMinutes: expirationSeconds / 60,
	};

	const html = await ejs.renderFile(tempatePath, templateData);

	await transporter.sendMail({
		from: config.email_sender,
		to: isUserExist.email,
		subject: "Forgot Password",
		// text : `Your OTP is ${otp}`
		// html: `<h1>Your OTP is ${otp}</h1>`
		html,
	});
};



const resetPassword = async (payload: IResetPasswordPayload) => {
	const { email, otp, newPassword } = payload;

	const isUserExist = await prisma.user.findUnique({
		where: {
			email,
		},
	});

	if (!isUserExist) {
		throw new AppError(httpStatus.NOT_FOUND, "User Does Not Exist!");
	}

	if (isUserExist.status === "BANNED") {
		throw new AppError(httpStatus.FORBIDDEN, "User is Blocked");
	}

	if (!isUserExist.emailVerifiedAt) {
		throw new AppError(httpStatus.FORBIDDEN, "User Not Verified");
	}


	if (isUserExist.googleId && isUserExist.authProvider === "GOOGLE") {
		throw new AppError(httpStatus.BAD_REQUEST, "User Has Account With Google");
	}

	const key = `forgor-password-otp:${isUserExist.email}`;

	const redisOtp = await redisClient.get(key);

	if (!redisOtp) {
		throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP");
	}

	if (redisOtp !== otp) {
		throw new AppError(httpStatus.BAD_REQUEST, "OTP Does Not Match");
	}

	const hashedNewPassword = await bcrypt.hash(
		newPassword,
		Number(config.bcrypt_salt_rounds),
	);

	await prisma.user.update({
		where: {
			email: isUserExist.email,
		},
		data: {
			password: hashedNewPassword,
		},
	});

	await redisClient.del([key]);

	const tempatePath = path.join(
		process.cwd(),
		"src/app/templates/reset-password-success.ejs",
	);

	const templateData = {
		name: isUserExist.name,
	};

	const html = await ejs.renderFile(tempatePath, templateData);

	await transporter.sendMail({
		from: config.email_sender,
		to: isUserExist.email,
		subject: "Password Changed",
		// text : `Your OTP is ${otp}`
		// html: `<h1>Your Password Is Changed</h1>`
		html,
	});
};





















export const AuthService = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
};