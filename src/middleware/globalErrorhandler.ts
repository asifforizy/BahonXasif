import { NextFunction, Request, Response } from "express";

import httpStatus from "http-status";
import { Prisma } from "../../generated/prisma/client";

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
  let message = "Something went wrong";
  let errorDetails: any = null;

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {

      case "P2002":
        statusCode = httpStatus.CONFLICT;
        message = `Duplicate value for ${err.meta?.target}`;
        break;

      case "P2025":
        statusCode = httpStatus.NOT_FOUND;
        message = "Record not found";
        break;

      case "P2003":
        statusCode = httpStatus.BAD_REQUEST;
        message = "Foreign key constraint failed";
        break;

      case "P2000":
        statusCode = httpStatus.BAD_REQUEST;
        message = "Input value is too long";
        break;

      case "P2011":
        statusCode = httpStatus.BAD_REQUEST;
        message = "A required field cannot be null";
        break;

      default:
        statusCode = httpStatus.BAD_REQUEST;
        message = err.message;
    }

    errorDetails = err.meta;
  }

  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = "Prisma validation error";
  }

  else if (err instanceof Prisma.PrismaClientInitializationError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = "Database connection failed";
  }

  else if (err instanceof Prisma.PrismaClientRustPanicError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = "Prisma engine crashed";
  }

  else if (err.statusCode) {
    statusCode = err.statusCode;
    message = err.message;
  }

  else if (err instanceof Error) {
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    statusCode : statusCode,
    message : message,
    error: err.name
      
  });
};