"""
HR Module API Endpoints - Fixed Database Integration

FIXES IMPLEMENTED:
1. Proper handling of composite primary key (company_domain, employee_id)
2. Correct IDENTITY column handling for employee_id
3. Better error handling for database constraints
4. Proper validation according to database schema
5. Optional user_uid linking for employees who are also system users
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, text
from typing import List
from typing import Dict
from datetime import datetime

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

# EMPLOYEE CRUD OPERATIONS - FIXED FOR DATABASE SCHEMA

@router.post("/employees", response_model=EmployeeResponse)
def create_employee(
    employee_data: EmployeeCreate,
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new employee with proper database integration
    
    FIXES:
    - Uses raw SQL to handle IDENTITY column properly
    - Validates required fields according to database schema
    - Handles composite primary key correctly
    - Proper error handling for constraint violations
    """
    require_permission(db, current_user.id, Modules.HR, Features.EMPLOYEES, 'write')
    
    # Validate required fields according to database schema
    if not employee_data.contact_name or not employee_data.contact_name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contact name is required and cannot be empty"
        )
    
    try:
        # Use raw SQL to properly handle the IDENTITY column and composite primary key
        result = db.execute(text("""
            INSERT INTO employees_info 
            (company_domain, contact_name, business_phone, personal_phone, 
             business_email, personal_email, gender, is_company_admin, user_uid)
            OUTPUT INSERTED.employee_id, INSERTED.date_added
            VALUES (:company_domain, :contact_name, :business_phone, :personal_phone,
                    :business_email, :personal_email, :gender, :is_company_admin, :user_uid)
        """), {
            'company_domain': current_user.company_domain,
            'contact_name': employee_data.contact_name.strip(),
            'business_phone': employee_data.business_phone.strip() if employee_data.business_phone else None,
            'personal_phone': employee_data.personal_phone.strip() if employee_data.personal_phone else None,
            'business_email': employee_data.business_email.strip() if employee_data.business_email else None,
            'personal_email': employee_data.personal_email.strip() if employee_data.personal_email else None,
            'gender': employee_data.gender if employee_data.gender else None,
            'is_company_admin': 1 if employee_data.is_company_admin else 0,
            'user_uid': None  # Could be linked to system user later
        })
        
        # Get the generated values
        row = result.fetchone()
        if not row:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create employee - no data returned"
            )
            
        employee_id = row[0]
        date_added = row[1]
        
        db.commit()
        
        # Return response in expected format
        return EmployeeResponse(
            employee_id=employee_id,
            company_domain=current_user.company_domain,
            contact_name=employee_data.contact_name.strip(),
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
        error_msg = str(e).lower()
        
        # Handle specific database constraint violations
        if "unique" in error_msg or "duplicate" in error_msg:
            if "business_email" in error_msg or "email" in error_msg:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="An employee with this business email already exists"
                )
            elif "phone" in error_msg:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="An employee with this phone number already exists"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="An employee with this information already exists"
                )
        elif "check constraint" in error_msg or "gender" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Gender must be either 'Male' or 'Female'"
            )
        elif "foreign key" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid company domain or reference"
            )
        else:
            print(f"Database error creating employee: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create employee due to database error"
            )

@router.get("/employees", response_model=List[EmployeeResponse])
def get_all_employees(
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all employees for user's company - Fixed with proper error handling
    """
    require_permission(db, current_user.id, Modules.HR, Features.EMPLOYEES, 'read')
    
    try:
        # Use raw SQL to ensure proper data retrieval
        result = db.execute(text("""
            SELECT company_domain, employee_id, contact_name, business_phone, 
                   personal_phone, business_email, personal_email, gender, 
                   is_company_admin, user_uid, date_added
            FROM employees_info 
            WHERE company_domain = :company_domain
            ORDER BY employee_id
        """), {'company_domain': current_user.company_domain})
        
        employees_data = result.fetchall()
        
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
        
        return employees_list
        
    except Exception as e:
        print(f"Error retrieving employees: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve employees"
        )

@router.get("/employees/{employee_id}", response_model=EmployeeResponse)
def get_employee_by_id(
    employee_id: int,
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific employee with proper composite key handling"""
    require_permission(db, current_user.id, Modules.HR, Features.EMPLOYEES, 'read')
    
    try:
        # Use raw SQL with composite primary key
        result = db.execute(text("""
            SELECT company_domain, employee_id, contact_name, business_phone, 
                   personal_phone, business_email, personal_email, gender, 
                   is_company_admin, user_uid, date_added
            FROM employees_info 
            WHERE company_domain = :company_domain AND employee_id = :employee_id
        """), {
            'company_domain': current_user.company_domain,
            'employee_id': employee_id
        })
        
        row = result.fetchone()
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        return EmployeeResponse(
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
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error retrieving employee {employee_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve employee"
        )

@router.put("/employees/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: int,
    employee_update: EmployeeUpdate,
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update employee with proper database constraints handling"""
    require_permission(db, current_user.id, Modules.HR, Features.EMPLOYEES, 'edit')
    
    # First verify employee exists
    try:
        check_result = db.execute(text("""
            SELECT employee_id FROM employees_info 
            WHERE company_domain = :company_domain AND employee_id = :employee_id
        """), {
            'company_domain': current_user.company_domain,
            'employee_id': employee_id
        })
        
        if not check_result.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        # Build update query dynamically for only provided fields
        update_data = employee_update.dict(exclude_unset=True)
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields provided for update"
            )
        
        # Validate contact_name if provided
        if 'contact_name' in update_data and (not update_data['contact_name'] or not update_data['contact_name'].strip()):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Contact name cannot be empty"
            )
        
        # Build SET clause
        set_clauses = []
        params = {
            'company_domain': current_user.company_domain,
            'employee_id': employee_id
        }
        
        for field, value in update_data.items():
            if field == 'is_company_admin':
                set_clauses.append(f"{field} = :{field}")
                params[field] = 1 if value else 0
            elif isinstance(value, str):
                set_clauses.append(f"{field} = :{field}")
                params[field] = value.strip() if value else None
            else:
                set_clauses.append(f"{field} = :{field}")
                params[field] = value
        
        update_query = f"""
            UPDATE employees_info 
            SET {', '.join(set_clauses)}
            WHERE company_domain = :company_domain AND employee_id = :employee_id
        """
        
        db.execute(text(update_query), params)
        db.commit()
        
        # Return updated employee
        return get_employee_by_id(employee_id, current_user, db)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        error_msg = str(e).lower()
        
        # Handle constraint violations
        if "unique" in error_msg or "duplicate" in error_msg:
            if "email" in error_msg:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="An employee with this email already exists"
                )
            elif "phone" in error_msg:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="An employee with this phone number already exists"
                )
        elif "check constraint" in error_msg or "gender" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Gender must be either 'Male' or 'Female'"
            )
        
        print(f"Error updating employee {employee_id}: {e}")
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
    """Delete employee with proper cascade handling"""
    require_permission(db, current_user.id, Modules.HR, Features.EMPLOYEES, 'delete')
    
    try:
        # Check if employee exists
        check_result = db.execute(text("""
            SELECT contact_name FROM employees_info 
            WHERE company_domain = :company_domain AND employee_id = :employee_id
        """), {
            'company_domain': current_user.company_domain,
            'employee_id': employee_id
        })
        
        employee_row = check_result.fetchone()
        if not employee_row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        employee_name = employee_row.contact_name
        
        # Delete salary records first (foreign key constraint)
        db.execute(text("""
            DELETE FROM employees_salaries 
            WHERE company_domain = :company_domain AND employee_id = :employee_id
        """), {
            'company_domain': current_user.company_domain,
            'employee_id': employee_id
        })
        
        # Delete employee
        db.execute(text("""
            DELETE FROM employees_info 
            WHERE company_domain = :company_domain AND employee_id = :employee_id
        """), {
            'company_domain': current_user.company_domain,
            'employee_id': employee_id
        })
        
        db.commit()
        
        return SuccessResponse(
            message=f"Employee '{employee_name}' and all related salary records deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error deleting employee {employee_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete employee"
        )

# SALARY MANAGEMENT - Already properly integrated

@router.post("/employees/{employee_id}/salaries", response_model=SalaryResponse)
def add_salary_to_employee(
    employee_id: int,
    salary_data: SalaryCreate,
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add salary record with proper composite key validation"""
    require_permission(db, current_user.id, Modules.HR, Features.SALARIES, 'write')
    
    # Verify employee exists with composite key
    try:
        employee_check = db.execute(text("""
            SELECT contact_name FROM employees_info 
            WHERE company_domain = :company_domain AND employee_id = :employee_id
        """), {
            'company_domain': current_user.company_domain,
            'employee_id': employee_id
        })
        
        if not employee_check.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        # Check for duplicate salary record (composite primary key)
        existing_check = db.execute(text("""
            SELECT 1 FROM employees_salaries 
            WHERE company_domain = :company_domain 
            AND employee_id = :employee_id 
            AND due_year = :due_year 
            AND due_month = :due_month
        """), {
            'company_domain': current_user.company_domain,
            'employee_id': employee_id,
            'due_year': salary_data.due_year,
            'due_month': salary_data.due_month
        })
        
        if existing_check.fetchone():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Salary record already exists for {salary_data.due_month}/{salary_data.due_year}"
            )
        
        # Insert salary record
        db.execute(text("""
            INSERT INTO employees_salaries 
            (company_domain, employee_id, gross_salary, insurance, taxes, net_salary, 
             due_year, due_month, due_date)
            VALUES (:company_domain, :employee_id, :gross_salary, :insurance, :taxes, 
                    :net_salary, :due_year, :due_month, :due_date)
        """), {
            'company_domain': current_user.company_domain,
            'employee_id': employee_id,
            'gross_salary': salary_data.gross_salary,
            'insurance': salary_data.insurance,
            'taxes': salary_data.taxes,
            'net_salary': salary_data.net_salary,
            'due_year': salary_data.due_year,
            'due_month': salary_data.due_month,
            'due_date': salary_data.due_date
        })
        
        db.commit()
        
        # Return the created salary record
        result = db.execute(text("""
            SELECT company_domain, employee_id, gross_salary, insurance, taxes, 
                   net_salary, due_year, due_month, due_date, date_added
            FROM employees_salaries 
            WHERE company_domain = :company_domain 
            AND employee_id = :employee_id 
            AND due_year = :due_year 
            AND due_month = :due_month
        """), {
            'company_domain': current_user.company_domain,
            'employee_id': employee_id,
            'due_year': salary_data.due_year,
            'due_month': salary_data.due_month
        })
        
        row = result.fetchone()
        return SalaryResponse(
            employee_id=row.employee_id,
            company_domain=row.company_domain,
            gross_salary=row.gross_salary,
            insurance=row.insurance,
            taxes=row.taxes,
            net_salary=row.net_salary,
            due_year=row.due_year,
            due_month=row.due_month,
            due_date=row.due_date,
            date_added=row.date_added
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error creating salary record: {e}")
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
    
    try:
        # Verify employee exists
        employee_check = db.execute(text("""
            SELECT contact_name FROM employees_info 
            WHERE company_domain = :company_domain AND employee_id = :employee_id
        """), {
            'company_domain': current_user.company_domain,
            'employee_id': employee_id
        })
        
        if not employee_check.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        # Get salary records
        result = db.execute(text("""
            SELECT company_domain, employee_id, gross_salary, insurance, taxes, 
                   net_salary, due_year, due_month, due_date, date_added
            FROM employees_salaries 
            WHERE company_domain = :company_domain AND employee_id = :employee_id
            ORDER BY due_year DESC, due_month DESC
        """), {
            'company_domain': current_user.company_domain,
            'employee_id': employee_id
        })
        
        salaries = []
        for row in result.fetchall():
            salaries.append(SalaryResponse(
                employee_id=row.employee_id,
                company_domain=row.company_domain,
                gross_salary=row.gross_salary,
                insurance=row.insurance,
                taxes=row.taxes,
                net_salary=row.net_salary,
                due_year=row.due_year,
                due_month=row.due_month,
                due_date=row.due_date,
                date_added=row.date_added
            ))
        
        return salaries
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error retrieving salaries for employee {employee_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve salary records"
        )

@router.get("/salaries", response_model=List[SalaryResponse])
def get_all_salaries(
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all salary records for the company"""
    require_permission(db, current_user.id, Modules.HR, Features.SALARIES, 'read')
    
    try:
        result = db.execute(text("""
            SELECT company_domain, employee_id, gross_salary, insurance, taxes, 
                   net_salary, due_year, due_month, due_date, date_added
            FROM employees_salaries 
            WHERE company_domain = :company_domain
            ORDER BY due_year DESC, due_month DESC, employee_id
        """), {'company_domain': current_user.company_domain})
        
        salaries = []
        for row in result.fetchall():
            salaries.append(SalaryResponse(
                employee_id=row.employee_id,
                company_domain=row.company_domain,
                gross_salary=row.gross_salary,
                insurance=row.insurance,
                taxes=row.taxes,
                net_salary=row.net_salary,
                due_year=row.due_year,
                due_month=row.due_month,
                due_date=row.due_date,
                date_added=row.date_added
            ))
        
        return salaries
        
    except Exception as e:
        print(f"Error retrieving all salaries: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve salary records"
        )

# Additional endpoints for salary update and delete would follow the same pattern...

# Complete Salary Management with Full Database Integration
# Add this to your hr.py file to complete the salary operations

@router.put("/employees/{employee_id}/salaries/{year}/{month}", response_model=SalaryResponse)
def update_salary_record(
    employee_id: int,
    year: int,
    month: int,
    salary_update: SalaryUpdate,
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update existing salary record - Full Database Integration
    
    FIXES:
    - Proper composite primary key validation
    - Complete field validation
    - Robust error handling
    - Database constraint compliance
    """
    require_permission(db, current_user.id, Modules.HR, Features.SALARIES, 'edit')
    
    # Validate input parameters
    if not (2020 <= year <= 2030):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Year must be between 2020 and 2030"
        )
    
    if not (1 <= month <= 12):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Month must be between 1 and 12"
        )
    
    try:
        # First verify employee exists
        employee_check = db.execute(text("""
            SELECT contact_name FROM employees_info 
            WHERE company_domain = :company_domain AND employee_id = :employee_id
        """), {
            'company_domain': current_user.company_domain,
            'employee_id': employee_id
        })
        
        employee_row = employee_check.fetchone()
        if not employee_row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        # Check if salary record exists (using composite primary key)
        salary_check = db.execute(text("""
            SELECT gross_salary FROM employees_salaries 
            WHERE company_domain = :company_domain 
            AND employee_id = :employee_id 
            AND due_year = :due_year 
            AND due_month = :due_month
        """), {
            'company_domain': current_user.company_domain,
            'employee_id': employee_id,
            'due_year': year,
            'due_month': month
        })
        
        if not salary_check.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Salary record not found for {month}/{year}"
            )
        
        # Build dynamic update query for only provided fields
        update_data = salary_update.dict(exclude_unset=True)
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields provided for update"
            )
        
        # Build SET clause
        set_clauses = []
        params = {
            'company_domain': current_user.company_domain,
            'employee_id': employee_id,
            'due_year': year,
            'due_month': month
        }
        
        for field, value in update_data.items():
            if value is not None:
                set_clauses.append(f"{field} = :{field}")
                params[field] = value
        
        if not set_clauses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid fields provided for update"
            )
        
        # Execute update with composite primary key
        update_query = f"""
            UPDATE employees_salaries 
            SET {', '.join(set_clauses)}
            WHERE company_domain = :company_domain 
            AND employee_id = :employee_id 
            AND due_year = :due_year 
            AND due_month = :due_month
        """
        
        result = db.execute(text(update_query), params)
        
        if result.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Salary record not found or no changes made"
            )
        
        db.commit()
        
        # Return updated salary record
        updated_result = db.execute(text("""
            SELECT company_domain, employee_id, gross_salary, insurance, taxes, 
                   net_salary, due_year, due_month, due_date, date_added
            FROM employees_salaries 
            WHERE company_domain = :company_domain 
            AND employee_id = :employee_id 
            AND due_year = :due_year 
            AND due_month = :due_month
        """), {
            'company_domain': current_user.company_domain,
            'employee_id': employee_id,
            'due_year': year,
            'due_month': month
        })
        
        row = updated_result.fetchone()
        return SalaryResponse(
            employee_id=row.employee_id,
            company_domain=row.company_domain,
            gross_salary=row.gross_salary,
            insurance=row.insurance,
            taxes=row.taxes,
            net_salary=row.net_salary,
            due_year=row.due_year,
            due_month=row.due_month,
            due_date=row.due_date,
            date_added=row.date_added
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error updating salary record: {e}")
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
    """
    Delete salary record - Full Database Integration
    
    FEATURES:
    - Proper composite primary key deletion
    - Complete validation
    - Informative success messages
    """
    require_permission(db, current_user.id, Modules.HR, Features.SALARIES, 'delete')
    
    # Validate parameters
    if not (2020 <= year <= 2030):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Year must be between 2020 and 2030"
        )
    
    if not (1 <= month <= 12):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Month must be between 1 and 12"
        )
    
    try:
        # Get employee and salary info for response message
        info_result = db.execute(text("""
            SELECT e.contact_name, s.gross_salary, s.net_salary
            FROM employees_info e
            LEFT JOIN employees_salaries s ON e.company_domain = s.company_domain 
                AND e.employee_id = s.employee_id 
                AND s.due_year = :due_year 
                AND s.due_month = :due_month
            WHERE e.company_domain = :company_domain AND e.employee_id = :employee_id
        """), {
            'company_domain': current_user.company_domain,
            'employee_id': employee_id,
            'due_year': year,
            'due_month': month
        })
        
        info_row = info_result.fetchone()
        if not info_row or not info_row.contact_name:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        if not info_row.gross_salary and not info_row.net_salary:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Salary record not found for {month}/{year}"
            )
        
        employee_name = info_row.contact_name
        
        # Delete salary record using composite primary key
        delete_result = db.execute(text("""
            DELETE FROM employees_salaries 
            WHERE company_domain = :company_domain 
            AND employee_id = :employee_id 
            AND due_year = :due_year 
            AND due_month = :due_month
        """), {
            'company_domain': current_user.company_domain,
            'employee_id': employee_id,
            'due_year': year,
            'due_month': month
        })
        
        if delete_result.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Salary record not found"
            )
        
        db.commit()
        
        # Format month name for user-friendly message
        month_names = [
            '', 'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ]
        month_name = month_names[month] if 1 <= month <= 12 else str(month)
        
        return SuccessResponse(
            message=f"Salary record for {employee_name} ({month_name} {year}) deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error deleting salary record: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete salary record"
        )

@router.get("/salaries/summary", response_model=Dict)
def get_salary_summary(
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get salary summary statistics - Database Integration Example
    
    FEATURES:
    - Company-scoped aggregations
    - Proper composite key handling
    - Performance optimized queries
    """
    require_permission(db, current_user.id, Modules.HR, Features.SALARIES, 'read')
    
    try:
        # Get comprehensive salary statistics
        summary_result = db.execute(text("""
            SELECT 
                COUNT(*) as total_records,
                COUNT(DISTINCT employee_id) as employees_with_salaries,
                COUNT(DISTINCT CONCAT(due_year, '-', due_month)) as unique_periods,
                AVG(CAST(gross_salary as FLOAT)) as avg_gross_salary,
                AVG(CAST(net_salary as FLOAT)) as avg_net_salary,
                SUM(CAST(gross_salary as FLOAT)) as total_gross_payroll,
                SUM(CAST(net_salary as FLOAT)) as total_net_payroll,
                MIN(due_year) as earliest_year,
                MAX(due_year) as latest_year
            FROM employees_salaries 
            WHERE company_domain = :company_domain
        """), {'company_domain': current_user.company_domain})
        
        summary_row = summary_result.fetchone()
        
        # Get total employees for comparison
        employee_count_result = db.execute(text("""
            SELECT COUNT(*) as total_employees
            FROM employees_info 
            WHERE company_domain = :company_domain
        """), {'company_domain': current_user.company_domain})
        
        employee_count_row = employee_count_result.fetchone()
        
        # Get recent salary records
        recent_result = db.execute(text("""
            SELECT TOP 5 
                e.contact_name,
                s.due_year,
                s.due_month,
                s.net_salary,
                s.date_added
            FROM employees_salaries s
            JOIN employees_info e ON s.company_domain = e.company_domain 
                AND s.employee_id = e.employee_id
            WHERE s.company_domain = :company_domain
            ORDER BY s.date_added DESC
        """), {'company_domain': current_user.company_domain})
        
        recent_salaries = []
        for row in recent_result.fetchall():
            recent_salaries.append({
                'employee_name': row.contact_name,
                'period': f"{row.due_month}/{row.due_year}",
                'net_salary': float(row.net_salary) if row.net_salary else 0,
                'date_added': row.date_added.isoformat() if row.date_added else None
            })
        
        return {
            'summary': {
                'total_salary_records': summary_row.total_records or 0,
                'total_employees': employee_count_row.total_employees or 0,
                'employees_with_salaries': summary_row.employees_with_salaries or 0,
                'unique_pay_periods': summary_row.unique_periods or 0,
                'salary_coverage_percentage': round(
                    (summary_row.employees_with_salaries or 0) / max(employee_count_row.total_employees or 1, 1) * 100, 1
                )
            },
            'financial_summary': {
                'average_gross_salary': round(summary_row.avg_gross_salary or 0, 2),
                'average_net_salary': round(summary_row.avg_net_salary or 0, 2),
                'total_gross_payroll': round(summary_row.total_gross_payroll or 0, 2),
                'total_net_payroll': round(summary_row.total_net_payroll or 0, 2)
            },
            'period_range': {
                'earliest_year': summary_row.earliest_year,
                'latest_year': summary_row.latest_year
            },
            'recent_salary_records': recent_salaries
        }
        
    except Exception as e:
        print(f"Error generating salary summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate salary summary"
        )

@router.get("/employees/{employee_id}/salaries/summary", response_model=Dict)
def get_employee_salary_summary(
    employee_id: int,
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get individual employee salary summary
    
    FEATURES:
    - Employee-specific salary history
    - Composite key validation
    - Comprehensive financial overview
    """
    require_permission(db, current_user.id, Modules.HR, Features.SALARIES, 'read')
    
    try:
        # Verify employee exists
        employee_check = db.execute(text("""
            SELECT contact_name FROM employees_info 
            WHERE company_domain = :company_domain AND employee_id = :employee_id
        """), {
            'company_domain': current_user.company_domain,
            'employee_id': employee_id
        })
        
        employee_row = employee_check.fetchone()
        if not employee_row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        employee_name = employee_row.contact_name
        
        # Get employee salary statistics
        stats_result = db.execute(text("""
            SELECT 
                COUNT(*) as total_records,
                AVG(CAST(gross_salary as FLOAT)) as avg_gross,
                AVG(CAST(net_salary as FLOAT)) as avg_net,
                SUM(CAST(gross_salary as FLOAT)) as total_gross,
                SUM(CAST(net_salary as FLOAT)) as total_net,
                MIN(CONCAT(due_year, '-', FORMAT(due_month, '00'))) as earliest_period,
                MAX(CONCAT(due_year, '-', FORMAT(due_month, '00'))) as latest_period
            FROM employees_salaries 
            WHERE company_domain = :company_domain AND employee_id = :employee_id
        """), {
            'company_domain': current_user.company_domain,
            'employee_id': employee_id
        })
        
        stats_row = stats_result.fetchone()
        
        # Get salary history
        history_result = db.execute(text("""
            SELECT 
                due_year,
                due_month,
                gross_salary,
                insurance,
                taxes,
                net_salary,
                due_date,
                date_added
            FROM employees_salaries 
            WHERE company_domain = :company_domain AND employee_id = :employee_id
            ORDER BY due_year DESC, due_month DESC
        """), {
            'company_domain': current_user.company_domain,
            'employee_id': employee_id
        })
        
        salary_history = []
        for row in history_result.fetchall():
            salary_history.append({
                'period': f"{row.due_month}/{row.due_year}",
                'gross_salary': float(row.gross_salary) if row.gross_salary else 0,
                'insurance': float(row.insurance) if row.insurance else 0,
                'taxes': float(row.taxes) if row.taxes else 0,
                'net_salary': float(row.net_salary) if row.net_salary else 0,
                'due_date': row.due_date.isoformat() if row.due_date else None,
                'created_date': row.date_added.isoformat() if row.date_added else None
            })
        
        return {
            'employee_info': {
                'employee_id': employee_id,
                'employee_name': employee_name
            },
            'salary_statistics': {
                'total_salary_records': stats_row.total_records or 0,
                'average_gross_salary': round(stats_row.avg_gross or 0, 2),
                'average_net_salary': round(stats_row.avg_net or 0, 2),
                'total_gross_earnings': round(stats_row.total_gross or 0, 2),
                'total_net_earnings': round(stats_row.total_net or 0, 2),
                'earliest_period': stats_row.earliest_period,
                'latest_period': stats_row.latest_period
            },
            'salary_history': salary_history
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating employee salary summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate employee salary summary"
        )