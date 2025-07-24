import { Sequelize } from "sequelize";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || "mysql", // Default to MySQL if not specified
    logging: false, // Disable logging SQL queries (optional)
  }
);

// Function to authenticate database connection
const connectDB = async () => {
  try {
    await sequelize.authenticate();
  } catch (err) {
  }
};

// Call the function to connect to the database
connectDB();

export default sequelize;
