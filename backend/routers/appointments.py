from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List

from database import get_db
from schemas.schemas import AppointmentCreate, AppointmentOut

# Pentru MVP, folosim un user_id fix (1). Ulterior îl legăm de Token-ul JWT.
CURRENT_USER_ID = 1

router = APIRouter(
    prefix="/appointments",
    tags=["Appointments"]
)

@router.post("/", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
def create_appointment(appointment_data: AppointmentCreate, db: Session = Depends(get_db)):
    
    # ------------------------------------------------------------------------
    # ACTUALIZAT: VERIFICARE UTILIZATOR - Maxim o programare per CAMPANIE
    # ------------------------------------------------------------------------
    user_check_query = text("""
        SELECT COUNT(id) AS existing_count 
        FROM appointments 
        WHERE user_id = :user_id 
          AND campaign_id = :camp_id 
          AND status IN ('confirmed', 'attended')
    """)
    user_check = db.execute(user_check_query, {
        "user_id": CURRENT_USER_ID,
        "camp_id": appointment_data.campaign_id
    }).fetchone()
    
    if user_check.existing_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ai deja o programare activă în această campanie! Te poți programa în alte campanii, dar doar o singură dată per locație."
        )
    # ------------------------------------------------------------------------

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
    
    if booked_result.booked >= campaign.capacity_per_slot:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ne pare rău, acest interval orar s-a ocupat între timp!"
        )

    # 3. INSERARE SQL
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
    
    row = result.mappings().first()
    db.commit()
    
    new_appointment = {
        "id": row["id"],
        "campaign_id": row["campaign_id"],
        "user_id": row["user_id"],
        "slot_time": row["slot_time"].strftime("%H:%M:%S") if hasattr(row["slot_time"], "strftime") else row["slot_time"],
        "status": row["status"],
        "created_at": row["created_at"]
    }
    
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

@router.get("/me", response_model=List[AppointmentOut])
def get_my_appointments(db: Session = Depends(get_db)):
    # Returnează doar programările utilizatorului logat (CURRENT_USER_ID) care nu sunt anulate
    query = text("""
        SELECT id, campaign_id, user_id, slot_time, status, created_at 
        FROM appointments 
        WHERE user_id = :user_id AND status != 'cancelled'
        ORDER BY created_at DESC
    """)
    result = db.execute(query, {"user_id": CURRENT_USER_ID}).mappings().all()
    return result

@router.get("/all", status_code=status.HTTP_200_OK)
def get_all_appointments_for_admin(db: Session = Depends(get_db)):
    # Jointură între programări, utilizatori și campanii pentru ca Adminul să vadă detalii complete
    query = text("""
        SELECT 
            a.id AS appointment_id,
            a.slot_time,
            a.status,
            u.name AS donor_name,
            u.surname AS donor_surname,
            u.phone AS donor_phone,
            c.title AS campaign_title,
            c.date AS campaign_date
        FROM appointments a
        JOIN users u ON a.user_id = u.id
        JOIN campaigns c ON a.campaign_id = c.id
        WHERE a.status != 'cancelled'
        ORDER BY c.date ASC, a.slot_time ASC
    """)
    result = db.execute(query).mappings().all()
    return result