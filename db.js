const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

let pool = null;

const createPool = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'db',
      user: process.env.DB_USER || 'apiresultsuser',
      password: process.env.DB_PASSWORD || 'apiresultspwd',
      database: process.env.DB_NAME || 'cesi_live_quizz',
      port: process.env.DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });

    console.log('Database connection pool created');
  }
  return pool;
};

const getConnection = async () => {
  const pool = createPool();
  return await pool.getConnection();
};

const initializeDatabase = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempting to connect to database (attempt ${i + 1}/${retries})...`);
      const connection = await getConnection();

      console.log('Database connection successful!');

      // Read and execute schema.sql
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = await fs.readFile(schemaPath, 'utf8');

      // Split by semicolon and execute each statement
      const statements = schema
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

      console.log('Initializing database schema...');
      for (const statement of statements) {
        await connection.query(statement);
      }

      console.log('Database schema initialized successfully!');
      connection.release();
      return true;
    } catch (error) {
      console.error(`Database connection attempt ${i + 1} failed:`, error.message);

      if (i < retries - 1) {
        console.log(`Waiting ${delay / 1000} seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('All database connection attempts failed');
        throw error;
      }
    }
  }
};

const query = async (sql, params) => {
  const pool = createPool();
  const [results] = await pool.query(sql, params);
  return results;
};

const closePool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database connection pool closed');
  }
};

module.exports = {
  getConnection,
  initializeDatabase,
  query,
  closePool
};
