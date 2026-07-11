from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import random
from datetime import datetime, timedelta
import os
import requests
from dotenv import load_dotenv

from database import get_db
from schemas.schemas import UserCreate, UserLogin, UserOut
from models import User
from passlib.context import CryptContext

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Stocare temporară în memoria RAM pentru codurile SMS generate
# Structură: {"07xxxxxxx": {"code": "123456", "expires_at": datetime, "verified": False}}
sms_verification_store = {}

def send_sms_via_provider(phone: str, code: str):
    load_dotenv()
    connection_id = os.getenv("SMSLINK_CONNECTION_ID")
    password = os.getenv("SMSLINK_PASSWORD")
    
    if not connection_id or not password:
        print("[CRITICAL] Cheile SMSLink lipsesc din .env sau fișierul .env nu este în folderul corect!")
        return False
        
    message = f"Codul tau de verificare pentru aplicatia Donare este: {code}. Valabil 5 minute."
    
    # Logică de curățare pentru formatul SMSLink (10 cifre)
    clean_phone = phone.replace("+", "").replace(" ", "")
    if clean_phone.startswith("407") and len(clean_phone) == 11:
        clean_phone = "0" + clean_phone[2:]
    elif clean_phone.startswith("7") and len(clean_phone) == 9:
        clean_phone = "0" + clean_phone

    url = "https://secure.smslink.ro/sms/gateway/communicate/index.php"
    params = {
        "connection_id": connection_id,
        "password": password,
        "to": clean_phone,
        "message": message
    }
    
    try:
        response = requests.get(url, params=params, timeout=5)
        # SMSLink întoarce succes dacă răspunsul conține "status=1" sau "MESSAGE;1;"
        if "status=1" in response.text or "MESSAGE;1;" in response.text:
            print(f"[SMSLink Success] Mesajul a fost transmis cu succes către {clean_phone}!")
            return True
        else:
            print(f"[SMSLink Error] SMS-ul nu a plecat. Răspuns primit: {response.text}")
            return False
    except Exception as e:
        print(f"[SMSLink Exception] Eroare de conexiune la rețea: {e}")
        return False

@router.post("/send-sms-code")
def send_sms_code(phone: str):
    if not phone or len(phone) < 9:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Număr de telefon invalid."
        )
    
    code = f"{random.randint(100000, 999999)}"
    
    sms_verification_store[phone] = {
        "code": code,
        "expires_at": datetime.now() + timedelta(minutes=5),
        "verified": False  # Inițial nu este verificat
    }
    
    send_sms_via_provider(phone, code)
    return {"detail": "Codul de verificare a fost trimis prin SMS."}

# ENDPOINT NOU: Verifică codul pe loc
@router.post("/verify-sms-code")
def verify_sms_code(phone: str, sms_code: str):
    verification_data = sms_verification_store.get(phone)
    
    if not verification_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nu s-a solicitat niciun cod pentru acest număr."
        )
        
    if datetime.now() > verification_data["expires_at"]:
        sms_verification_store.pop(phone, None)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Codul SMS a expirat. Solicită un cod nou."
        )
        
    if verification_data["code"] != sms_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Codul SMS introdus este incorect."
        )
    
    # Marcăm numărul ca verificat cu succes în memorie
    sms_verification_store[phone]["verified"] = True
    return {"detail": "Numărul de telefon a fost verificat cu succes!"}

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    phone = user_data.phone
    
    # Verificăm dacă numărul a trecut prin procesul de validare pe loc
    verification_data = sms_verification_store.get(phone)
    if not verification_data or not verification_data.get("verified"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Trebuie să vă verificați numărul de telefon prin SMS înainte de înregistrare."
        )

    # Verifică dacă email-ul există deja
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
    
    # Curățăm memoria după utilizare
    sms_verification_store.pop(phone, None)
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