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
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    timestamps: true, // Adds createdAt & updatedAt automatically
    tableName: "folders", // Custom table name
    paranoid: false, // We'll handle soft delete manually
  }
);

export default Folder;
