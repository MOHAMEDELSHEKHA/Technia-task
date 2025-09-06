"""
FastAPI Main Application

WHY THIS FILE EXISTS:
- Entry point for the entire backend application
- Configures FastAPI with CORS, middleware, and routing
- Includes all API route modules
- Handles application startup and health checks
- Sets up error handling and logging

DESIGN PRINCIPLE:
- Keep main.py focused on configuration
- Business logic stays in separate modules
- Clean separation of concerns
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv

# Import database and route modules
from database import test_connection
from api import auth, leads, hr

# Load environment variables
load_dotenv()

# Create FastAPI application instance
app = FastAPI(
    title="Technia ERP System",
    description="Role-based ERP system with Real Estate and HR modules",
    version="1.0.0",
    docs_url="/docs",  # Swagger UI available at /docs
    redoc_url="/redoc"  # ReDoc available at /redoc
)
# main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Add Vite's default port
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Explicitly allow OPTIONS
    allow_headers=["*"],
)
app.include_router(
    auth.router, 
    prefix="/api/auth", 
    tags=["Authentication"]
)

app.include_router(
    leads.router, 
    prefix="/api/real-estate", 
    tags=["Real Estate"]
)

app.include_router(
    hr.router, 
    prefix="/api/hr", 
    tags=["HR"]
)

# Root endpoint
@app.get("/")
def read_root():
    """
    Root endpoint - API information
    WHY: Confirms API is running and provides basic info
    """
    return {
        "message": "Technia ERP System API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
def health_check():
    """
    Health check endpoint
    WHY: Monitoring and deployment verification
    """
    return {
        "status": "healthy",
        "message": "API is running"
    }

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """
    Catch-all exception handler
    WHY: Prevents server crashes and provides consistent error format
    """
    print(f"Global exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "detail": "An unexpected error occurred"
        }
    )

# Startup event
@app.on_event("startup")
async def startup_event():
    """
    Run when application starts
    WHY: Verify database connection and print startup info
    """
    print("🚀 Starting Technia ERP System...")
    print(f"📊 API Documentation: http://localhost:8000/docs")
    print(f"🔍 Alternative Docs: http://localhost:8000/redoc")
    
    # Test database connection
    if test_connection():
        print("✓ Database connection verified")
    else:
        print("✗ Database connection failed - check your .env file")
        print("  Make sure SQL Server is running")
        print("  Verify DATABASE_URL is correct")
    
    print("🎯 API is ready for requests")

# Run the application
if __name__ == "__main__":
    import uvicorn
    
    # Get configuration from environment
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    debug = os.getenv("DEBUG", "false").lower() == "true"
    
    print(f"🏃‍♂️ Running on http://{host}:{port}")
    
    # Start the server
    uvicorn.run(
        "main:app",  # app object from this file
        host=host,
        port=port,
        reload=debug,  # Auto-reload on code changes if debug mode
        log_level="info"
    )