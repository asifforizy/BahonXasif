import dotenv from "dotenv";
import path from "node:path";

dotenv.config({path: path.join(process.cwd(), ".env")});

export default {
    port: process.env.PORT ,
    database_url : process.env.DATABASE_URL,
    app_url : process.env.APP_URL ,
    bycrypt_salt : process.env.BYCRYPT_SALT,
    jwt_access_secret: process.env.JWT_ACCESS_SECRET!,
    jwt_refresh_secret : process.env.JWT_REFRESH_SECRET!,
    jwt_access_expires_in : process.env.JWT_ACCESS_EXPIRES_IN!,
    jwt_refresh_expires_in : process.env.JWT_REFRESH_EXPIRES_IN!,
    stripe_product_id : process.env.STRIPE_PRICE_ID!,
    stripe_secret_key : process.env.STRIPE_SECRET_KEY!,
    stripe_webhook_secret_key : process.env.STRIPE_WEBHOOK_SECRET_KEY!,


}