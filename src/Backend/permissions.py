from sqlalchemy.orm import Session
from sqlalchemy import and_
from models import UserRoleMapping, UserRolePermission
from typing import List, Dict


class Modules:
    REAL_ESTATE = 1
    HR = 2

class Features:
    LEADS = 1
    ACTIONS = 2
    
    EMPLOYEES = 1
    SALARIES = 2

def get_user_permissions(db: Session, user_id: int) -> List[Dict]:
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
    
 # take the highest permission level
    permission_dict = {}
    
    for perm in permissions_query:
        key = (perm.module_id, perm.feature_id)
        
        if key not in permission_dict:
            permission_dict[key] = {
                'module_id': perm.module_id,
                'feature_id': perm.feature_id,
                'd_read': bool(perm.d_read),
                'd_write': bool(perm.d_write),
                'd_edit': bool(perm.d_edit),
                'd_delete': bool(perm.d_delete)
            }
        else:
            existing = permission_dict[key]
            existing['d_read'] = existing['d_read'] or bool(perm.d_read)
            existing['d_write'] = existing['d_write'] or bool(perm.d_write)
            existing['d_edit'] = existing['d_edit'] or bool(perm.d_edit)
            existing['d_delete'] = existing['d_delete'] or bool(perm.d_delete)
    
    return list(permission_dict.values())

def has_permission(db: Session, user_id: int, module_id: int, feature_id: int, permission_type: str) -> bool:
    permissions = get_user_permissions(db, user_id)
    
    for perm in permissions:
        if perm['module_id'] == module_id and perm['feature_id'] == feature_id:
            return perm.get(f'd_{permission_type}', False)
    
    return False



def can_read_leads(db: Session, user_id: int) -> bool:
    return has_permission(db, user_id, Modules.REAL_ESTATE, Features.LEADS, 'read')

def can_write_leads(db: Session, user_id: int) -> bool:
    return has_permission(db, user_id, Modules.REAL_ESTATE, Features.LEADS, 'write')

def can_edit_leads(db: Session, user_id: int) -> bool:
    return has_permission(db, user_id, Modules.REAL_ESTATE, Features.LEADS, 'edit')

def can_delete_leads(db: Session, user_id: int) -> bool:
    return has_permission(db, user_id, Modules.REAL_ESTATE, Features.LEADS, 'delete')

def can_manage_actions(db: Session, user_id: int, action_type: str) -> bool:
    return has_permission(db, user_id, Modules.REAL_ESTATE, Features.ACTIONS, action_type)

def can_read_employees(db: Session, user_id: int) -> bool:
    return has_permission(db, user_id, Modules.HR, Features.EMPLOYEES, 'read')

def can_write_employees(db: Session, user_id: int) -> bool:
    return has_permission(db, user_id, Modules.HR, Features.EMPLOYEES, 'write')

def can_edit_employees(db: Session, user_id: int) -> bool:
    return has_permission(db, user_id, Modules.HR, Features.EMPLOYEES, 'edit')

def can_delete_employees(db: Session, user_id: int) -> bool:
    return has_permission(db, user_id, Modules.HR, Features.EMPLOYEES, 'delete')

def can_manage_salaries(db: Session, user_id: int, action_type: str) -> bool:
    return has_permission(db, user_id, Modules.HR, Features.SALARIES, action_type)

def require_permission(db: Session, user_id: int, module_id: int, feature_id: int, permission_type: str):

    if not has_permission(db, user_id, module_id, feature_id, permission_type):
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You don't have {permission_type} permission for this resource"
        )