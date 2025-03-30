import { DataTypes } from "sequelize";
import sequelize from "../config/db.config.js";

const Document = sequelize.define(
  "Document",
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
    folder_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    uploaded_by: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    aws_file_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true, // Adds createdAt & updatedAt automatically
    tableName: "documents", // Custom table name
  }
);

export default Document;
