"""
Database Connection Setup

WHY THIS FILE EXISTS:
- Centralizes database connection logic
- Handles SQL Server connection with proper configuration
- Provides database session dependency for FastAPI
- Manages connection pooling and error handling
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base  
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Get database URL from environment variables
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

# Create SQLAlchemy engine
# WHY THESE SETTINGS:
# - echo=True shows SQL queries in console (useful for debugging)
# - pool_pre_ping=True tests connections before using them
# - pool_recycle=300 recreates connections every 5 minutes (prevents timeouts)
engine = create_engine(
    DATABASE_URL,
    echo=os.getenv("DEBUG", "false").lower() == "true",
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=5,
    max_overflow=10
)

# Create sessionmaker - this creates database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all database models
Base = declarative_base()

def get_db():
    """
    Database dependency for FastAPI routes
    
    WHY THIS PATTERN:
    - Creates a new database session for each request
    - Automatically closes session when request is done
    - Handles database transactions properly
    - Used with FastAPI's Depends() system
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_connection():
    """
    Test database connection
    
    WHY THIS FUNCTION:
    - Verifies database is accessible during startup
    - Helps diagnose connection issues early
    - Can be called from main.py to check health
    """
    try:
        db = SessionLocal()
        # Try to execute a simple query
        result = db.execute("SELECT 1 as test")
        db.close()
        print("✓ Database connection successful")
        return True
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        print("Check your DATABASE_URL in .env file")
        return False