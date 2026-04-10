/**
 * CREATE DATABASE SCRIPT
 * Creates the college_portal database if it doesn't exist
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function createDatabase() {
    let connection;
    try {
        console.log('🔌 Connecting to MySQL...');
        
        // Connect without specifying database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });

        console.log('✅ Connected to MySQL');

        // Create database
        const dbName = process.env.DB_NAME || 'college_portal';
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        console.log(`✅ Database '${dbName}' created successfully`);

        await connection.end();
        console.log('🎉 Setup complete! You can now run: node seed.js');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error creating database:', error.message);
        if (connection) await connection.end();
        process.exit(1);
    }
}

createDatabase();
