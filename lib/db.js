import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

let db;

function getDBPath() {
  if (typeof window !== 'undefined') return null;
  
  try {
    // For Electron
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'todos.db');
  } catch {
    // For Next.js dev server
    return path.join(process.cwd(), 'todos.db');
  }
}

function initDB() {
  if (db) return db;
  
  const dbPath = getDBPath();
  if (!dbPath) return null;

  db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      synced INTEGER DEFAULT 0,
      deleted INTEGER DEFAULT 0
    )
  `);

  return db;
}

export const localDB = {
  getTodos: () => {
    const database = initDB();
    if (!database) return [];
    return database.prepare('SELECT * FROM todos WHERE deleted = 0 ORDER BY created_at DESC').all();
  },

  addTodo: (todo) => {
    const database = initDB();
    if (!database) return null;
    
    const stmt = database.prepare(`
      INSERT OR REPLACE INTO todos (id, title, completed, created_at, updated_at, synced, deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      todo.id,
      todo.title,
      todo.completed ? 1 : 0,
      todo.created_at,
      todo.updated_at,
      0,
      0
    );
    return todo;
  },

  updateTodo: (id, updates) => {
    const database = initDB();
    if (!database) return null;
    
    const stmt = database.prepare(`
      UPDATE todos 
      SET title = ?, completed = ?, updated_at = ?, synced = 0
      WHERE id = ?
    `);
    
    stmt.run(updates.title, updates.completed ? 1 : 0, Date.now(), id);
    return { id, ...updates };
  },

  deleteTodo: (id) => {
    const database = initDB();
    if (!database) return null;
    
    const stmt = database.prepare(`
      UPDATE todos SET deleted = 1, synced = 0, updated_at = ?
      WHERE id = ?
    `);
    
    stmt.run(Date.now(), id);
    return { id };
  },

  getUnsyncedTodos: () => {
    const database = initDB();
    if (!database) return [];
    return database.prepare('SELECT * FROM todos WHERE synced = 0').all();
  },

  markAsSynced: (ids) => {
    const database = initDB();
    if (!database) return;
    
    const stmt = database.prepare('UPDATE todos SET synced = 1 WHERE id = ?');
    const transaction = database.transaction((todoIds) => {
      for (const id of todoIds) {
        stmt.run(id);
      }
    });
    
    transaction(ids);
  },

  mergeTodos: (remoteTodos) => {
    const database = initDB();
    if (!database) return;
    
    const stmt = database.prepare(`
      INSERT OR REPLACE INTO todos (id, title, completed, created_at, updated_at, synced, deleted)
      VALUES (?, ?, ?, ?, ?, 1, 0)
    `);
    
    const transaction = database.transaction((todos) => {
      for (const todo of todos) {
        stmt.run(
          todo.id,
          todo.title,
          todo.completed ? 1 : 0,
          todo.created_at,
          todo.updated_at
        );
      }
    });
    
    transaction(remoteTodos);
  },
};