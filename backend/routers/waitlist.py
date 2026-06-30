from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from schemas.schemas import WaitlistCreate, WaitlistOut

router = APIRouter(
    prefix="/waitlist",
    tags=["Waitlist"]
)

@router.post("/", response_model=WaitlistOut, status_code=status.HTTP_201_CREATED)
def add_to_waitlist(waitlist_data: WaitlistCreate, db: Session = Depends(get_db)):
    # Inserare SQL nativă în tabela 'waitlist' conform structurii din tables.sql
    insert_query = text("""
        INSERT INTO waitlist (campaign_id, user_id, name, surname, phone, email, preferred_time_range, travel_time_minutes, status)
        OUTPUT INSERTED.id, INSERTED.campaign_id, INSERTED.user_id, INSERTED.name, INSERTED.surname, INSERTED.phone, INSERTED.email, INSERTED.preferred_time_range, INSERTED.travel_time_minutes, INSERTED.status
        VALUES (:campaign_id, :user_id, :name, :surname, :phone, :email, :preferred_time_range, :travel_time_minutes, 'waiting')
    """)
    
    try:
        result = db.execute(insert_query, {
            "campaign_id": waitlist_data.campaign_id,
            "user_id": waitlist_data.user_id,
            "name": waitlist_data.name,
            "surname": waitlist_data.surname,
            "phone": waitlist_data.phone,
            "email": waitlist_data.email,
            "preferred_time_range": waitlist_data.preferred_time_range,
            "travel_time_minutes": waitlist_data.travel_time_minutes
        })
        
        row = result.mappings().first()
        db.commit()
        return row
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Eroare la salvarea în baza de date: {str(e)}"
        )