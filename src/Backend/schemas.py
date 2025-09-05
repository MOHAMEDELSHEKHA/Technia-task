"""
Pydantic Schemas - Request and Response Models

WHY THIS FILE EXISTS:
- Validates incoming API requests (ensures required fields are present)
- Formats outgoing API responses (controls what data is sent back)
- Provides automatic API documentation in FastAPI
- Type safety and IDE autocompletion
- Separates internal database models from external API contracts

DESIGN PRINCIPLE:
- *Create schemas define what's required to create new records
- *Response schemas define what gets returned to the client
- *Update schemas define what fields can be modified
"""

from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal

# USER SCHEMAS

class UserLogin(BaseModel):
    """
    What's needed to log in
    WHY: Simple username/password authentication
    """
    username: str
    password: str

class UserResponse(BaseModel):
    """
    What user info gets returned after login
    WHY: Don't send password back to client
    """
    id: int
    username: str
    first_name: str
    last_name: str
    email: str
    company_domain: str
    
    class Config:
        from_attributes = True  # Allows conversion from SQLAlchemy models

class PermissionResponse(BaseModel):
    """
    User's permissions for frontend to show/hide features
    WHY: Frontend needs to know what user can do
    """
    module_id: int
    feature_id: int
    d_read: bool
    d_write: bool
    d_edit: bool
    d_delete: bool

# LEAD SCHEMAS

class LeadCreate(BaseModel):
    """
    Required fields to create a new lead
    WHY: Ensures we have minimum necessary data
    """
    name: Optional[str] = None
    lead_phone: str  # Required - must be unique
    email: Optional[str] = None
    gender: Optional[str] = None
    job_title: Optional[str] = None
    assigned_to: Optional[int] = None
    lead_stage: Optional[int] = None
    lead_type: Optional[int] = None
    lead_status: Optional[int] = None

class LeadUpdate(BaseModel):
    """
    Fields that can be updated on existing lead
    WHY: All optional - only update fields that are provided
    """
    name: Optional[str] = None
    email: Optional[str] = None
    gender: Optional[str] = None
    job_title: Optional[str] = None
    assigned_to: Optional[int] = None
    lead_stage: Optional[int] = None
    lead_type: Optional[int] = None
    lead_status: Optional[int] = None

class LeadResponse(BaseModel):
    """
    What lead data gets returned to client
    WHY: Includes all fields plus auto-generated ones
    """
    lead_id: int
    name: Optional[str]
    lead_phone: str
    email: Optional[str]
    gender: Optional[str]
    job_title: Optional[str]
    assigned_to: Optional[int]
    lead_stage: Optional[int]
    lead_type: Optional[int] 
    lead_status: Optional[int]
    company_domain: str
    date_added: datetime
    
    class Config:
        from_attributes = True

# ACTION SCHEMAS (Calls and Meetings)

class CallCreate(BaseModel):
    """Create a call record"""
    call_date: datetime
    call_status: int

class CallResponse(BaseModel):
    """Call data returned to client"""
    call_id: int
    call_date: datetime
    call_status: int
    assigned_to: int
    lead_id: int
    company_domain: str
    date_added: datetime
    
    class Config:
        from_attributes = True

class MeetingCreate(BaseModel):
    """Create a meeting record"""
    meeting_date: datetime
    meeting_status: int

class MeetingResponse(BaseModel):
    """Meeting data returned to client"""
    meeting_id: int
    meeting_date: datetime
    meeting_status: int
    assigned_to: int
    lead_id: int
    company_domain: str
    date_added: datetime
    
    class Config:
        from_attributes = True

# EMPLOYEE SCHEMAS

class EmployeeCreate(BaseModel):
    """
    Required to create new employee
    WHY: Only contact_name is truly required
    """
    contact_name: str
    business_phone: Optional[str] = None
    personal_phone: Optional[str] = None
    business_email: Optional[str] = None
    personal_email: Optional[str] = None
    gender: Optional[str] = None
    is_company_admin: Optional[bool] = False

class EmployeeUpdate(BaseModel):
    """Fields that can be updated"""
    contact_name: Optional[str] = None
    business_phone: Optional[str] = None
    personal_phone: Optional[str] = None
    business_email: Optional[str] = None
    personal_email: Optional[str] = None
    gender: Optional[str] = None
    is_company_admin: Optional[bool] = None

class EmployeeResponse(BaseModel):
    """Employee data returned to client"""
    employee_id: int
    contact_name: str
    business_phone: Optional[str]
    personal_phone: Optional[str]
    business_email: Optional[str]
    personal_email: Optional[str]
    gender: Optional[str]
    is_company_admin: Optional[bool]
    company_domain: str
    date_added: datetime
    
    class Config:
        from_attributes = True

# SALARY SCHEMAS

class SalaryCreate(BaseModel):
    """
    Create salary record
    WHY: Year and month are required to prevent duplicates
    """
    due_year: int
    due_month: int  # 1-12
    gross_salary: Optional[Decimal] = None
    insurance: Optional[Decimal] = None
    taxes: Optional[Decimal] = None
    net_salary: Optional[Decimal] = None
    due_date: Optional[date] = None

class SalaryUpdate(BaseModel):
    """Update existing salary record"""
    gross_salary: Optional[Decimal] = None
    insurance: Optional[Decimal] = None
    taxes: Optional[Decimal] = None
    net_salary: Optional[Decimal] = None
    due_date: Optional[date] = None

class SalaryResponse(BaseModel):
    """Salary data returned to client"""
    employee_id: int
    due_year: int
    due_month: int
    gross_salary: Optional[Decimal]
    insurance: Optional[Decimal]
    taxes: Optional[Decimal]
    net_salary: Optional[Decimal]
    due_date: Optional[date]
    company_domain: str
    date_added: datetime
    
    class Config:
        from_attributes = True

# LOOKUP DATA SCHEMAS
# WHY: For dropdowns in the frontend

class LookupResponse(BaseModel):
    """Generic lookup data (stages, statuses, types)"""
    id: int
    name: str  # Generic name field
    company_domain: str
    
    class Config:
        from_attributes = True

# STANDARD API RESPONSES

class SuccessResponse(BaseModel):
    """Standard success response"""
    success: bool = True
    message: str

class ErrorResponse(BaseModel):
    """Standard error response"""
    success: bool = False
    error: str
    detail: Optional[str] = None