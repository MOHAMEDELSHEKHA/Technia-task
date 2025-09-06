"""
Database Models - Fixed to Match Exact Database Schema

FIXES IMPLEMENTED:
1. Proper composite primary keys
2. Correct IDENTITY column handling
3. Exact field mappings to database schema
4. Proper foreign key relationships
5. Correct data types and constraints
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, BigInteger, Date, ForeignKey, CheckConstraint, ForeignKeyConstraint
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER, BIT, MONEY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import uuid

class Module(Base):
    """Business modules (Real Estate, HR)"""
    __tablename__ = "modules"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False)
    display_name = Column(String(100))
    description = Column(Text)
    available = Column(BIT)
    comming_on = Column(Date)  # Note: keeping original typo from schema
    color = Column(BigInteger)
    url = Column(Text)

class ModuleFeature(Base):
    """Features within each module"""
    __tablename__ = "module_features"
    
    module_id = Column(Integer, ForeignKey("modules.id"), primary_key=True)
    feature_id = Column(Integer, primary_key=True)
    name = Column(String(50))
    display_name = Column(String(100))

class CompanyInfo(Base):
    """Company information for multi-tenant support"""
    __tablename__ = "company_info"
    
    company_domain = Column(String(100), primary_key=True)
    name = Column(String(50), nullable=False)  # NVARCHAR in DB
    field = Column(String(100))
    address = Column(String(500))  # NVARCHAR in DB
    country = Column(String(100))
    telephone_number = Column(String(50), unique=True, nullable=False)
    date_added = Column(DateTime, default=func.getdate())

class UserInfo(Base):
    """System users who can log in"""
    __tablename__ = "user_info"
    
    id = Column(Integer, primary_key=True)  # IDENTITY(1,1)
    uid = Column(UNIQUEIDENTIFIER, default=uuid.uuid4)
    company_domain = Column(String(100), ForeignKey("company_info.company_domain"))
    first_name = Column(String(50), nullable=False)  # NVARCHAR in DB
    middle_name = Column(String(50))  # NVARCHAR in DB
    last_name = Column(String(50), nullable=False)  # NVARCHAR in DB
    phone = Column(String(50), unique=True)
    email = Column(String(50), unique=True, nullable=False)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(200))
    gender = Column(String(10))
    date_added = Column(DateTime, default=func.getdate())
    
    __table_args__ = (
        CheckConstraint("gender IN ('Male', 'Female')", name="ck_gender"),
    )

class UserRole(Base):
    """Available roles per company and module"""
    __tablename__ = "user_roles"
    
    id = Column(Integer, primary_key=True)  # IDENTITY(1,1)
    company_domain = Column(String(100), ForeignKey("company_info.company_domain"))
    module_id = Column(Integer, ForeignKey("modules.id"))
    name = Column(String(50), nullable=False)

class UserRolePermission(Base):
    """CRUD permissions for each role"""
    __tablename__ = "user_role_permissions"
    
    role_id = Column(Integer, ForeignKey("user_roles.id"), primary_key=True)
    permission_id = Column(Integer, primary_key=True)  # IDENTITY(1,1)
    module_id = Column(Integer, nullable=False)
    feature_id = Column(Integer, nullable=False)
    
    d_read = Column(BIT, default=0)
    d_write = Column(BIT, default=0) 
    d_edit = Column(BIT, default=0)
    d_delete = Column(BIT, default=0)

class UserRoleMapping(Base):
    """User to role assignments"""
    __tablename__ = "user_role_mapping"
    
    user_id = Column(Integer, ForeignKey("user_info.id"), primary_key=True)
    role_id = Column(Integer, ForeignKey("user_roles.id"), primary_key=True)

# REAL ESTATE LOOKUP TABLES

class LeadsStage(Base):
    """Lead stages: Assigned, Not Assigned, Action Taken"""
    __tablename__ = "leads_stage"
    
    company_domain = Column(String(100), ForeignKey("company_info.company_domain"), primary_key=True)
    id = Column(Integer, primary_key=True)
    lead_stage = Column(String(50))
    date_added = Column(DateTime, default=func.getdate())
    is_assigned = Column(BIT)
    is_not_assigned = Column(BIT)
    is_action_taken = Column(BIT)

class LeadsStatus(Base):
    """Lead temperature: Hot, Warm, Cold, New"""
    __tablename__ = "leads_status"
    
    company_domain = Column(String(100), ForeignKey("company_info.company_domain"), primary_key=True)
    id = Column(Integer, primary_key=True)
    lead_status = Column(String(50))
    date_added = Column(DateTime, default=func.getdate())

class LeadsType(Base):
    """Lead source: Campaign, Cold Call, Personal"""
    __tablename__ = "leads_types"
    
    company_domain = Column(String(100), ForeignKey("company_info.company_domain"), primary_key=True)
    id = Column(Integer, primary_key=True)
    lead_type = Column(String(50))
    date_added = Column(DateTime, default=func.getdate())

class CallStatus(Base):
    """Call outcomes: Scheduled, Answered, Rescheduled, Unanswered"""
    __tablename__ = "calls_status"
    
    company_domain = Column(String(100), ForeignKey("company_info.company_domain"), primary_key=True)
    id = Column(Integer, primary_key=True)
    call_status = Column(String(50))
    date_added = Column(DateTime, default=func.getdate())

class MeetingStatus(Base):
    """Meeting states: Scheduled, Done, Cancelled, Rescheduled"""
    __tablename__ = "meetings_status"
    
    company_domain = Column(String(100), ForeignKey("company_info.company_domain"), primary_key=True)
    id = Column(Integer, primary_key=True)
    meeting_status = Column(String(50))
    date_added = Column(DateTime, default=func.getdate())

# MAIN BUSINESS DATA TABLES

class LeadsInfo(Base):
    """Customer leads - matches database schema exactly"""
    __tablename__ = "leads_info"
    
    lead_id = Column(BigInteger, primary_key=True)  # IDENTITY(1,1)
    company_domain = Column(String(100), nullable=False)
    lead_phone = Column(String(50), unique=True, nullable=False)
    name = Column(String(50))  # NVARCHAR in DB
    assigned_to = Column(Integer, ForeignKey("user_info.id"))
    email = Column(String(50))
    gender = Column(String(10))
    job_title = Column(String(100))
    lead_stage = Column(Integer)
    lead_type = Column(Integer)
    lead_status = Column(Integer)
    date_added = Column(DateTime, default=func.getdate())

class ClientCall(Base):
    """Phone calls made to leads"""
    __tablename__ = "client_calls"
    
    call_id = Column(Integer, primary_key=True)  # IDENTITY(1,1)
    assigned_to = Column(Integer, ForeignKey("user_info.id"))
    company_domain = Column(String(100), ForeignKey("company_info.company_domain"))
    lead_id = Column(BigInteger, ForeignKey("leads_info.lead_id"))
    call_date = Column(DateTime)
    call_status = Column(Integer)
    date_added = Column(DateTime, default=func.getdate())

class ClientMeeting(Base):
    """Meetings scheduled with leads"""
    __tablename__ = "client_meetings"
    
    meeting_id = Column(Integer, primary_key=True)  # IDENTITY(1,1)
    assigned_to = Column(Integer, ForeignKey("user_info.id"))
    company_domain = Column(String(100), ForeignKey("company_info.company_domain"))
    lead_id = Column(BigInteger, ForeignKey("leads_info.lead_id"))
    meeting_date = Column(DateTime)
    meeting_status = Column(Integer)
    date_added = Column(DateTime, default=func.getdate())

# HR TABLES - FIXED FOR EXACT DATABASE SCHEMA

class EmployeeInfo(Base):
    """
    Company employees - FIXED to match database schema exactly
    
    CRITICAL FIXES:
    - Composite primary key (company_domain, employee_id)
    - employee_id is IDENTITY(1,1) but part of composite key
    - Proper field mappings to match database
    """
    __tablename__ = "employees_info"
    
    # Composite primary key as defined in database
    company_domain = Column(String(100), ForeignKey("company_info.company_domain"), primary_key=True)
    employee_id = Column(Integer, primary_key=True)  # IDENTITY(1,1)
    
    # Required field
    contact_name = Column(String(50), nullable=False)  # NVARCHAR in DB
    
    # Optional contact information
    business_phone = Column(String(50))
    personal_phone = Column(String(50))
    business_email = Column(String(50))
    personal_email = Column(String(50))
    
    # Optional fields
    gender = Column(String(10))
    is_company_admin = Column(BIT)
    user_uid = Column(UNIQUEIDENTIFIER)  # Could link to system user
    
    # Automatic timestamp
    date_added = Column(DateTime, default=func.getdate())

class EmployeeSalary(Base):
    """
    Salary records by month/year - matches database schema exactly
    
    PROPER COMPOSITE PRIMARY KEY:
    (company_domain, employee_id, due_year, due_month)
    """
    __tablename__ = "employees_salaries"
    
    # Composite primary key matching database
    company_domain = Column(String(100), primary_key=True)
    employee_id = Column(Integer, primary_key=True)
    due_year = Column(Integer, primary_key=True)
    due_month = Column(Integer, primary_key=True)
    
    # Salary components
    gross_salary = Column(MONEY)
    insurance = Column(MONEY)
    taxes = Column(MONEY)
    net_salary = Column(MONEY)
    
    # Due date and creation timestamp
    due_date = Column(Date)
    date_added = Column(DateTime, default=func.getdate())
    
    # Foreign key constraint (composite) - FIXED VERSION
    __table_args__ = (
        ForeignKeyConstraint(
            ['company_domain', 'employee_id'], 
            ['employees_info.company_domain', 'employees_info.employee_id']
        ),
    )