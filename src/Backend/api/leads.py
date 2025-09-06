"""
Real Estate Module API Endpoints - Enhanced with Status Lookups

WHY THIS FILE EXISTS:
- Handles all lead management operations (CRUD)
- Manages calls and meetings (actions on leads)
- Provides lookup data for dropdowns with proper status names
- Enforces permissions on every operation
- Scopes all data to user's company

BUSINESS LOGIC:
- Leads are potential customers
- Each lead can have multiple calls and meetings
- All operations are permission-controlled
- Data is isolated by company_domain
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List
from typing import Dict


from database import get_db
from auth import get_current_user
from permissions import Modules, Features, require_permission
from schemas import (
    LeadCreate, LeadUpdate, LeadResponse,
    CallCreate, CallResponse, MeetingCreate, MeetingResponse,
    LookupResponse, SuccessResponse
)
from models import (
    UserInfo, LeadsInfo, ClientCall, ClientMeeting,
    LeadsStage, LeadsStatus, LeadsType, CallStatus, MeetingStatus
)

router = APIRouter()

# LOOKUP ENDPOINTS
# WHY: Frontend needs dropdown data for forms

@router.get("/lookup/stages", response_model=List[LookupResponse])
def get_lead_stages(
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all lead stages for user's company"""
    # Check read permission for leads
    require_permission(db, current_user.id, Modules.REAL_ESTATE, Features.LEADS, 'read')
    
    stages = db.query(LeadsStage).filter(
        LeadsStage.company_domain == current_user.company_domain
    ).all()
    
    # Convert to generic lookup format
    return [
        LookupResponse(
            id=stage.id,
            name=stage.lead_stage,
            company_domain=stage.company_domain
        )
        for stage in stages
    ]

@router.get("/lookup/statuses", response_model=List[LookupResponse])
def get_lead_statuses(
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all lead statuses for user's company"""
    require_permission(db, current_user.id, Modules.REAL_ESTATE, Features.LEADS, 'read')
    
    statuses = db.query(LeadsStatus).filter(
        LeadsStatus.company_domain == current_user.company_domain
    ).all()
    
    return [
        LookupResponse(
            id=status.id,
            name=status.lead_status,
            company_domain=status.company_domain
        )
        for status in statuses
    ]

@router.get("/lookup/types", response_model=List[LookupResponse])
def get_lead_types(
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all lead types for user's company"""
    require_permission(db, current_user.id, Modules.REAL_ESTATE, Features.LEADS, 'read')
    
    types = db.query(LeadsType).filter(
        LeadsType.company_domain == current_user.company_domain
    ).all()
    
    return [
        LookupResponse(
            id=lead_type.id,
            name=lead_type.lead_type,
            company_domain=lead_type.company_domain
        )
        for lead_type in types
    ]

@router.get("/lookup/call-statuses", response_model=List[LookupResponse])
def get_call_statuses(
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all call statuses for user's company"""
    require_permission(db, current_user.id, Modules.REAL_ESTATE, Features.ACTIONS, 'read')
    
    statuses = db.query(CallStatus).filter(
        CallStatus.company_domain == current_user.company_domain
    ).all()
    
    return [
        LookupResponse(
            id=status.id,
            name=status.call_status,
            company_domain=status.company_domain
        )
        for status in statuses
    ]

@router.get("/lookup/meeting-statuses", response_model=List[LookupResponse])
def get_meeting_statuses(
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all meeting statuses for user's company"""
    require_permission(db, current_user.id, Modules.REAL_ESTATE, Features.ACTIONS, 'read')
    
    statuses = db.query(MeetingStatus).filter(
        MeetingStatus.company_domain == current_user.company_domain
    ).all()
    
    return [
        LookupResponse(
            id=status.id,
            name=status.meeting_status,
            company_domain=status.company_domain
        )
        for status in statuses
    ]

# LEAD CRUD OPERATIONS

@router.post("/leads", response_model=LeadResponse)
def create_lead(
    lead_data: LeadCreate,
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new lead
    
    WHY THIS ENDPOINT:
    - Allows users to add new potential customers
    - Automatically sets company domain to user's company
    - Enforces write permission
    """
    require_permission(db, current_user.id, Modules.REAL_ESTATE, Features.LEADS, 'write')
    
    # Create new lead with user's company domain
    lead = LeadsInfo(
        **lead_data.dict(),
        company_domain=current_user.company_domain
    )
    
    try:
        db.add(lead)
        db.commit()
        db.refresh(lead)
        return lead
    except Exception as e:
        db.rollback()
        # Handle unique constraint violations (phone number must be unique)
        if "UNIQUE constraint failed" in str(e) or "duplicate key" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A lead with this phone number already exists"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create lead"
        )

@router.get("/leads", response_model=List[LeadResponse])
def get_all_leads(
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all leads for user's company
    
    WHY THIS ENDPOINT:
    - Main page for viewing leads
    - Only shows leads from user's company
    - Requires read permission
    """
    require_permission(db, current_user.id, Modules.REAL_ESTATE, Features.LEADS, 'read')
    
    leads = db.query(LeadsInfo).filter(
        LeadsInfo.company_domain == current_user.company_domain
    ).all()
    
    return leads

@router.get("/leads/{lead_id}", response_model=LeadResponse)
def get_lead_by_id(
    lead_id: int,
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific lead with security checks"""
    require_permission(db, current_user.id, Modules.REAL_ESTATE, Features.LEADS, 'read')
    
    # SECURITY: Ensure lead belongs to user's company
    lead = db.query(LeadsInfo).filter(
        and_(
            LeadsInfo.lead_id == lead_id,
            LeadsInfo.company_domain == current_user.company_domain
        )
    ).first()
    
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )
    
    return lead

@router.put("/leads/{lead_id}", response_model=LeadResponse)
def update_lead(
    lead_id: int,
    lead_update: LeadUpdate,
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update existing lead"""
    require_permission(db, current_user.id, Modules.REAL_ESTATE, Features.LEADS, 'edit')
    
    # Find lead with security check
    lead = db.query(LeadsInfo).filter(
        and_(
            LeadsInfo.lead_id == lead_id,
            LeadsInfo.company_domain == current_user.company_domain
        )
    ).first()
    
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )
    
    # Update only provided fields
    update_data = lead_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lead, field, value)
    
    try:
        db.commit()
        db.refresh(lead)
        return lead
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update lead"
        )

@router.delete("/leads/{lead_id}", response_model=SuccessResponse)
def delete_lead(
    lead_id: int,
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a lead"""
    require_permission(db, current_user.id, Modules.REAL_ESTATE, Features.LEADS, 'delete')
    
    # Find lead with security check
    lead = db.query(LeadsInfo).filter(
        and_(
            LeadsInfo.lead_id == lead_id,
            LeadsInfo.company_domain == current_user.company_domain
        )
    ).first()
    
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )
    
    try:
        # Note: Related calls/meetings will be deleted by CASCADE constraints
        db.delete(lead)
        db.commit()
        return SuccessResponse(message="Lead deleted successfully")
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete lead"
        )

# ACTION ENDPOINTS (Calls and Meetings)

@router.post("/leads/{lead_id}/calls", response_model=CallResponse)
def add_call_to_lead(
    lead_id: int,
    call_data: CallCreate,
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a call action to a lead"""
    require_permission(db, current_user.id, Modules.REAL_ESTATE, Features.ACTIONS, 'write')
    
    # Verify lead exists and belongs to user's company
    lead = db.query(LeadsInfo).filter(
        and_(
            LeadsInfo.lead_id == lead_id,
            LeadsInfo.company_domain == current_user.company_domain
        )
    ).first()
    
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )
    
    # Create call record
    call = ClientCall(
        **call_data.dict(),
        lead_id=lead_id,
        assigned_to=current_user.id,
        company_domain=current_user.company_domain
    )
    
    try:
        db.add(call)
        db.commit()
        db.refresh(call)
        return call
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create call record"
        )

@router.post("/leads/{lead_id}/meetings", response_model=MeetingResponse)
def add_meeting_to_lead(
    lead_id: int,
    meeting_data: MeetingCreate,
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a meeting action to a lead"""
    require_permission(db, current_user.id, Modules.REAL_ESTATE, Features.ACTIONS, 'write')
    
    # Verify lead exists and belongs to user's company
    lead = db.query(LeadsInfo).filter(
        and_(
            LeadsInfo.lead_id == lead_id,
            LeadsInfo.company_domain == current_user.company_domain
        )
    ).first()
    
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )
    
    # Create meeting record
    meeting = ClientMeeting(
        **meeting_data.dict(),
        lead_id=lead_id,
        assigned_to=current_user.id,
        company_domain=current_user.company_domain
    )
    
    try:
        db.add(meeting)
        db.commit()
        db.refresh(meeting)
        return meeting
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create meeting record"
        )

@router.get("/leads/{lead_id}/calls", response_model=List[Dict])
def get_lead_calls(
    lead_id: int,
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all calls for a specific lead with status names"""
    require_permission(db, current_user.id, Modules.REAL_ESTATE, Features.ACTIONS, 'read')
    
    # Verify lead belongs to user's company
    lead_exists = db.query(LeadsInfo).filter(
        and_(
            LeadsInfo.lead_id == lead_id,
            LeadsInfo.company_domain == current_user.company_domain
        )
    ).first()
    
    if not lead_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )
    
    # Get calls with status names
    calls = db.query(ClientCall).filter(
        ClientCall.lead_id == lead_id
    ).all()
    
    # Get call statuses for lookup
    call_statuses = db.query(CallStatus).filter(
        CallStatus.company_domain == current_user.company_domain
    ).all()
    
    status_map = {cs.id: cs.call_status for cs in call_statuses}
    
    # Return calls with status names
    result = []
    for call in calls:
        call_dict = {
            "call_id": call.call_id,
            "call_date": call.call_date,
            "call_status": call.call_status,
            "call_status_name": status_map.get(call.call_status, "Unknown"),
            "assigned_to": call.assigned_to,
            "lead_id": call.lead_id,
            "company_domain": call.company_domain,
            "date_added": call.date_added
        }
        result.append(call_dict)
    
    return result

@router.get("/leads/{lead_id}/meetings", response_model=List[Dict])
def get_lead_meetings(
    lead_id: int,
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all meetings for a specific lead with status names"""
    require_permission(db, current_user.id, Modules.REAL_ESTATE, Features.ACTIONS, 'read')
    
    # Verify lead belongs to user's company
    lead_exists = db.query(LeadsInfo).filter(
        and_(
            LeadsInfo.lead_id == lead_id,
            LeadsInfo.company_domain == current_user.company_domain
        )
    ).first()
    
    if not lead_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )
    
    # Get meetings with status names
    meetings = db.query(ClientMeeting).filter(
        ClientMeeting.lead_id == lead_id
    ).all()
    
    # Get meeting statuses for lookup
    meeting_statuses = db.query(MeetingStatus).filter(
        MeetingStatus.company_domain == current_user.company_domain
    ).all()
    
    status_map = {ms.id: ms.meeting_status for ms in meeting_statuses}
    
    # Return meetings with status names
    result = []
    for meeting in meetings:
        meeting_dict = {
            "meeting_id": meeting.meeting_id,
            "meeting_date": meeting.meeting_date,
            "meeting_status": meeting.meeting_status,
            "meeting_status_name": status_map.get(meeting.meeting_status, "Unknown"),
            "assigned_to": meeting.assigned_to,
            "lead_id": meeting.lead_id,
            "company_domain": meeting.company_domain,
            "date_added": meeting.date_added
        }
        result.append(meeting_dict)
    
    return result