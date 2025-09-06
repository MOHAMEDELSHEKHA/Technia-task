"""
Database Models - SQLAlchemy ORM Models

WHY THIS FILE EXISTS:
- Maps your SQL tables to Python classes
- Allows object-oriented database operations
- Handles relationships between tables automatically
- Provides type safety and IDE support
- Matches exactly with your existing database schema

DESIGN PRINCIPLE:
- Each class represents one table
- Column names match your SQL schema exactly
- Relationships are defined to make querying easier
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, BigInteger, Date, ForeignKey, CheckConstraint
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER, BIT, MONEY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import uuid

# WHY THESE MODELS EXIST:
# They allow you to write: user = User(username="Ahmed", password="123")
# Instead of: INSERT INTO user_info (username, password) VALUES ('Ahmed', '123')

class Module(Base):
    """
    Represents business modules (Real Estate, HR)
    WHY: Defines what major areas your ERP covers
    """
    __tablename__ = "modules"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False)
    display_name = Column(String(100))
    description = Column(Text)
    available = Column(BIT)
    comming_on = Column(Date)  # Note: keeping original typo from your schema
    color = Column(BigInteger)
    url = Column(Text)

class ModuleFeature(Base):
    """
    Features within each module (Leads, Actions, Employees, Salaries)
    WHY: Defines what specific things you can do in each module
    """
    __tablename__ = "module_features"
    
    module_id = Column(Integer, ForeignKey("modules.id"), primary_key=True)
    feature_id = Column(Integer, primary_key=True)
    name = Column(String(50))
    display_name = Column(String(100))

class CompanyInfo(Base):
    """
    Company information for multi-tenant support
    WHY: One database serves multiple companies
    """
    __tablename__ = "company_info"
    
    company_domain = Column(String(100), primary_key=True)
    name = Column(String(50), nullable=False)  # Using String instead of NVARCHAR for simplicity
    field = Column(String(100))
    address = Column(String(500))
    country = Column(String(100))
    telephone_number = Column(String(50), unique=True, nullable=False)
    date_added = Column(DateTime, default=func.getdate())

class UserInfo(Base):
    """
    System users who can log in
    WHY: People who need access to the ERP system
    """
    __tablename__ = "user_info"
    
    id = Column(Integer, primary_key=True)  # IDENTITY(1,1) handled by SQLAlchemy
    uid = Column(UNIQUEIDENTIFIER, default=uuid.uuid4)
    company_domain = Column(String(100), ForeignKey("company_info.company_domain"))
    first_name = Column(String(50), nullable=False)
    middle_name = Column(String(50))
    last_name = Column(String(50), nullable=False)
    phone = Column(String(50), unique=True)
    email = Column(String(50), unique=True, nullable=False)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(200))  # In real app, this would be properly hashed
    gender = Column(String(10))
    date_added = Column(DateTime, default=func.getdate())
    
    # WHY CHECK CONSTRAINT: Ensures only valid gender values
    __table_args__ = (
        CheckConstraint("gender IN ('Male', 'Female')", name="ck_gender"),
    )

class UserRole(Base):
    """
    Available roles (Manager, Team Leader, Junior, HR Head)
    WHY: Defines job roles that users can be assigned
    """
    __tablename__ = "user_roles"
    
    id = Column(Integer, primary_key=True)
    company_domain = Column(String(100), ForeignKey("company_info.company_domain"))
    module_id = Column(Integer, ForeignKey("modules.id"))
    name = Column(String(50), nullable=False)

class UserRolePermission(Base):
    """
    What each role can actually do (CRUD permissions)
    WHY: Controls access to each feature - this is the heart of security
    """
    __tablename__ = "user_role_permissions"
    
    role_id = Column(Integer, ForeignKey("user_roles.id"), primary_key=True)
    permission_id = Column(Integer, primary_key=True)  # IDENTITY handled automatically
    module_id = Column(Integer, nullable=False)
    feature_id = Column(Integer, nullable=False)
    
    # These are the actual permission bits - 1 = allowed, 0 = denied
    d_read = Column(BIT, default=0)
    d_write = Column(BIT, default=0) 
    d_edit = Column(BIT, default=0)
    d_delete = Column(BIT, default=0)

class UserRoleMapping(Base):
    """
    Which users have which roles
    WHY: Users can have multiple roles (like Ahmed having Manager + HR Head)
    """
    __tablename__ = "user_role_mapping"
    
    user_id = Column(Integer, ForeignKey("user_info.id"), primary_key=True)
    role_id = Column(Integer, ForeignKey("user_roles.id"), primary_key=True)

# REAL ESTATE LOOKUP TABLES
# WHY THESE EXIST: Dropdowns in your UI need consistent data

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
    """
    Customer leads - the core of real estate business
    WHY: This is where you store potential customers
    """
    __tablename__ = "leads_info"
    
    lead_id = Column(BigInteger, primary_key=True)  # IDENTITY handled automatically
    company_domain = Column(String(100), nullable=False)
    lead_phone = Column(String(50), unique=True, nullable=False)
    name = Column(String(50))
    assigned_to = Column(Integer, ForeignKey("user_info.id"))
    email = Column(String(50))
    gender = Column(String(10))
    job_title = Column(String(100))
    lead_stage = Column(Integer)
    lead_type = Column(Integer)
    lead_status = Column(Integer)
    date_added = Column(DateTime, default=func.getdate())

class ClientCall(Base):
    """
    Phone calls made to leads
    WHY: Track all interactions with potential customers
    """
    __tablename__ = "client_calls"
    
    call_id = Column(Integer, primary_key=True)
    assigned_to = Column(Integer, ForeignKey("user_info.id"))
    company_domain = Column(String(100), ForeignKey("company_info.company_domain"))
    lead_id = Column(BigInteger, ForeignKey("leads_info.lead_id"))
    call_date = Column(DateTime)
    call_status = Column(Integer)
    date_added = Column(DateTime, default=func.getdate())

class ClientMeeting(Base):
    """
    Meetings scheduled with leads
    WHY: Track face-to-face interactions
    """
    __tablename__ = "client_meetings"
    
    meeting_id = Column(Integer, primary_key=True)
    assigned_to = Column(Integer, ForeignKey("user_info.id"))
    company_domain = Column(String(100), ForeignKey("company_info.company_domain"))
    lead_id = Column(BigInteger, ForeignKey("leads_info.lead_id"))
    meeting_date = Column(DateTime)
    meeting_status = Column(Integer)
    date_added = Column(DateTime, default=func.getdate())

class EmployeeInfo(Base):
    """
    Company employees - matches your database schema exactly
    """
    __tablename__ = "employees_info"
    
    # Composite primary key as in your database
    company_domain = Column(String(100), ForeignKey("company_info.company_domain"), primary_key=True)
    employee_id = Column(Integer, primary_key=True)  # IDENTITY column
    
    # Other columns matching your schema
    contact_name = Column(String(50), nullable=False)  # NVARCHAR in DB
    business_phone = Column(String(50))
    personal_phone = Column(String(50))
    business_email = Column(String(50))
    personal_email = Column(String(50))
    gender = Column(String(10))
    is_company_admin = Column(BIT)
    user_uid = Column(UNIQUEIDENTIFIER)
    date_added = Column(DateTime, default=func.getdate())

class EmployeeSalary(Base):
    """
    Salary records by month/year
    WHY: Track payroll history over time
    """
    __tablename__ = "employees_salaries"
    
    company_domain = Column(String(100), primary_key=True)
    employee_id = Column(Integer, primary_key=True)
    due_year = Column(Integer, primary_key=True)
    due_month = Column(Integer, primary_key=True)
    gross_salary = Column(MONEY)
    insurance = Column(MONEY)
    taxes = Column(MONEY)
    net_salary = Column(MONEY)
    due_date = Column(Date)
    date_added = Column(DateTime, default=func.getdate())

# WHY NO RELATIONSHIPS DEFINED HERE:
# For simplicity, we'll handle joins manually in queries
# In a larger app, you'd define relationships like:
# leads = relationship("LeadsInfo", back_populates="assigned_user")