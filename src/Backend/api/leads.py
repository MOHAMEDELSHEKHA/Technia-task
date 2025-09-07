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



@router.get("/lookup/stages", response_model=List[LookupResponse])
def get_lead_stages(
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_permission(db, current_user.id, Modules.REAL_ESTATE, Features.LEADS, 'read')
    
    stages = db.query(LeadsStage).filter(
        LeadsStage.company_domain == current_user.company_domain
    ).all()
    
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

# lead crud ops

@router.post("/leads", response_model=LeadResponse)
def create_lead(
    lead_data: LeadCreate,
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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
    require_permission(db, current_user.id, Modules.REAL_ESTATE, Features.LEADS, 'read')
    
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
    require_permission(db, current_user.id, Modules.REAL_ESTATE, Features.LEADS, 'delete')
    
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
        db.delete(lead)
        db.commit()
        return SuccessResponse(message="Lead deleted successfully")
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete lead"
        )

# calls/meetings ops

@router.post("/leads/{lead_id}/calls", response_model=CallResponse)
def add_call_to_lead(
    lead_id: int,
    call_data: CallCreate,
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_permission(db, current_user.id, Modules.REAL_ESTATE, Features.ACTIONS, 'write')
    
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
    require_permission(db, current_user.id, Modules.REAL_ESTATE, Features.ACTIONS, 'write')
    
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
    require_permission(db, current_user.id, Modules.REAL_ESTATE, Features.ACTIONS, 'read')
    
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
    
    calls = db.query(ClientCall).filter(
        ClientCall.lead_id == lead_id
    ).all()
    
    call_statuses = db.query(CallStatus).filter(
        CallStatus.company_domain == current_user.company_domain
    ).all()
    
    status_map = {cs.id: cs.call_status for cs in call_statuses}
    
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
    
    meetings = db.query(ClientMeeting).filter(
        ClientMeeting.lead_id == lead_id
    ).all()
    
    meeting_statuses = db.query(MeetingStatus).filter(
        MeetingStatus.company_domain == current_user.company_domain
    ).all()
    
    status_map = {ms.id: ms.meeting_status for ms in meeting_statuses}
    
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

@router.delete("/leads/{lead_id}/calls/{call_id}", response_model=SuccessResponse)
def delete_call(
    lead_id: int,
    call_id: int,
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_permission(db, current_user.id, Modules.REAL_ESTATE, Features.ACTIONS, 'delete')
    
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
    
    call = db.query(ClientCall).filter(
        and_(
            ClientCall.call_id == call_id,
            ClientCall.lead_id == lead_id,
            ClientCall.company_domain == current_user.company_domain
        )
    ).first()
    
    if not call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Call not found"
        )
    
    try:
        db.delete(call)
        db.commit()
        return SuccessResponse(message="Call deleted successfully")
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete call"
        )

@router.delete("/leads/{lead_id}/meetings/{meeting_id}", response_model=SuccessResponse)
def delete_meeting(
    lead_id: int,
    meeting_id: int,
    current_user: UserInfo = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_permission(db, current_user.id, Modules.REAL_ESTATE, Features.ACTIONS, 'delete')
    
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
    
    meeting = db.query(ClientMeeting).filter(
        and_(
            ClientMeeting.meeting_id == meeting_id,
            ClientMeeting.lead_id == lead_id,
            ClientMeeting.company_domain == current_user.company_domain
        )
    ).first()
    
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )
    
    try:
        db.delete(meeting)
        db.commit()
        return SuccessResponse(message="Meeting deleted successfully")
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete meeting"
        )