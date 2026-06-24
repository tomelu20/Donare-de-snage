from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..schemas import CampaignCreate, CampaignOut
from ..models import Campaign  # Asigură-te că ai modelul Campaign în models.py

router = APIRouter(
    prefix="/campaigns",
    tags=["Campaigns"]
)

@router.get("/", response_model=List[CampaignOut])
def get_campaigns(db: Session = Depends(get_db)):
    # Returnează toate campaniile active din baza de date
    campaigns = db.query(Campaign).filter(Campaign.is_active == True).all()
    return campaigns

@router.post("/", response_model=CampaignOut, status_code=status.HTTP_201_CREATED)
def create_campaign(campaign_data: CampaignCreate, db: Session = Depends(get_db)):
    # Creează o campanie nouă (Logica pentru Admin Panel)
    new_campaign = Campaign(
        title=campaign_data.title,
        location_name=campaign_data.location_name,
        address=campaign_data.address,
        date=campaign_data.date,
        start_time=campaign_data.start_time,
        end_time=campaign_data.end_time,
        slot_duration=campaign_data.slot_duration,
        capacity_per_slot=campaign_data.capacity_per_slot
    )
    
    db.add(new_campaign)
    db.commit()
    db.refresh(new_campaign)
    
    return new_campaign

@router.get("/{id}", response_model=CampaignOut)
def get_campaign_by_id(id: int, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == id).first()
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Campania cu id-ul {id} nu a fost găsită."
        )
    return campaign