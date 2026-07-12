import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import random
from datetime import datetime, timedelta
import os
from database import get_db
from schemas.schemas import UserCreate, UserLogin, UserOut
from models import User
from passlib.context import CryptContext

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Stocare temporară în memoria RAM pentru codurile trimise pe EMAIL[cite: 2]
email_verification_store = {}

def send_email_via_gmail(to_email: str, code: str):
    email_user = os.getenv("EMAIL_USER")
    email_password = os.getenv("EMAIL_PASSWORD")
    
    if not email_user or not email_password:
        print("[CRITICAL] Datele de logare pentru Gmail lipsesc din .env!")
        return False
        
    message = MIMEMultipart()
    message["From"] = f"Donare Sange <{email_user}>"
    message["To"] = to_email
    message["Subject"] = "Codul tau de verificare - Donare Sange"
    
    corp_email = f"""
    <html>
        <body>
            <h3>Salutare!</h3>
            <p>Codul tău de verificare pentru crearea contului în aplicația Donare Sânge este:</p>
            <h2 style="color: #e63946; font-size: 24px; letter-spacing: 2px;">{code}</h2>
            <p>Codul este valabil timp de 5 minute.</p>
        </body>
    </html>
    """
    message.attach(MIMEText(corp_email, "html"))
    
    try:
        # Ne conectăm gratuit la serverul SMTP Google securizat
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(email_user, email_password)
        server.sendmail(email_user, to_email, message.as_string())
        server.quit()
        print(f"[Email Success] Codul a fost trimis către {to_email}!")
        return True
    except Exception as e:
        print(f"[Email Exception] Eroare la trimiterea mailului: {e}")
        return False

@router.post("/send-email-code")
def send_email_code(email: str):
    if not email or "@" not in email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Adresă de email invalidă."
        )
    
    code = f"{random.randint(100000, 999999)}"
    
    email_verification_store[email] = {
        "code": code,
        "expires_at": datetime.now() + timedelta(minutes=5),
        "verified": False
    }
    
    succes = send_email_via_gmail(email, code)
    if not succes:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Nu s-a putut trimite email-ul de verificare. Reîncearcă."
        )
        
    return {"detail": "Codul de verificare a fost trimis pe email."}

@router.post("/verify-email-code")
def verify_email_code(email: str, email_code: str):
    verification_data = email_verification_store.get(email)
    
    if not verification_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nu s-a solicitat niciun cod pentru această adresă."
        )
        
    if datetime.now() > verification_data["expires_at"]:
        email_verification_store.pop(email, None)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Codul a expirat. Solicită un cod nou."
        )
        
    if verification_data["code"] != email_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Codul introdus este incorect."
        )
    
    email_verification_store[email]["verified"] = True
    return {"detail": "Adresa de email a fost verificată cu succes!"}

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    email = user_data.email
    
    # Validăm dacă emailul a trecut prin procesul de verificare
    verification_data = email_verification_store.get(email)
    if not verification_data or not verification_data.get("verified"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Trebuie să vă verificați adresa de email înainte de înregistrare."
        )

    # Verifică dacă email-ul există deja în baza de date[cite: 2]
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Acest email este deja înregistrat."
        )
    
    hashed_password = pwd_context.hash(user_data.password)
    
    new_user = User(
        name=user_data.name,
        surname=user_data.surname,
        phone=user_data.phone,
        email=user_data.email,
        password_hash=hashed_password,
        blood_group=user_data.blood_group
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    email_verification_store.pop(email, None)
    return new_user

@router.post("/login", response_model=UserOut)
def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_credentials.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Date de conectare invalide."
        )
    
    if not pwd_context.verify(user_credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Date de conectare invalide."
        )
    return user