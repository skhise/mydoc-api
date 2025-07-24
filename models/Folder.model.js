import { DataTypes } from "sequelize";
import sequelize from "../config/db.config.js";
import Document from "./Document.model.js";

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
