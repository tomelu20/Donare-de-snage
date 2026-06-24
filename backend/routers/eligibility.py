from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List

from database import get_db
from schemas.schemas import QuestionOut, AppointmentWithAnswersCreate, AppointmentOut

router = APIRouter(
    prefix="/eligibility",
    tags=["Eligibility Questionnaire"]
)

# 1. GET: Trimite întrebările către frontend pentru a genera formularul
@router.get("/questions", response_model=List[QuestionOut])
def get_questions(db: Session = Depends(get_db)):
    query = text("""
        SELECT id, question_text, type, is_required, is_active 
        FROM eligibility_questions 
        WHERE is_active = 1
    """)
    result = db.execute(query).fetchall()
    return result


# 2. POST: Salvează programarea ȘI răspunsurile la chestionar dintr-un singur foc
@router.post("/submit", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
def submit_appointment_with_answers(
    payload: AppointmentWithAnswersCreate, 
    db: Session = Depends(get_db)
):
    # Folosim un user_id fix (1) pentru MVP, la fel ca la appointments
    CURRENT_USER_ID = 1
    
    # --- ETAPA A: Verificăm capacitatea slotului (la fel ca la pasul 2) ---
    campaign_query = text("SELECT capacity_per_slot, is_active FROM campaigns WHERE id = :camp_id")
    campaign = db.execute(campaign_query, {"camp_id": payload.appointment.campaign_id}).fetchone()
    
    if not campaign or not campaign.is_active:
        raise HTTPException(status_code=400, detail="Campania nu este disponibilă.")

    count_query = text("""
        SELECT COUNT(id) AS booked FROM appointments 
        WHERE campaign_id = :camp_id AND slot_time = :slot_time AND status != 'cancelled'
    """)
    booked_result = db.execute(count_query, {
        "camp_id": payload.appointment.campaign_id,
        "slot_time": payload.appointment.slot_time
    }).fetchone()
    
    if booked_result.booked >= campaign.capacity_per_slot:
        raise HTTPException(status_code=400, detail="Slotul s-a ocupat între timp.")

    # --- ETAPA B: Inserăm programarea și obținem ID-ul ei ---
    insert_app_query = text("""
        INSERT INTO appointments (campaign_id, user_id, slot_time, status, created_at)
        OUTPUT INSERTED.id, INSERTED.campaign_id, INSERTED.user_id, INSERTED.slot_time, INSERTED.status, INSERTED.created_at
        VALUES (:camp_id, :user_id, :slot_time, 'confirmed', GETDATE())
    """)
    
    app_result = db.execute(insert_app_query, {
        "camp_id": payload.appointment.campaign_id,
        "user_id": CURRENT_USER_ID,
        "slot_time": payload.appointment.slot_time
    })
    
    new_appointment = app_result.fetchone()
    appointment_id = new_appointment.id

    # --- ETAPA C: Inserăm automat toate răspunsurile în baza de date ---
    insert_answer_query = text("""
        INSERT INTO eligibility_answers (appointment_id, question_id, answer_text)
        VALUES (:app_id, :quest_id, :ans_text)
    """)
    
    for answer in payload.answers:
        db.execute(insert_answer_query, {
            "app_id": appointment_id,
            "quest_id": answer.question_id,
            "ans_text": answer.answer_text
        })
    
    # Salvăm totul în SSMS (atât programarea, cât și răspunsurile)
    db.commit()
    
    return new_appointment