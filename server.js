/**
 * BACKEND SERVER
 * Run this file with: node server.js
 * 
 * Prerequisites:
 * 1. PostgreSQL database running
 * 2. .env file with DATABASE_URL=postgresql://...
 * 3. Dependencies installed: npm install express pg cors body-parser dotenv
 */

import express from 'express';
import pg from 'pg';
const { Pool } = pg;
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Check for required config
if (!process.env.DATABASE_URL) {
  console.warn("⚠️ WARNING: DATABASE_URL is not set in .env file.");
  console.warn("   The server will start, but database operations will likely fail.");
  console.warn("   Format: postgresql://user:password@localhost:5432/database_name");
}

// PostgreSQL Connection Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, 
});

app.use(cors());
app.use(bodyParser.json());

// --- Database Initialization ---
const initDb = async () => {
  const createSessionsTable = `
    CREATE TABLE IF NOT EXISTS sessions (
      id UUID PRIMARY KEY,
      title TEXT NOT NULL,
      preview TEXT,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    );
  `;

  const createMessagesTable = `
    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY,
      session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
      role VARCHAR(50) NOT NULL,
      content TEXT NOT NULL,
      is_error BOOLEAN DEFAULT FALSE,
      timestamp BIGINT NOT NULL
    );
  `;

  try {
    await pool.query(createSessionsTable);
    await pool.query(createMessagesTable);
    console.log("✅ Database tables ensured (sessions, messages).");
  } catch (err) {
    console.error("❌ Error initializing database tables:", err);
    console.error("   Please check your DATABASE_URL and ensure PostgreSQL is running.");
  }
};

// Initialize DB on startup
initDb();

// Helper route to check status
app.get('/', (req, res) => {
  res.send('Gemini Chat Backend is running! 🚀<br>Frontend should be run separately (e.g., yarn dev).');
});

// --- Sessions API ---

// Get all sessions
app.get('/api/sessions', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sessions ORDER BY updated_at DESC');
    // Convert snake_case to camelCase for frontend
    const sessions = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      preview: row.preview || '',
      createdAt: parseInt(row.created_at),
      updatedAt: parseInt(row.updated_at)
    }));
    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Create a new session
app.post('/api/sessions', async (req, res) => {
  const { id, title, createdAt, updatedAt, preview } = req.body;
  try {
    await pool.query(
      'INSERT INTO sessions (id, title, preview, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)',
      [id, title, preview, createdAt, updatedAt]
    );
    res.status(201).json({ message: 'Session created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update a session
app.patch('/api/sessions/:id', async (req, res) => {
  const { id } = req.params;
  const { title, preview, updatedAt } = req.body;
  
  // Build dynamic query
  const fields = [];
  const values = [];
  let idx = 1;

  if (title !== undefined) { fields.push(`title = $${idx++}`); values.push(title); }
  if (preview !== undefined) { fields.push(`preview = $${idx++}`); values.push(preview); }
  if (updatedAt !== undefined) { fields.push(`updated_at = $${idx++}`); values.push(updatedAt); }

  if (fields.length === 0) return res.json({ message: 'No updates' });

  values.push(id);
  const query = `UPDATE sessions SET ${fields.join(', ')} WHERE id = $${idx}`;

  try {
    await pool.query(query, values);
    res.json({ message: 'Session updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete a session
app.delete('/api/sessions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM sessions WHERE id = $1', [id]);
    res.json({ message: 'Session deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// --- Messages API ---

// Get messages by session
app.get('/api/sessions/:sessionId/messages', async (req, res) => {
  const { sessionId } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM messages WHERE session_id = $1 ORDER BY timestamp ASC',
      [sessionId]
    );
    const messages = result.rows.map(row => ({
      id: row.id,
      sessionId: row.session_id,
      role: row.role,
      content: row.content,
      isError: row.is_error,
      timestamp: parseInt(row.timestamp)
    }));
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Save a message
app.post('/api/messages', async (req, res) => {
  const { id, sessionId, role, content, timestamp, isError } = req.body;
  try {
    await pool.query(
      'INSERT INTO messages (id, session_id, role, content, is_error, timestamp) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, sessionId, role, content, isError || false, timestamp]
    );
    
    // Also update session timestamp and preview
    const preview = content.substring(0, 60) + (content.length > 60 ? '...' : '');
    await pool.query(
      'UPDATE sessions SET updated_at = $1, preview = $2 WHERE id = $3',
      [timestamp, preview, sessionId]
    );

    res.status(201).json({ message: 'Message saved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});