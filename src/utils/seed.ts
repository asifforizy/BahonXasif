import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import config from "../config";
import { prisma } from "../lib/prisma";
import { AppError } from "./AppError";
import { UserRole } from "../../generated/prisma/enums";

export const seedSuperAdmin = async () => {
	try {
		const isSuperAdminExist = await prisma.user.findFirst({
			where: {
				role: UserRole.SUPER_ADMIN,
			},
		});

		if (isSuperAdminExist) {
			console.log("Super Admin Already Exists!");
			return;
		}

		const name = config.super_admin_name;
		const email = config.super_admin_email;
		const password = config.super_admin_password;

		if (!name || !email || !password) {
			throw new AppError(
				httpStatus.INTERNAL_SERVER_ERROR,
				"Super Admin Name , Email, Password Missing In Env File!!!",
			);
		}

		const hashedPassword = await bcrypt.hash(
			password,
			Number(config.bcrypt_salt_rounds),
		);

		const superAdmin = await prisma.user.create({
			data: {
				name,
				email,
				password: hashedPassword,
				role: UserRole.SUPER_ADMIN,
				needPasswordChange: false,
				emailVerified: true,
			},
		});

		console.log("Super Admin Created : ", superAdmin);
	} catch (error) {
		console.log("Error Seeding Super Admin : ", error);

		await prisma.user.delete({
			where: {
				email: config.super_admin_email,
			},
		});
	}
};

//create tester admin

export const seedTesterAdmin = async () => {
	try {
		const isTesterAdminExist = await prisma.user.findUnique({
			where: {
				email: config.tester_admin_email,
			},
		});

		if (isTesterAdminExist) {
			console.log("Tester Admin Already Exists!");
			return;
		}

		const name = config.tester_admin_name;
		const email = config.tester_admin_email;
		const password = config.tester_admin_password;

		if (!name || !email || !password) {
			throw new AppError(
				httpStatus.INTERNAL_SERVER_ERROR,
				"Tester Admin Name , Email, Password Missing In Env File!!!",
			);
		}

		const hashedPassword = await bcrypt.hash(
			password,
			Number(config.bcrypt_salt_rounds),
		);

		const testerAdmin = await prisma.user.create({
			data: {
				name,
				email,
				password: hashedPassword,
				role: UserRole.ADMIN,
				needPasswordChange: false,
				emailVerified: true,
			},
		});

		console.log("Tester Admin Created : ", testerAdmin);
	} catch (error) {
		console.log("Error Seeding Tester Admin : ", error);

		await prisma.user.delete({
			where: {
				email: config.tester_admin_email,
			},
		});
	}
};

// create tester user

export const seedTesterUser = async () => {
	try {
		const isTesterUserExist = await prisma.user.findUnique({
			where: {
				email: config.tester_user_email,
			},
		});

		if (isTesterUserExist) {
			console.log("Tester User Already Exists!");
			return;
		}

		const name = config.tester_user_name;
		const email = config.tester_user_email;
		const password = config.tester_user_password;

		if (!name || !email || !password) {
			throw new AppError(
				httpStatus.INTERNAL_SERVER_ERROR,
				"Tester User Name , Email, Password Missing In Env File!!!",
			);
		}

		const hashedPassword = await bcrypt.hash(
			password,
			Number(config.bcrypt_salt_rounds),
		);

		const testerUser = await prisma.user.create({
			data: {
				name,
				email,
				password: hashedPassword,
				role: UserRole.CUSTOMER,
				needPasswordChange: false,
				emailVerified: true,
			},
		});

		console.log("Tester User Created : ", testerUser);
	} catch (error) {
		console.log("Error Seeding Tester User : ", error);

		await prisma.user.delete({
			where: {
				email: config.tester_user_email,
			},
		});
	}
};

