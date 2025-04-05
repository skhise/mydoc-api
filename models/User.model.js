import { DataTypes } from "sequelize";
import sequelize from "../config/db.config.js";

const User = sequelize.define(
  "User",
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
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mobile: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    permissions: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastLogin:{
        type:DataTypes.DATE,
    },
  },
  {
    timestamps: true, // Adds createdAt & updatedAt automatically
    tableName: "users", // Custom table name
  }
);

export default User;
