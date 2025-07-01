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
    role: {
      type: DataTypes.INTEGER,
      allowNull:false,
      defaultValue:2,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mobile: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pin: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    permissions: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastLogin:{
        type:DataTypes.DATE,
    },
    fcmToken:{
        type:DataTypes.STRING,
    },
  },
  {
    timestamps: true, // Adds createdAt & updatedAt automatically
    tableName: "users", // Custom table name
  }
);

export default User;
