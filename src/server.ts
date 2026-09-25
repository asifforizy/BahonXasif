
import app from "./app";
import config from "./config";
import "dotenv/config";
import { prisma } from "./lib/prisma";
import { redisClient } from "./lib/redis";



const PORT = config.port;

async function main() {
  try {
    await prisma.$connect();
    console.log("connect to database successfully");
    await redisClient.connect();
    console.log("connect to redis successfully");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
     await prisma.$disconnect();
    process.exit(1);
  }
}

main();