import { DataTypes } from "sequelize";
import sequelize from "../config/db.config.js";

const ExpenseNotificationSettings = sequelize.define(
  "ExpenseNotificationSettings",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    notifyOnAdd: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    notifyOnUpdate: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    notifyOnDelete: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    notifyDailySummary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    dailySummaryTime: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '18:00', // 6 PM default
    },
  },
  {
    timestamps: true,
    tableName: "expense_notification_settings",
  }
);

export default ExpenseNotificationSettings;

