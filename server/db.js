const mysql = require('mysql2');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars from the server directory (where this file lives)
// This handles Hostinger's lsnode which runs with a different CWD
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('DEBUG: DB_HOST from env:', process.env.DB_HOST);
console.log('DEBUG: __dirname:', __dirname);
console.log('DEBUG: Loaded .env from:', path.join(__dirname, '.env'));

// Create the connection pool
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
    // namedPlaceholders: true // careful with this if existing queries use ?
});

// Convert pool to promise-based for easier async/await usage
const promisePool = pool.promise();

// Heartbeat function to keep connections alive
const HEARTBEAT_INTERVAL = 5 * 60 * 1000; // 5 minutes

function startHeartbeat() {
    setInterval(async () => {
        try {
            await promisePool.query('SELECT 1');
            // console.log('💓 Database heartbeat: OK'); // Uncomment for debugging
        } catch (error) {
            console.error('❌ Database heartbeat failed:', error.message);
            // Optional: exit process if DB is consistently down?
            // process.exit(1);
        }
    }, HEARTBEAT_INTERVAL);
}

// Start the heartbeat
startHeartbeat();

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

module.exports.pool = promisePool;