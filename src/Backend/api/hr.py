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
from typing import Dict
from datetime import datetime  # Add this import at the top



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
# Updated hr.py - FINAL CORRECTED version for your database schema

# FINAL WORKING hr.py - Employee creation that works with your IDENTITY column

# Replace your create_employee function in hr.py with this:

@router.post("/employees", response_model=EmployeeResponse)
def create_employee(
    employee_data: EmployeeCreate,
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new employee using raw SQL (works with IDENTITY columns)"""
    require_permission(db, current_user.id, Modules.HR, Features.EMPLOYEES, 'write')
    
    try:
        from sqlalchemy import text
        
        # Use raw SQL to insert employee (let SQL Server handle employee_id)
        result = db.execute(text("""
            INSERT INTO employees_info 
            (company_domain, contact_name, business_phone, personal_phone, 
             business_email, personal_email, gender, is_company_admin)
            OUTPUT INSERTED.employee_id, INSERTED.date_added
            VALUES (:company_domain, :contact_name, :business_phone, :personal_phone,
                    :business_email, :personal_email, :gender, :is_company_admin)
        """), {
            'company_domain': current_user.company_domain,
            'contact_name': employee_data.contact_name,
            'business_phone': employee_data.business_phone,
            'personal_phone': employee_data.personal_phone,
            'business_email': employee_data.business_email,
            'personal_email': employee_data.personal_email,
            'gender': employee_data.gender,
            'is_company_admin': 1 if employee_data.is_company_admin else 0
        })
        
        # Get the generated values
        row = result.fetchone()
        employee_id = row[0]
        date_added = row[1]
        
        db.commit()
        
        # Return response in expected format
        return EmployeeResponse(
            employee_id=employee_id,
            company_domain=current_user.company_domain,
            contact_name=employee_data.contact_name,
            business_phone=employee_data.business_phone,
            personal_phone=employee_data.personal_phone,
            business_email=employee_data.business_email,
            personal_email=employee_data.personal_email,
            gender=employee_data.gender,
            is_company_admin=employee_data.is_company_admin,
            date_added=date_added
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create employee: {str(e)}"
        )
# Alternative method using SQLAlchemy ORM (if the above doesn't work)

# @router.post("/employees", response_model=EmployeeResponse)
# def create_employee(
#     employee_data: EmployeeCreate,
#     current_user: UserInfo = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """
#     Create a new employee with improved error handling
#     """
#     try:
#         # Check permission first
#         require_permission(db, current_user.id, Modules.HR, Features.EMPLOYEES, 'write')
        
#         # Debug: Print the data being received
#         print(f"Creating employee with data: {employee_data.dict()}")
#         print(f"User company domain: {current_user.company_domain}")
        
#         # Create employee with auto-generated employee_id
#         employee = EmployeeInfo(
#             **employee_data.dict(),
#             company_domain=current_user.company_domain
#         )
        
#         # Debug: Print the employee object before saving
#         print(f"Employee object: {employee.__dict__}")
        
#         db.add(employee)
#         db.flush()  # This will assign the ID without committing
        
#         # Debug: Print employee after flush
#         print(f"Employee after flush: {employee.__dict__}")
        
#         db.commit()
#         db.refresh(employee)
        
#         # Debug: Print final employee
#         print(f"Employee after commit: {employee.__dict__}")
        
#         return employee
        
#     except Exception as e:
#         db.rollback()
#         # Better error logging
#         print(f"Error creating employee: {str(e)}")
#         print(f"Error type: {type(e)}")
#         import traceback
#         print(f"Traceback: {traceback.format_exc()}")
        
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Failed to create employee: {str(e)}"
#         )

# @router.post("/employees", response_model=EmployeeResponse)
# def create_employee(
#     employee_data: EmployeeCreate,
#     current_user: UserInfo = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """
#     Create a new employee
    
#     WHY THIS ENDPOINT:
#     - HR needs to add new company employees
#     - Employees are separate from system users
#     - Only contact_name is required
#     """
#     require_permission(db, current_user.id, Modules.HR, Features.EMPLOYEES, 'write')
    
#     # Create employee with auto-generated employee_id
#     employee = EmployeeInfo(
#         **employee_data.dict(),
#         company_domain=current_user.company_domain
#     )
    
#     try:
#         db.add(employee)
#         db.commit()
#         db.refresh(employee)
#         return employee
#     except Exception as e:
#         db.rollback()
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Failed to create employee"
#         )

# @router.get("/employees", response_model=List[EmployeeResponse])
# def get_all_employees(
#     current_user: UserInfo = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Get all employees for user's company"""
#     require_permission(db, current_user.id, Modules.HR, Features.EMPLOYEES, 'read')
    
#     employees = db.query(EmployeeInfo).filter(
#         EmployeeInfo.company_domain == current_user.company_domain
#     ).all()
    
#     return employees

# @router.get("/employees/{employee_id}", response_model=EmployeeResponse)
# def get_employee_by_id(
#     employee_id: int,
#     current_user: UserInfo = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Get specific employee"""
#     require_permission(db, current_user.id, Modules.HR, Features.EMPLOYEES, 'read')
    
#     employee = db.query(EmployeeInfo).filter(
#         and_(
#             EmployeeInfo.employee_id == employee_id,
#             EmployeeInfo.company_domain == current_user.company_domain
#         )
#     ).first()
    
#     if not employee:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Employee not found"
#         )
    
#     return employee

# Updated get_all_employees function in hr.py with debugging

@router.get("/employees", response_model=List[EmployeeResponse])
def get_all_employees(
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all employees for user's company - WITH DEBUGGING"""
    require_permission(db, current_user.id, Modules.HR, Features.EMPLOYEES, 'read')
    
    try:
        print(f"Getting employees for user: {current_user.username}")
        print(f"User company domain: {current_user.company_domain}")
        
        # Method 1: Try with SQLAlchemy ORM
        try:
            employees = db.query(EmployeeInfo).filter(
                EmployeeInfo.company_domain == current_user.company_domain
            ).all()
            
            print(f"SQLAlchemy query found {len(employees)} employees")
            for emp in employees:
                print(f"  - ID: {emp.employee_id}, Name: {emp.contact_name}")
            
            if employees:
                return employees
                
        except Exception as orm_error:
            print(f"SQLAlchemy ORM failed: {orm_error}")
        
        # Method 2: Use raw SQL as fallback
        from sqlalchemy import text
        
        result = db.execute(text("""
            SELECT company_domain, employee_id, contact_name, business_phone, 
                   personal_phone, business_email, personal_email, gender, 
                   is_company_admin, user_uid, date_added
            FROM employees_info 
            WHERE company_domain = :company_domain
            ORDER BY employee_id
        """), {'company_domain': current_user.company_domain})
        
        employees_data = result.fetchall()
        print(f"Raw SQL found {len(employees_data)} employees")
        
        # Convert to response format
        employees_list = []
        for row in employees_data:
            employee = EmployeeResponse(
                employee_id=row.employee_id,
                company_domain=row.company_domain,
                contact_name=row.contact_name,
                business_phone=row.business_phone,
                personal_phone=row.personal_phone,
                business_email=row.business_email,
                personal_email=row.personal_email,
                gender=row.gender,
                is_company_admin=bool(row.is_company_admin) if row.is_company_admin is not None else False,
                date_added=row.date_added
            )
            employees_list.append(employee)
            print(f"  - Converted: ID {employee.employee_id}, Name: {employee.contact_name}")
        
        return employees_list
        
    except Exception as e:
        print(f"Error in get_all_employees: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve employees: {str(e)}"
        )

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