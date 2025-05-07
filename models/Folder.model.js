import { DataTypes } from "sequelize";
import sequelize from "../config/db.config.js";

const Folder = sequelize.define(
  "Folder",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true, // Adds createdAt & updatedAt automatically
    tableName: "folders", // Custom table name
  }
);

export default Folder;
