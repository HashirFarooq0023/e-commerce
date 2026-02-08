"""
Database handler for data persistence.
Supports multiple database backends (SQLite, PostgreSQL, etc.)
"""

from typing import List, Dict, Optional
import sqlite3
import json
import os
from pathlib import Path


class DatabaseHandler:
    """Database handler for storing application data."""
    
    def __init__(self, db_type: str = "sqlite", connection_string: Optional[str] = None):
        """
        Initialize database handler.
        
        Args:
            db_type: Type of database ("sqlite" or "postgresql")
            connection_string: Database connection string
        """
        self.db_type = db_type
        self.connection_string = connection_string or "data/database/store.db"
        self._connection = None
        
        if db_type == "sqlite":
            Path(os.path.dirname(self.connection_string)).mkdir(parents=True, exist_ok=True)
            self._init_sqlite()
    
    def _init_sqlite(self):
        """Initialize SQLite database and tables."""
        self._connection = sqlite3.connect(self.connection_string)
        self._connection.row_factory = sqlite3.Row
        cursor = self._connection.cursor()
        
        # Create tables
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT,
                role TEXT,
                content TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                metadata TEXT
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT UNIQUE,
                user_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_activity DATETIME
            )
        """)
        
        self._connection.commit()
    
    def save_conversation(
        self,
        session_id: str,
        role: str,
        content: str,
        metadata: Optional[Dict] = None
    ):
        """
        Save conversation message to database.
        
        Args:
            session_id: Session identifier
            role: Message role
            content: Message content
            metadata: Optional metadata
        """
        if self._connection is None:
            return
        
        cursor = self._connection.cursor()
        metadata_json = json.dumps(metadata) if metadata else None
        
        cursor.execute("""
            INSERT INTO conversations (session_id, role, content, metadata)
            VALUES (?, ?, ?, ?)
        """, (session_id, role, content, metadata_json))
        
        # Update session last activity
        cursor.execute("""
            INSERT OR REPLACE INTO user_sessions (session_id, last_activity)
            VALUES (?, CURRENT_TIMESTAMP)
        """, (session_id,))
        
        self._connection.commit()
    
    def get_conversation_history(self, session_id: str, limit: Optional[int] = None) -> List[Dict]:
        """
        Get conversation history for a session.
        
        Args:
            session_id: Session identifier
            limit: Maximum number of messages to retrieve
            
        Returns:
            List of conversation messages
        """
        if self._connection is None:
            return []
        
        cursor = self._connection.cursor()
        query = """
            SELECT role, content, timestamp, metadata
            FROM conversations
            WHERE session_id = ?
            ORDER BY timestamp ASC
        """
        
        if limit:
            query += f" LIMIT {limit}"
        
        cursor.execute(query, (session_id,))
        rows = cursor.fetchall()
        
        return [
            {
                "role": row["role"],
                "content": row["content"],
                "timestamp": row["timestamp"],
                "metadata": json.loads(row["metadata"]) if row["metadata"] else None
            }
            for row in rows
        ]
    
    def close(self):
        """Close database connection."""
        if self._connection:
            self._connection.close()
            self._connection = None

