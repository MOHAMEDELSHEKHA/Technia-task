"""
HR Module API Endpoints

WHY THIS FILE EXISTS:
- Handles employee management operations
- Manages salary records for employees
- Enforces HR permissions on all operations
- Maintains separation between system users and employees

KEY CONCEPTS:
- Employees are company staff (may not have system access)
- System users are people who can log into the ERP
- Salary records are tracked by year/month
- All data is scoped to company domain
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List

from database import get_db
from auth import get_current_user
from permissions import Modules, Features, require_permission
from schemas import (
    EmployeeCreate, EmployeeUpdate, EmployeeResponse,
    SalaryCreate, SalaryUpdate, SalaryResponse,
    SuccessResponse
)
from models import UserInfo, EmployeeInfo, EmployeeSalary

router = APIRouter()

# EMPLOYEE CRUD OPERATIONS

@router.post("/employees", response_model=EmployeeResponse)
def create_employee(
    employee_data: EmployeeCreate,
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new employee
    
    WHY THIS ENDPOINT:
    - HR needs to add new company employees
    - Employees are separate from system users
    - Only contact_name is required
    """
    require_permission(db, current_user.id, Modules.HR, Features.EMPLOYEES, 'write')
    
    # Create employee with auto-generated employee_id
    employee = EmployeeInfo(
        **employee_data.dict(),
        company_domain=current_user.company_domain
    )
    
    try:
        db.add(employee)
        db.commit()
        db.refresh(employee)
        return employee
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create employee"
        )

@router.get("/employees", response_model=List[EmployeeResponse])
def get_all_employees(
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all employees for user's company"""
    require_permission(db, current_user.id, Modules.HR, Features.EMPLOYEES, 'read')
    
    employees = db.query(EmployeeInfo).filter(
        EmployeeInfo.company_domain == current_user.company_domain
    ).all()
    
    return employees

@router.get("/employees/{employee_id}", response_model=EmployeeResponse)
def get_employee_by_id(
    employee_id: int,
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific employee"""
    require_permission(db, current_user.id, Modules.HR, Features.EMPLOYEES, 'read')
    
    employee = db.query(EmployeeInfo).filter(
        and_(
            EmployeeInfo.employee_id == employee_id,
            EmployeeInfo.company_domain == current_user.company_domain
        )
    ).first()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    return employee

@router.put("/employees/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: int,
    employee_update: EmployeeUpdate,
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update employee information"""
    require_permission(db, current_user.id, Modules.HR, Features.EMPLOYEES, 'edit')
    
    # Find employee with security check
    employee = db.query(EmployeeInfo).filter(
        and_(
            EmployeeInfo.employee_id == employee_id,
            EmployeeInfo.company_domain == current_user.company_domain
        )
    ).first()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    # Update only provided fields
    update_data = employee_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(employee, field, value)
    
    try:
        db.commit()
        db.refresh(employee)
        return employee
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update employee"
        )

@router.delete("/employees/{employee_id}", response_model=SuccessResponse)
def delete_employee(
    employee_id: int,
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an employee and all salary records"""
    require_permission(db, current_user.id, Modules.HR, Features.EMPLOYEES, 'delete')
    
    # Find employee
    employee = db.query(EmployeeInfo).filter(
        and_(
            EmployeeInfo.employee_id == employee_id,
            EmployeeInfo.company_domain == current_user.company_domain
        )
    ).first()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    try:
        # Delete related salary records first (foreign key constraint)
        db.query(EmployeeSalary).filter(
            and_(
                EmployeeSalary.employee_id == employee_id,
                EmployeeSalary.company_domain == current_user.company_domain
            )
        ).delete()
        
        # Delete employee
        db.delete(employee)
        db.commit()
        
        return SuccessResponse(message="Employee and all salary records deleted successfully")
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete employee"
        )

# SALARY MANAGEMENT

@router.post("/employees/{employee_id}/salaries", response_model=SalaryResponse)
def add_salary_to_employee(
    employee_id: int,
    salary_data: SalaryCreate,
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add salary record to employee
    
    WHY THIS ENDPOINT:
    - Track payroll by month/year
    - Prevent duplicate records for same month
    - Maintain salary history
    """
    require_permission(db, current_user.id, Modules.HR, Features.SALARIES, 'write')
    
    # Verify employee exists
    employee = db.query(EmployeeInfo).filter(
        and_(
            EmployeeInfo.employee_id == employee_id,
            EmployeeInfo.company_domain == current_user.company_domain
        )
    ).first()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    # Check for duplicate salary record
    existing = db.query(EmployeeSalary).filter(
        and_(
            EmployeeSalary.employee_id == employee_id,
            EmployeeSalary.company_domain == current_user.company_domain,
            EmployeeSalary.due_year == salary_data.due_year,
            EmployeeSalary.due_month == salary_data.due_month
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Salary record already exists for {salary_data.due_month}/{salary_data.due_year}"
        )
    
    # Create salary record
    salary = EmployeeSalary(
        **salary_data.dict(),
        employee_id=employee_id,
        company_domain=current_user.company_domain
    )
    
    try:
        db.add(salary)
        db.commit()
        db.refresh(salary)
        return salary
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create salary record"
        )

@router.get("/employees/{employee_id}/salaries", response_model=List[SalaryResponse])
def get_employee_salaries(
    employee_id: int,
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all salary records for an employee"""
    require_permission(db, current_user.id, Modules.HR, Features.SALARIES, 'read')
    
    # Verify employee exists
    employee = db.query(EmployeeInfo).filter(
        and_(
            EmployeeInfo.employee_id == employee_id,
            EmployeeInfo.company_domain == current_user.company_domain
        )
    ).first()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    salaries = db.query(EmployeeSalary).filter(
        and_(
            EmployeeSalary.employee_id == employee_id,
            EmployeeSalary.company_domain == current_user.company_domain
        )
    ).order_by(
        EmployeeSalary.due_year.desc(),
        EmployeeSalary.due_month.desc()
    ).all()
    
    return salaries

@router.put("/employees/{employee_id}/salaries/{year}/{month}", response_model=SalaryResponse)
def update_salary_record(
    employee_id: int,
    year: int,
    month: int,
    salary_update: SalaryUpdate,
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update existing salary record"""
    require_permission(db, current_user.id, Modules.HR, Features.SALARIES, 'edit')
    
    # Find salary record
    salary = db.query(EmployeeSalary).filter(
        and_(
            EmployeeSalary.employee_id == employee_id,
            EmployeeSalary.company_domain == current_user.company_domain,
            EmployeeSalary.due_year == year,
            EmployeeSalary.due_month == month
        )
    ).first()
    
    if not salary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Salary record not found"
        )
    
    # Update fields
    update_data = salary_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(salary, field, value)
    
    try:
        db.commit()
        db.refresh(salary)
        return salary
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update salary record"
        )

@router.delete("/employees/{employee_id}/salaries/{year}/{month}", response_model=SuccessResponse)
def delete_salary_record(
    employee_id: int,
    year: int,
    month: int,
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete salary record"""
    require_permission(db, current_user.id, Modules.HR, Features.SALARIES, 'delete')
    
    # Find salary record
    salary = db.query(EmployeeSalary).filter(
        and_(
            EmployeeSalary.employee_id == employee_id,
            EmployeeSalary.company_domain == current_user.company_domain,
            EmployeeSalary.due_year == year,
            EmployeeSalary.due_month == month
        )
    ).first()
    
    if not salary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Salary record not found"
        )
    
    try:
        db.delete(salary)
        db.commit()
        return SuccessResponse(message="Salary record deleted successfully")
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete salary record"
        )

@router.get("/salaries", response_model=List[SalaryResponse])
def get_all_salaries(
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all salary records for the company
    
    WHY THIS ENDPOINT:
    - Overview of all payroll data
    - HR managers need company-wide salary view
    """
    require_permission(db, current_user.id, Modules.HR, Features.SALARIES, 'read')
    
    salaries = db.query(EmployeeSalary).filter(
        EmployeeSalary.company_domain == current_user.company_domain
    ).order_by(
        EmployeeSalary.due_year.desc(),
        EmployeeSalary.due_month.desc(),
        EmployeeSalary.employee_id
    ).all()
    
    return salaries