import { Sequelize } from 'sequelize';

const sequelize = new Sequelize('mydoc_db', 'root', '', {
  host: 'localhost',
  dialect: 'mysql', // Change to 'postgres', 'sqlite', or 'mssql' if needed
  logging: false, // Disable logging SQL queries (optional)
});

try {
  await sequelize.authenticate();
  console.log('Database connected...');
} catch (err) {
  console.error('Database connection error:', err);
}

export default sequelize;
