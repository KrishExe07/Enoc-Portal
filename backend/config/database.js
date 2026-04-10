/**
 * DATABASE CONFIGURATION
 * Sequelize connection to MySQL
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME || 'college_portal',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        define: {
            timestamps: true,
            underscored: false,
            freezeTableName: true
        }
    }
);

// Test connection
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ MySQL Database connected successfully');
        return true;
    } catch (error) {
        console.error('⚠️ Unable to connect to MySQL database:', error.message);
        console.warn('⚠️ WARNING: Database not available. Some features may not work.');
        console.warn('📝 To fix: Update DB_PASSWORD in backend/.env and ensure MySQL is running');
        return false;
    }
};

// Sync database (create tables if they don't exist)
const syncDatabase = async (force = false) => {
    try {
        await sequelize.sync({ force }); // force: true will drop and recreate tables
        console.log('✅ Database synchronized');
    } catch (error) {
        console.error('❌ Database sync error:', error);
    }
};

module.exports = {
    sequelize,
    testConnection,
    syncDatabase
};
