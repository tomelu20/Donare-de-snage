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
    # Returnează toate campaniile (active și finalizate) ordonate după dată
    campaigns = db.query(Campaign).order_by(Campaign.date.desc()).all()
    return campaigns

@router.put("/{id}/toggle-status", status_code=status.HTTP_200_OK)
def toggle_campaign_status(id: int, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campania nu a fost găsită.")
    
    campaign.is_active = not campaign.is_active
    db.commit()
    
    status_str = "activată" if campaign.is_active else "finalizată"
    return {"message": f"Campania a fost {status_str} cu succes.", "is_active": campaign.is_active}

@router.post("/", response_model=CampaignOut, status_code=status.HTTP_201_CREATED)
def create_campaign(campaign_data: CampaignCreate, db: Session = Depends(get_db)):
    # Creează o campanie nouă (Logica pentru Admin Panel)
    new_campaign = Campaign(
        title=campaign_data.title,
        location_name=campaign_data.location_name,
        address=campaign_data.address,
        date=campaign_data.date,
        end_date=campaign_data.end_date,
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
    # 1. Preluăm campania
    campaign = db.query(Campaign).filter(Campaign.id == id, Campaign.is_active == True).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campania nu a fost găsită sau este inactivă.")

    # 2. Preluăm toate programările active pentru această campanie
    query_sql = text("""
        SELECT CAST(created_at AS DATE) as app_date, slot_time, COUNT(id) AS booked_count
        FROM appointments 
        WHERE campaign_id = :camp_id AND status != 'cancelled'
        GROUP BY CAST(created_at AS DATE), slot_time
    """)
    # Notă: Dacă în tabela ta appointments nu ai data salvată separat ci doar ora, 
    # ne vom baza pe data campaniei sau corelarea sloturilor. 
    # Cel mai sigur este să salvăm programările raportat la zi.
    
    # Pentru a fi 100% compatibili cu SQL-ul tău, presupunem că appointments are nevoie și de dată 
    # dar ca să nu modificăm tabela appointments, putem grupa după o nouă coloană de dată dacă ai adăugat-o,
    # sau presupunem că programările se leagă direct de slot_time și o dată specifică.
    # Să folosim o abordare curată:
    
    query_sql = text("""
        SELECT appointment_date, slot_time, COUNT(id) AS booked_count
        FROM appointments 
        WHERE campaign_id = :camp_id AND status != 'cancelled'
        GROUP BY appointment_date, slot_time
    """)
    
    try:
        rezultat = db.execute(query_sql, {"camp_id": id}).fetchall()
        taken_slots = {(row.appointment_date, row.slot_time): row.booked_count for row in rezultat}
    except Exception:
        # Fallback în cazul în care nu ai adăugat încă coloana appointment_date în appointments:
        # Presupunem că tabela appointments folosește doar slot_time (cazul tău inițial)
        rezultat = db.execute(text("""
            SELECT slot_time, COUNT(id) AS booked_count 
            FROM appointments WHERE campaign_id = :camp_id AND status != 'cancelled' GROUP BY slot_time
        """), {"camp_id": id}).fetchall()
        taken_slots = {(campaign.date, row.slot_time): row.booked_count for row in rezultat}

    slots = []
    
    # Determinăm data de început și de sfârșit
    # Dacă nu vrei să adaugi end_date în baza de date, putem folosi proprietatea că dacă end_date nu există, e campanie de o zi
    start_date = campaign.date
    # Verificăm dacă modelul tău are end_date, altfel fallback la o singură zi
    end_date = getattr(campaign, 'end_date', campaign.date) 

    current_date = start_date
    while current_date <= end_date:
        current_datetime = datetime.combine(current_date, campaign.start_time)
        end_datetime = datetime.combine(current_date, campaign.end_time)

        while current_datetime < end_datetime:
            current_time_obj = current_datetime.time()
            
            # Verificăm câte locuri sunt ocupate în această zi specifică la această oră
            booked_count = taken_slots.get((current_date, current_time_obj), 0)
            remaining_capacity = campaign.capacity_per_slot - booked_count
            
            # Adăugăm data în structura de slot trimisă către Frontend
            slots.append({
                "date": current_date.isoformat(), # "YYYY-MM-DD"
                "time": current_time_obj.strftime("%H:%M:%S"),
                "available_slots": max(0, remaining_capacity),
                "is_available": remaining_capacity > 0
            })
            
            current_datetime += timedelta(minutes=campaign.slot_duration)
        
        current_date += timedelta(days=1)

    return slots