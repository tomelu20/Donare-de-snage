from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func  # <--- Adăugat pentru normalizarea căutării
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from database import get_db
from models import Appointment, User, Campaign

router = APIRouter(
    prefix="/reminders",
    tags=["Reminders"]
)

def send_reminder_email_task(email: str, name: str, campaign_title: str, location: str, date_str: str, time_str: str):
    email_user = os.getenv("EMAIL_USER")
    email_password = os.getenv("EMAIL_PASSWORD")
    
    if not email_user or not email_password:
        print("[CRITICAL] Datele de logare pentru Gmail lipsesc din .env!")
        return
        
    message = MIMEMultipart()
    message["From"] = f"Donare Sange <{email_user}>"
    message["To"] = email
    message["Subject"] = f"🔔 Reminder: Programare Donare Sânge - {campaign_title}"
    
    corp_email = f"""
    <html>
        <body style="font-family: sans-serif; color: #333; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e1e4e8; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #e63946; color: white; padding: 20px; text-align: center;">
                    <h2 style="margin: 0;">Reminder Programare Donare</h2>
                </div>
                <div style="padding: 25px; background-color: #ffffff;">
                    <h3>Salutare, {name}!</h3>
                    <p>Îți mulțumim din suflet că ai ales să fii erou și să salvezi vieți! Îți reamintim că ai o programare activă în cadrul campaniei <strong>{campaign_title}</strong>.</p>
                    
                    <div style="background-color: #f8f9fa; border-left: 4px solid #e63946; padding: 15px; margin: 20px 0; border-radius: 4px;">
                        <p style="margin: 0 0 8px 0;">📍 <strong>Locație:</strong> {location}</p>
                        <p style="margin: 0 0 8px 0;">📅 <strong>Data:</strong> {date_str}</p>
                        <p style="margin: 0;">🕒 <strong>Interval orar:</strong> {time_str}</p>
                    </div>
                    
                    <p>Te rugăm să te prezinți cu 10-15 minute înainte de ora stabilită și să ai la tine un act de identitate valabil. Nu uita să te hidratezi bine înainte și să mănânci un mic dejun ușor (fără grăsimi)!</p>
                    
                    <p style="margin-top: 30px; font-size: 13px; color: #666; text-align: center; border-top: 1px solid #eee; padding-top: 15px;">
                        Dacă nu mai poți ajunge, te rugăm să anulezi programarea din dashboard pentru a elibera locul altui donator.
                    </p>
                </div>
            </div>
        </body>
    </html>
    """
    message.attach(MIMEText(corp_email, "html"))
    
    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(email_user, email_password)
        server.sendmail(email_user, email, message.as_string())
        server.quit()
        print(f"[Reminder Success] Email trimis către {email}")
    except Exception as e:
        print(f"[Reminder Exception] Eroare la trimiterea mailului către {email}: {e}")

@router.post("/campaign/{campaign_id}")
def send_campaign_reminders(
    campaign_id: int, 
    background_tasks: BackgroundTasks, 
    current_user_id: int,
    db: Session = Depends(get_db)
):
    # 1. Verificare drepturi Admin
    admin_user = db.query(User).filter(User.id == current_user_id).first()
    if not admin_user or admin_user.role.lower() != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doar administratorii pot trimite remaindere."
        )
        
    # 2. Verificare existență campanie
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campania nu a fost găsită.")
        
    # 3. Soluție Anti-Duplicare: Convertim statusul la litere mici direct în interogare SQL
    # Astfel, indiferent de setarea bazei de date, se va face o singură verificare strictă
    active_appointments = db.query(
    Appointment.user_id,
    Appointment.slot_time,
    Appointment.appointment_date
    ).filter(
    Appointment.campaign_id == campaign_id,
    func.lower(Appointment.status) == "confirmed",
    Appointment.is_for_someone_else == False  # <--- ADĂUGĂ LINIA ASTA AICI
    ).all()
    
    if not active_appointments:
        raise HTTPException(status_code=400, detail="Nu există programări active (confirmate) pentru această campanie.")
        
    # 4. Trimitere asincronă în background
    sent_count = 0
    for app_user_id, app_slot_time, app_appointment_date in active_appointments:
        donor = db.query(User).filter(User.id == app_user_id).first()
        if donor and donor.email:
            date_label = app_appointment_date.strftime('%d-%m-%Y') if app_appointment_date else campaign.date.strftime('%d-%m-%Y')
            time_label = str(app_slot_time)[:5]
            
            background_tasks.add_task(
                send_reminder_email_task,
                email=donor.email,
                name=f"{donor.name} {donor.surname}",
                campaign_title=campaign.title,
                location=f"{campaign.location_name} ({campaign.address})",
                date_str=date_label,
                time_str=time_label
            )
            sent_count += 1
            
    return {"detail": f"S-a pornit trimiterea în fundal a reminderelor către {sent_count} donatori."}