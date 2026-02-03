const mysql = require('mysql2');
const dotenv = require('dotenv');

// Load env vars from the root or server directory
dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    socketPath: process.env.DB_SOCKET || undefined,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Keep connection alive
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
});

// Convert pool to promise-based for easier async/await usage
const promisePool = pool.promise();

// Test connection function
async function testConnection() {
    try {
        const [rows] = await promisePool.query('SELECT 1');
        console.log('✅ Connected to MySQL Database');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}

module.exports = {
    pool: promisePool,
    testConnection,
};
