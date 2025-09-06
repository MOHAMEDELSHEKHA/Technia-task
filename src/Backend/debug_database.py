# debug_database_corrected.py - Updated with correct company domain

import os
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Create engine
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def check_database_connection():
    """Test basic database connectivity"""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✓ Database connection successful")
            return True
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False

def check_table_structure():
    """Check the current table structure"""
    try:
        inspector = inspect(engine)
        
        # Check if employees_info table exists
        if 'employees_info' not in inspector.get_table_names():
            print("✗ employees_info table does not exist")
            return False
            
        # Get table structure
        columns = inspector.get_columns('employees_info')
        pk_constraints = inspector.get_pk_constraint('employees_info')
        
        print("✓ employees_info table structure:")
        for col in columns:
            print(f"  - {col['name']}: {col['type']} (nullable: {col['nullable']})")
            
        print(f"Primary Key: {pk_constraints['constrained_columns']}")
        
        return True
        
    except Exception as e:
        print(f"✗ Error checking table structure: {e}")
        return False

def test_employee_insertion():
    """Test inserting an employee manually with correct company domain"""
    try:
        db = SessionLocal()
        
        # Test raw SQL insertion with CORRECT company domain
        result = db.execute(text("""
            INSERT INTO employees_info (company_domain, contact_name, business_phone, date_added)
            VALUES ('taskdomain', 'Test Employee API Fixed', '123-456-7890', GETDATE())
        """))
        
        db.commit()
        print("✓ Raw SQL insertion successful")
        
        # Test retrieval
        employees = db.execute(text("SELECT * FROM employees_info WHERE contact_name = 'Test Employee API Fixed'")).fetchall()
        print(f"✓ Retrieved {len(employees)} employees")
        
        for emp in employees:
            print(f"  Employee: {dict(emp._mapping)}")
            
        db.close()
        return True
        
    except Exception as e:
        print(f"✗ Error testing insertion: {e}")
        if 'db' in locals():
            db.rollback()
            db.close()
        return False

def test_sqlalchemy_model():
    """Test using SQLAlchemy model with corrected approach"""
    try:
        from models import EmployeeInfo
        from database import get_db
        
        db = next(get_db())
        
        # Get the next employee_id for taskdomain
        max_employee = db.query(EmployeeInfo).filter(
            EmployeeInfo.company_domain == 'taskdomain'
        ).order_by(EmployeeInfo.employee_id.desc()).first()
        
        next_employee_id = 1 if not max_employee else max_employee.employee_id + 1
        
        print(f"Next employee ID will be: {next_employee_id}")
        
        # Create test employee using model with manual ID
        employee = EmployeeInfo(
            company_domain='taskdomain',  # CORRECT company domain
            employee_id=next_employee_id,  # Manual ID for composite key
            contact_name='Test SQLAlchemy Employee Fixed',
            business_phone='987-654-3210',
        )
        
        db.add(employee)
        db.commit()
        db.refresh(employee)
        
        print(f"✓ Employee saved successfully: {employee.__dict__}")
        
        db.close()
        return True
        
    except Exception as e:
        print(f"✗ SQLAlchemy model test failed: {e}")
        import traceback
        print(traceback.format_exc())
        if 'db' in locals():
            db.rollback()
            db.close()
        return False

def check_existing_data():
    """Check what data already exists"""
    try:
        db = SessionLocal()
        
        print("\n=== Existing Data ===")
        
        # Check company info
        companies = db.execute(text("SELECT * FROM company_info")).fetchall()
        print(f"Companies: {len(companies)}")
        for company in companies:
            print(f"  - {company.company_domain}: {company.name}")
        
        # Check users
        users = db.execute(text("SELECT id, username, company_domain, first_name, last_name FROM user_info")).fetchall()
        print(f"\nUsers: {len(users)}")
        for user in users:
            print(f"  - {user.username} ({user.first_name} {user.last_name}) - {user.company_domain}")
        
        # Check existing employees
        employees = db.execute(text("SELECT * FROM employees_info")).fetchall()
        print(f"\nEmployees: {len(employees)}")
        for emp in employees:
            print(f"  - ID: {emp.employee_id}, Name: {emp.contact_name}, Domain: {emp.company_domain}")
        
        db.close()
        return True
        
    except Exception as e:
        print(f"✗ Error checking existing data: {e}")
        return False

def main():
    """Run all diagnostic tests"""
    print("=== Database Diagnostic Tests (Corrected) ===\n")
    
    print("1. Testing database connection...")
    if not check_database_connection():
        return
    
    print("\n2. Checking existing data...")
    if not check_existing_data():
        return
    
    print("\n3. Checking table structure...")
    if not check_table_structure():
        return
    
    print("\n4. Testing raw SQL insertion...")
    if not test_employee_insertion():
        return
    
    print("\n5. Testing SQLAlchemy model...")
    if not test_sqlalchemy_model():
        return
    
    print("\n✓ All tests passed!")

if __name__ == "__main__":
    main()