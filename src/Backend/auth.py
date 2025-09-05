"""
Authentication Logic

WHY THIS FILE EXISTS:
- Centralizes user authentication logic
- Provides a reusable function to validate credentials
- Handles the current_user dependency for FastAPI routes
- Keeps auth logic separate from API endpoints

DESIGN PRINCIPLE:
- Simple HTTP Basic Authentication (username:password)
- Real apps would use JWT tokens and password hashing
- But for learning, this demonstrates the concepts clearly
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from sqlalchemy.orm import Session
from database import get_db
from models import UserInfo

# HTTP Basic Auth dependency
security = HTTPBasic()

def get_current_user(
    credentials: HTTPBasicCredentials = Depends(security), 
    db: Session = Depends(get_db)
) -> UserInfo:
    """
    Validates user credentials and returns user object
    
    WHY THIS FUNCTION:
    - Used by all protected routes with Depends(get_current_user)
    - Automatically handles authentication for any endpoint
    - Returns the actual user object for use in the endpoint
    - Raises 401 error if credentials are invalid
    
    HOW IT WORKS:
    1. FastAPI extracts username:password from Authorization header
    2. We query database for user with that username
    3. Check if password matches (in real app, would hash passwords)
    4. Return user object if valid, raise error if not
    """
    
    # Find user by username
    user = db.query(UserInfo).filter(UserInfo.username == credentials.username).first()
    
    # Validate user exists and password matches
    if not user or user.password_hash != credentials.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    
    # Return user object for use in the route
    return user

def verify_credentials(username: str, password: str, db: Session) -> UserInfo:
    """
    Direct credential verification (used by login endpoint)
    
    WHY SEPARATE FUNCTION:
    - Login endpoint doesn't use HTTP Basic Auth headers
    - Allows manual credential checking
    - Returns None if invalid instead of raising exception
    """
    user = db.query(UserInfo).filter(UserInfo.username == username).first()
    
    if user and user.password_hash == password:
        return user
    return None