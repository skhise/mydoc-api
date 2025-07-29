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
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    created_by:{
      type:DataTypes.INTEGER,
      allowNull:false,
    },
    is_repeated:{
      type:DataTypes.BOOLEAN,
      allowNull:false,
    },
    days_before:{
      type:DataTypes.INTEGER,
      allowNull:false,
    },
    count:{
        type:DataTypes.INTEGER,
        defaultValue:0,
    }
  },
  {
    timestamps: true, // Adds createdAt & updatedAt automatically
    tableName: "reminders", // Custom table name
  }
);

export default Reminder;
