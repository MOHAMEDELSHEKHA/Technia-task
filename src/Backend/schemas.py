
from pydantic import BaseModel, EmailStr, validator, Field
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal

# USER SCHEMAS

class UserLogin(BaseModel):
    """Login credentials"""
    username: str = Field(..., max_length=50, description="Username (max 50 chars)")
    password: str = Field(..., max_length=200, description="Password")

class UserResponse(BaseModel):
    id: int
    username: str
    first_name: str
    last_name: str
    email: str
    company_domain: str
    
    class Config:
        from_attributes = True

class PermissionResponse(BaseModel):
    module_id: int
    feature_id: int
    d_read: bool
    d_write: bool
    d_edit: bool
    d_delete: bool

# LEAD SCHEMAS 

class LeadCreate(BaseModel):
    lead_phone: str = Field(..., max_length=50, description="Phone number (unique, max 50 chars)")
    
    name: Optional[str] = Field(None, max_length=50, description="Lead name (max 50 chars)")
    email: Optional[str] = Field(None, max_length=50, description="Email (max 50 chars)")
    gender: Optional[str] = Field(None, max_length=10, description="Gender")
    job_title: Optional[str] = Field(None, max_length=100, description="Job title (max 100 chars)")
    assigned_to: Optional[int] = Field(None, description="User ID to assign lead to")
    lead_stage: Optional[int] = Field(None, description="Lead stage ID")
    lead_type: Optional[int] = Field(None, description="Lead type ID")
    lead_status: Optional[int] = Field(None, description="Lead status ID")
    
    @validator('gender')
    def validate_gender(cls, v):
        if v and v not in ['Male', 'Female']:
            raise ValueError('Gender must be either "Male" or "Female"')
        return v
    
    @validator('lead_phone')
    def validate_phone(cls, v):
        if not v or not v.strip():
            raise ValueError('Phone number is required')
        return v.strip()

class LeadUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=50)
    email: Optional[str] = Field(None, max_length=50)
    gender: Optional[str] = Field(None, max_length=10)
    job_title: Optional[str] = Field(None, max_length=100)
    assigned_to: Optional[int] = None
    lead_stage: Optional[int] = None
    lead_type: Optional[int] = None
    lead_status: Optional[int] = None
    
    @validator('gender')
    def validate_gender(cls, v):
        if v and v not in ['Male', 'Female']:
            raise ValueError('Gender must be either "Male" or "Female"')
        return v

class LeadResponse(BaseModel):
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

# ACTION SCHEMAS

class CallCreate(BaseModel):
    call_date: datetime = Field(..., description="Call date and time")
    call_status: int = Field(..., description="Call status ID")

class CallResponse(BaseModel):
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
    meeting_date: datetime = Field(..., description="Meeting date and time")
    meeting_status: int = Field(..., description="Meeting status ID")

class MeetingResponse(BaseModel):
    meeting_id: int
    meeting_date: datetime
    meeting_status: int
    assigned_to: int
    lead_id: int
    company_domain: str
    date_added: datetime
    
    class Config:
        from_attributes = True

# EMPLOYEE SCHEMAS -

class EmployeeCreate(BaseModel):
    
    contact_name: str = Field(..., min_length=1, max_length=50, description="Employee name (required, max 50 chars)")
    
    business_phone: Optional[str] = Field(None, max_length=50, description="Business phone (max 50 chars)")
    personal_phone: Optional[str] = Field(None, max_length=50, description="Personal phone (max 50 chars)")
    business_email: Optional[str] = Field(None, max_length=50, description="Business email (max 50 chars)")
    personal_email: Optional[str] = Field(None, max_length=50, description="Personal email (max 50 chars)")
    
   
    gender: Optional[str] = Field(None, max_length=10, description="Gender (Male/Female)")
    
    
    is_company_admin: Optional[bool] = Field(False, description="Company administrator flag")
    
    @validator('contact_name')
    def validate_contact_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Contact name is required and cannot be empty')
        return v.strip()
    
    @validator('gender')
    def validate_gender(cls, v):
        if v and v not in ['Male', 'Female']:
            raise ValueError('Gender must be either "Male" or "Female"')
        return v
    
    @validator('business_email', 'personal_email')
    def validate_emails(cls, v):
        if v and v.strip():
            if '@' not in v or '.' not in v:
                raise ValueError('Invalid email format')
            return v.strip()
        return v

class EmployeeUpdate(BaseModel):
    contact_name: Optional[str] = Field(None, min_length=1, max_length=50)
    business_phone: Optional[str] = Field(None, max_length=50)
    personal_phone: Optional[str] = Field(None, max_length=50)
    business_email: Optional[str] = Field(None, max_length=50)
    personal_email: Optional[str] = Field(None, max_length=50)
    gender: Optional[str] = Field(None, max_length=10)
    is_company_admin: Optional[bool] = None
    
    @validator('contact_name')
    def validate_contact_name(cls, v):
        if v is not None and (not v or not v.strip()):
            raise ValueError('Contact name cannot be empty')
        return v.strip() if v else v
    
    @validator('gender')
    def validate_gender(cls, v):
        if v and v not in ['Male', 'Female']:
            raise ValueError('Gender must be either "Male" or "Female"')
        return v

class EmployeeResponse(BaseModel):
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

    due_year: int = Field(..., ge=2020, le=2030, description="Salary year (2020-2030)")
    due_month: int = Field(..., ge=1, le=12, description="Salary month (1-12)")
    gross_salary: Optional[Decimal] = Field(None, ge=0, description="Gross salary amount")
    insurance: Optional[Decimal] = Field(None, ge=0, description="Insurance deduction")
    taxes: Optional[Decimal] = Field(None, ge=0, description="Tax deduction")
    net_salary: Optional[Decimal] = Field(None, ge=0, description="Net salary amount")
    due_date: Optional[date] = Field(None, description="Payment due date")

class SalaryUpdate(BaseModel):
    gross_salary: Optional[Decimal] = Field(None, ge=0)
    insurance: Optional[Decimal] = Field(None, ge=0)
    taxes: Optional[Decimal] = Field(None, ge=0)
    net_salary: Optional[Decimal] = Field(None, ge=0)
    due_date: Optional[date] = None

class SalaryResponse(BaseModel):
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

class LookupResponse(BaseModel):
    id: int
    name: str
    company_domain: str
    
    class Config:
        from_attributes = True

# STANDARD API RESPONSES

class SuccessResponse(BaseModel):
    success: bool = True
    message: str

class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    detail: Optional[str] = None