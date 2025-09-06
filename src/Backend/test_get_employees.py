# test_get_employees.py - Test the GET employees API directly

import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def test_get_employees():
    """Test what employees are actually in the database"""
    try:
        db = SessionLocal()
        
        print("=== Testing Employee Retrieval ===")
        
        # Check all employees in database
        result = db.execute(text("""
            SELECT employee_id, contact_name, company_domain, date_added
            FROM employees_info 
            ORDER BY date_added DESC
        """))
        
        all_employees = result.fetchall()
        print(f"\nTotal employees in database: {len(all_employees)}")
        
        for emp in all_employees:
            print(f"  ID: {emp.employee_id}, Name: '{emp.contact_name}', Domain: '{emp.company_domain}', Added: {emp.date_added}")
        
        # Check specifically for taskdomain
        result2 = db.execute(text("""
            SELECT employee_id, contact_name, business_phone, business_email, date_added
            FROM employees_info 
            WHERE company_domain = 'taskdomain'
            ORDER BY employee_id
        """))
        
        taskdomain_employees = result2.fetchall()
        print(f"\nEmployees for 'taskdomain': {len(taskdomain_employees)}")
        
        for emp in taskdomain_employees:
            print(f"  ID: {emp.employee_id}")
            print(f"    Name: '{emp.contact_name}'")
            print(f"    Phone: '{emp.business_phone}'")
            print(f"    Email: '{emp.business_email}'")
            print(f"    Added: {emp.date_added}")
            print("    ---")
        
        # Check if employee ID 12 exists
        result3 = db.execute(text("""
            SELECT * FROM employees_info 
            WHERE employee_id = 12 AND company_domain = 'taskdomain'
        """))
        
        emp_12 = result3.fetchone()
        if emp_12:
            print(f"\nEmployee ID 12 found:")
            print(f"  Name: '{emp_12.contact_name}'")
            print(f"  Phone: '{emp_12.business_phone}'")
            print(f"  Email: '{emp_12.business_email}'")
        else:
            print(f"\nEmployee ID 12 NOT found!")
        
        db.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_get_employees()