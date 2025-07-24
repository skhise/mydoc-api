import { DataTypes } from "sequelize";
import sequelize from "../config/db.config.js";
import Folder from "./Folder.model.js";

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
    folderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    uploaded_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    aws_file_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    aws_file_key: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_fev:{
      type:DataTypes.INTEGER,
      allowNull:true,
      defaultValue:0
    }
  },
  {
    timestamps: true, // Adds createdAt & updatedAt automatically
    tableName: "documents", // Custom table name
  }
);

export default Document;
