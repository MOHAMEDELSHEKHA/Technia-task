"""
Permission System

WHY THIS FILE EXISTS:
- Centralizes all permission checking logic
- Provides constants for module and feature IDs
- Makes permission queries reusable across different endpoints
- Ensures consistent security checks throughout the application

DESIGN PRINCIPLE:
- Every API operation checks permissions before proceeding
- Permissions are checked at the feature level (Leads, Actions, etc.)
- Users can have multiple roles, so we take the highest permission
- Clear constants make code readable and prevent magic numbers
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_
from models import UserRoleMapping, UserRolePermission
from typing import List, Dict

# MODULE AND FEATURE CONSTANTS
# WHY CONSTANTS: Prevents typos and makes code more readable

class Modules:
    """Module IDs from your database"""
    REAL_ESTATE = 1
    HR = 2

class Features:
    """Feature IDs from your database - note they're per-module"""
    # Real Estate Features
    LEADS = 1
    ACTIONS = 2
    
    # HR Features (same numbers, but different module)
    EMPLOYEES = 1
    SALARIES = 2

def get_user_permissions(db: Session, user_id: int) -> List[Dict]:
    """
    Get all permissions for a user across all their roles
    
    WHY THIS FUNCTION:
    - Users can have multiple roles (Ahmed has Manager + HR Head)
    - We need to combine permissions from all roles
    - Returns data structure that frontend can use
    
    HOW IT WORKS:
    1. Find all roles assigned to the user
    2. Get permissions for each role
    3. Combine permissions (take highest level)
    4. Return list of permissions by module/feature
    """
    
    # Query to get all user permissions
    # This joins: user_role_mapping -> user_role_permissions
    permissions_query = db.query(
        UserRolePermission.module_id,
        UserRolePermission.feature_id,
        UserRolePermission.d_read,
        UserRolePermission.d_write,
        UserRolePermission.d_edit,
        UserRolePermission.d_delete
    ).join(
        UserRoleMapping, UserRolePermission.role_id == UserRoleMapping.role_id
    ).filter(
        UserRoleMapping.user_id == user_id
    ).all()
    
    # Combine permissions from multiple roles
    # WHY: If user has multiple roles, take the highest permission level
    permission_dict = {}
    
    for perm in permissions_query:
        # Create unique key for each module/feature combination
        key = (perm.module_id, perm.feature_id)
        
        if key not in permission_dict:
            # First time seeing this module/feature
            permission_dict[key] = {
                'module_id': perm.module_id,
                'feature_id': perm.feature_id,
                'd_read': bool(perm.d_read),
                'd_write': bool(perm.d_write),
                'd_edit': bool(perm.d_edit),
                'd_delete': bool(perm.d_delete)
            }
        else:
            # Combine with existing permissions (take highest)
            existing = permission_dict[key]
            existing['d_read'] = existing['d_read'] or bool(perm.d_read)
            existing['d_write'] = existing['d_write'] or bool(perm.d_write)
            existing['d_edit'] = existing['d_edit'] or bool(perm.d_edit)
            existing['d_delete'] = existing['d_delete'] or bool(perm.d_delete)
    
    return list(permission_dict.values())

def has_permission(db: Session, user_id: int, module_id: int, feature_id: int, permission_type: str) -> bool:
    """
    Check if user has specific permission
    
    WHY THIS FUNCTION:
    - Every API endpoint needs to check permissions
    - Provides simple True/False answer
    - Prevents unauthorized operations
    
    PARAMETERS:
    - user_id: The user making the request
    - module_id: 1=Real Estate, 2=HR
    - feature_id: 1=Leads/Employees, 2=Actions/Salaries
    - permission_type: 'read', 'write', 'edit', 'delete'
    """
    permissions = get_user_permissions(db, user_id)
    
    for perm in permissions:
        if perm['module_id'] == module_id and perm['feature_id'] == feature_id:
            return perm.get(f'd_{permission_type}', False)
    
    return False

# CONVENIENCE FUNCTIONS
# WHY: Make permission checks more readable in API endpoints

def can_read_leads(db: Session, user_id: int) -> bool:
    """Check if user can view leads"""
    return has_permission(db, user_id, Modules.REAL_ESTATE, Features.LEADS, 'read')

def can_write_leads(db: Session, user_id: int) -> bool:
    """Check if user can create leads"""
    return has_permission(db, user_id, Modules.REAL_ESTATE, Features.LEADS, 'write')

def can_edit_leads(db: Session, user_id: int) -> bool:
    """Check if user can modify leads"""
    return has_permission(db, user_id, Modules.REAL_ESTATE, Features.LEADS, 'edit')

def can_delete_leads(db: Session, user_id: int) -> bool:
    """Check if user can delete leads"""
    return has_permission(db, user_id, Modules.REAL_ESTATE, Features.LEADS, 'delete')

def can_manage_actions(db: Session, user_id: int, action_type: str) -> bool:
    """Check if user can manage calls/meetings"""
    return has_permission(db, user_id, Modules.REAL_ESTATE, Features.ACTIONS, action_type)

def can_read_employees(db: Session, user_id: int) -> bool:
    """Check if user can view employees"""
    return has_permission(db, user_id, Modules.HR, Features.EMPLOYEES, 'read')

def can_write_employees(db: Session, user_id: int) -> bool:
    """Check if user can create employees"""
    return has_permission(db, user_id, Modules.HR, Features.EMPLOYEES, 'write')

def can_edit_employees(db: Session, user_id: int) -> bool:
    """Check if user can modify employees"""
    return has_permission(db, user_id, Modules.HR, Features.EMPLOYEES, 'edit')

def can_delete_employees(db: Session, user_id: int) -> bool:
    """Check if user can delete employees"""
    return has_permission(db, user_id, Modules.HR, Features.EMPLOYEES, 'delete')

def can_manage_salaries(db: Session, user_id: int, action_type: str) -> bool:
    """Check if user can manage salaries"""
    return has_permission(db, user_id, Modules.HR, Features.SALARIES, action_type)

def require_permission(db: Session, user_id: int, module_id: int, feature_id: int, permission_type: str):
    """
    Raise HTTP exception if user lacks permission
    
    WHY: Simplifies API endpoints - just call this and it handles the error
    """
    if not has_permission(db, user_id, module_id, feature_id, permission_type):
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You don't have {permission_type} permission for this resource"
        )