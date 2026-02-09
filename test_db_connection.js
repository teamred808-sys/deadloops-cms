require('dotenv').config({ path: 'server/.env' });
const mysql = require('mysql2/promise');

async function test() {
    console.log('Testing connection to:', process.env.DB_HOST);
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: 3306 // Tunnel port
        });
        console.log('✅ Connected successfully to MySQL!');
        await connection.end();
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
        console.error(err);
    }
}

test();
