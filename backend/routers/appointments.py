from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List

from database import get_db
from schemas.schemas import AppointmentCreate, AppointmentOut
# Presupunem că ai o funcție sau un middleware care îți dă ID-ul utilizatorului logat.
# Pentru MVP, vom trimite un user_id fix (de exemplu, 1). Ulterior îl legăm de Token-ul JWT.
CURRENT_USER_ID = 1

router = APIRouter(
    prefix="/appointments",
    tags=["Appointments"]
)

@router.post("/", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
def create_appointment(appointment_data: AppointmentCreate, db: Session = Depends(get_db)):
    
    # 1. VERIFICARE SQL: Căutăm campania și capacitatea ei maximă pe slot
    campaign_query = text("""
        SELECT capacity_per_slot, is_active 
        FROM campaigns 
        WHERE id = :camp_id
    """)
    campaign = db.execute(campaign_query, {"camp_id": appointment_data.campaign_id}).fetchone()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campania nu există.")
    if not campaign.is_active:
        raise HTTPException(status_code=400, detail="Această campanie nu mai este activă.")

    # 2. VERIFICARE SQL: Numărăm câte programări active sunt deja pe acest slot
    count_query = text("""
        SELECT COUNT(id) AS booked 
        FROM appointments 
        WHERE campaign_id = :camp_id 
          AND slot_time = :slot_time 
          AND status != 'cancelled'
    """)
    booked_result = db.execute(count_query, {
        "camp_id": appointment_data.campaign_id,
        "slot_time": appointment_data.slot_time
    }).fetchone()
    
    # Dacă s-a atins capacitatea maximă, blocăm rezervarea
    if booked_result.booked >= campaign.capacity_per_slot:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ne pare rău, acest interval orar s-a ocupat între timp!"
        )

    # 3. INSERARE SQL MODIFICATĂ: Folosim mappings() pentru compatibilitate cu Pydantic
    insert_query = text("""
        INSERT INTO appointments (campaign_id, user_id, slot_time, status, created_at)
        OUTPUT INSERTED.id, INSERTED.campaign_id, INSERTED.user_id, INSERTED.slot_time, INSERTED.status, INSERTED.created_at
        VALUES (:camp_id, :user_id, :slot_time, 'confirmed', GETDATE())
    """)
    
    result = db.execute(insert_query, {
        "camp_id": appointment_data.campaign_id,
        "user_id": CURRENT_USER_ID,
        "slot_time": appointment_data.slot_time
    })
    
    # Confirmăm modificările în baza de date
    db.commit()
    
    # MODIFICAREA CRUCIALĂ: Convertim rândul din SQL Server într-un dicționar mapat curat
    new_appointment = result.mappings().first()
    
    return new_appointment


@router.put("/{id}/cancel", status_code=status.HTTP_200_OK)
def cancel_appointment(id: int, db: Session = Depends(get_db)):
    # Modificăm statusul în 'cancelled' pentru a elibera locul
    cancel_query = text("""
        UPDATE appointments 
        SET status = 'cancelled' 
        WHERE id = :app_id
    """)
    
    result = db.execute(cancel_query, {"app_id": id})
    db.commit()
    
    # rowcount ne spune câte rânduri au fost afectate de UPDATE
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Programarea nu a fost găsită.")
        
    return {"message": "Programarea a fost anulată cu succes."}