from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base  
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

# Get database URL from environment variables
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")


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

Base = declarative_base()

def get_db():

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_connection():

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