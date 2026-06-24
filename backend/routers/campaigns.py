from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text  # <-- Avem nevoie de text pentru a scrie SQL nativ
from typing import List
from datetime import datetime, timedelta, time

from database import get_db
from schemas.schemas import CampaignCreate, CampaignOut, SlotOut
from models import Campaign

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

@router.get("/{id}/slots", response_model=List[SlotOut])
def get_campaign_slots(id: int, db: Session = Depends(get_db)):
    # 1. Căutăm campania folosind structura standard (avem nevoie de datele ei pentru matematică)
    campaign = db.query(Campaign).filter(Campaign.id == id).first()
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campania nu a fost găsită."
        )

    # 2. INTEROGARE SQL PURĂ pentru numărarea programărilor ocupate
    query_sql = text("""
        SELECT slot_time, COUNT(id) AS booked_count
        FROM appointments 
        WHERE campaign_id = :camp_id AND status != 'cancelled'
        GROUP BY slot_time
    """)
    
    # Executăm query-ul nativ și pasăm ID-ul campaniei ca parametru (:camp_id)
    rezultat = db.execute(query_sql, {"camp_id": id}).fetchall()
    
    # Transformăm rândurile returnate de SQL Server într-un dicționar Python: { time(8, 30): 2 }
    taken_slots = {row.slot_time: row.booked_count for row in rezultat}

    # 3. Generăm matematic intervalele orare în memorie
    slots = []
    current_datetime = datetime.combine(campaign.date, campaign.start_time)
    end_datetime = datetime.combine(campaign.date, campaign.end_time)

    while current_datetime < end_datetime:
        current_time_obj = current_datetime.time()
        
        # Luăm numărul de locuri ocupate din dicționarul generat de SQL-ul tău (implicit 0 dacă e gol)
        booked_count = taken_slots.get(current_time_obj, 0)
        
        # Calculăm capacitatea rămasă
        remaining_capacity = campaign.capacity_per_slot - booked_count
        
        slots.append({
            "time": current_time_obj.strftime("%H:%M"),
            "available_slots": max(0, remaining_capacity),
            "is_available": remaining_capacity > 0
        })
        
        current_datetime += timedelta(minutes=campaign.slot_duration)

    return slots