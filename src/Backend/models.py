from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, BigInteger, Date, ForeignKey, CheckConstraint, ForeignKeyConstraint
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER, BIT, MONEY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import uuid

class Module(Base):
    __tablename__ = "modules"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False)
    display_name = Column(String(100))
    description = Column(Text)
    available = Column(BIT)
    comming_on = Column(Date)  
    color = Column(BigInteger)
    url = Column(Text)

class ModuleFeature(Base):
    __tablename__ = "module_features"
    
    module_id = Column(Integer, ForeignKey("modules.id"), primary_key=True)
    feature_id = Column(Integer, primary_key=True)
    name = Column(String(50))
    display_name = Column(String(100))

class CompanyInfo(Base):
    __tablename__ = "company_info"
    
    company_domain = Column(String(100), primary_key=True)
    name = Column(String(50), nullable=False)  # NVARCHAR in DB
    field = Column(String(100))
    address = Column(String(500))  # NVARCHAR in DB
    country = Column(String(100))
    telephone_number = Column(String(50), unique=True, nullable=False)
    date_added = Column(DateTime, default=func.getdate())

class UserInfo(Base):
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
    __tablename__ = "user_roles"
    
    id = Column(Integer, primary_key=True)  # IDENTITY(1,1)
    company_domain = Column(String(100), ForeignKey("company_info.company_domain"))
    module_id = Column(Integer, ForeignKey("modules.id"))
    name = Column(String(50), nullable=False)

class UserRolePermission(Base):
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
    __tablename__ = "user_role_mapping"
    
    user_id = Column(Integer, ForeignKey("user_info.id"), primary_key=True)
    role_id = Column(Integer, ForeignKey("user_roles.id"), primary_key=True)

# REAL ESTATE LOOKUP TABLES

class LeadsStage(Base):
    __tablename__ = "leads_stage"
    
    company_domain = Column(String(100), ForeignKey("company_info.company_domain"), primary_key=True)
    id = Column(Integer, primary_key=True)
    lead_stage = Column(String(50))
    date_added = Column(DateTime, default=func.getdate())
    is_assigned = Column(BIT)
    is_not_assigned = Column(BIT)
    is_action_taken = Column(BIT)

class LeadsStatus(Base):
    __tablename__ = "leads_status"
    
    company_domain = Column(String(100), ForeignKey("company_info.company_domain"), primary_key=True)
    id = Column(Integer, primary_key=True)
    lead_status = Column(String(50))
    date_added = Column(DateTime, default=func.getdate())

class LeadsType(Base):
    __tablename__ = "leads_types"
    
    company_domain = Column(String(100), ForeignKey("company_info.company_domain"), primary_key=True)
    id = Column(Integer, primary_key=True)
    lead_type = Column(String(50))
    date_added = Column(DateTime, default=func.getdate())

class CallStatus(Base):
    __tablename__ = "calls_status"
    
    company_domain = Column(String(100), ForeignKey("company_info.company_domain"), primary_key=True)
    id = Column(Integer, primary_key=True)
    call_status = Column(String(50))
    date_added = Column(DateTime, default=func.getdate())

class MeetingStatus(Base):
    __tablename__ = "meetings_status"
    
    company_domain = Column(String(100), ForeignKey("company_info.company_domain"), primary_key=True)
    id = Column(Integer, primary_key=True)
    meeting_status = Column(String(50))
    date_added = Column(DateTime, default=func.getdate())

# MAIN BUSINESS DATA TABLES

class LeadsInfo(Base):
    __tablename__ = "leads_info"
    
    lead_id = Column(BigInteger, primary_key=True)  
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
    __tablename__ = "client_calls"
    
    call_id = Column(Integer, primary_key=True) 
    assigned_to = Column(Integer, ForeignKey("user_info.id"))
    company_domain = Column(String(100), ForeignKey("company_info.company_domain"))
    lead_id = Column(BigInteger, ForeignKey("leads_info.lead_id"))
    call_date = Column(DateTime)
    call_status = Column(Integer)
    date_added = Column(DateTime, default=func.getdate())

class ClientMeeting(Base):
    __tablename__ = "client_meetings"
    
    meeting_id = Column(Integer, primary_key=True) 
    assigned_to = Column(Integer, ForeignKey("user_info.id"))
    company_domain = Column(String(100), ForeignKey("company_info.company_domain"))
    lead_id = Column(BigInteger, ForeignKey("leads_info.lead_id"))
    meeting_date = Column(DateTime)
    meeting_status = Column(Integer)
    date_added = Column(DateTime, default=func.getdate())

# HR TABLES - FIXED FOR EXACT DATABASE SCHEMA

class EmployeeInfo(Base):
    __tablename__ = "employees_info"
    
    company_domain = Column(String(100), ForeignKey("company_info.company_domain"), primary_key=True)
    employee_id = Column(Integer, primary_key=True)  
    
    contact_name = Column(String(50), nullable=False)  
    
    business_phone = Column(String(50))
    personal_phone = Column(String(50))
    business_email = Column(String(50))
    personal_email = Column(String(50))
    
    gender = Column(String(10))
    is_company_admin = Column(BIT)
    user_uid = Column(UNIQUEIDENTIFIER)  
    
    date_added = Column(DateTime, default=func.getdate())

class EmployeeSalary(Base):

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
    
    __table_args__ = (
        ForeignKeyConstraint(
            ['company_domain', 'employee_id'], 
            ['employees_info.company_domain', 'employees_info.employee_id']
        ),
    )