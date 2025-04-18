import { DataTypes } from "sequelize";
import sequelize from "../config/db.config.js";

const Reminder = sequelize.define(
  "Reminder",
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
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    created_by:{
      type:DataTypes.INTEGER,
      allowNull:false,
    }
  },
  {
    timestamps: true, // Adds createdAt & updatedAt automatically
    tableName: "reminders", // Custom table name
  }
);

export default Reminder;
