"""
Authentication API Endpoints

WHY THIS FILE EXISTS:
- Provides login and user info endpoints
- Handles getting user permissions for frontend
- Separates auth routes from business logic routes
- Follows FastAPI router pattern for modular code

ENDPOINTS PROVIDED:
- POST /login - User authentication
- GET /me - Current user information  
- GET /permissions - User's permissions for UI
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from auth import get_current_user, verify_credentials
from schemas import UserLogin, UserResponse, PermissionResponse, SuccessResponse
from permissions import get_user_permissions
from models import UserInfo

# Create router instance
# WHY ROUTER: Allows grouping related endpoints together
router = APIRouter()

@router.post("/login", response_model=UserResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    User login endpoint
    
    WHY THIS ENDPOINT:
    - Validates username/password credentials
    - Returns user information if valid
    - Frontend uses this to check if login succeeded
    
    HOW IT WORKS:
    1. Accept username/password in request body
    2. Verify credentials against database
    3. Return user info if valid, error if not
    """
    user = verify_credentials(credentials.username, credentials.password, db)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    return user

@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: UserInfo = Depends(get_current_user)):
    """
    Get current user information
    
    WHY THIS ENDPOINT:
    - Allows frontend to get user info after login
    - Uses HTTP Basic Auth to identify user
    - Returns same format as login endpoint
    """
    return current_user

@router.get("/permissions", response_model=List[PermissionResponse])
def get_user_permissions_endpoint(
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all permissions for current user
    
    WHY THIS ENDPOINT:
    - Frontend needs to know what features to show/hide
    - Prevents users from seeing buttons they can't use
    - Returns structured permission data
    
    EXAMPLE RESPONSE:
    [
        {"module_id": 1, "feature_id": 1, "d_read": true, "d_write": true, "d_edit": true, "d_delete": true},
        {"module_id": 1, "feature_id": 2, "d_read": true, "d_write": true, "d_edit": true, "d_delete": true},
        {"module_id": 2, "feature_id": 1, "d_read": true, "d_write": true, "d_edit": true, "d_delete": true},
        {"module_id": 2, "feature_id": 2, "d_read": true, "d_write": true, "d_edit": true, "d_delete": true}
    ]
    """
    permissions = get_user_permissions(db, current_user.id)
    return permissions

@router.get("/health", response_model=SuccessResponse)
def health_check():
    """
    Simple health check endpoint
    
    WHY THIS ENDPOINT:
    - Verify API is running
    - No authentication required
    - Useful for monitoring/deployment checks
    """
    return SuccessResponse(message="API is healthy")

@router.get("/db-info")
def get_database_info(db: Session = Depends(get_db)):
    """Get current database information"""
    try:
        from sqlalchemy import text
        
        # Get database name
        db_name = db.execute(text("SELECT DB_NAME() as database_name")).first()
        
        # Count records in key tables
        employee_count = db.execute(text("SELECT COUNT(*) FROM employees_info")).scalar()
        user_count = db.execute(text("SELECT COUNT(*) FROM user_info")).scalar()
        
        return {
            "database_name": db_name[0] if db_name else "Unknown",
            "record_counts": {
                "employees": employee_count,
                "users": user_count
            }
        }
    except Exception as e:
        return {"error": str(e)}
    
@router.get("/users", response_model=List[UserResponse])
def get_users_for_assignment(
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all users in the same company for lead assignment
    
    WHY THIS ENDPOINT:
    - Allows assigning leads to team members
    - Only shows users from the same company
    - Used in lead creation and editing forms
    
    SECURITY:
    - Only returns users from current user's company
    - Requires authentication to access
    - No sensitive data exposed (passwords excluded)
    """
    
    # Get all users from the same company
    users = db.query(UserInfo).filter(
        UserInfo.company_domain == current_user.company_domain
    ).all()
    
    return users