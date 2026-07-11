from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import random
from datetime import datetime, timedelta
import os
import requests
from dotenv import load_dotenv  # <-- Importat pentru a asigura citirea corectă a fișierului .env

from database import get_db                  # <-- Schimbat din ..database în database[cite: 2]
from schemas.schemas import UserCreate, UserLogin, UserOut  # <-- Schimbat din ..schemas în schemas.schemas[cite: 2]
from models import User                      # <-- Schimbat din ..models în models[cite: 2]
from passlib.context import CryptContext

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

# Configurare pentru criptarea parolelor[cite: 2]
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Stocare temporară în memoria RAM pentru codurile SMS generate
# Structură: {"+407xxxxxxx": {"code": "123456", "expires_at": datetime}}
sms_verification_store = {}

def send_sms_via_provider(phone: str, code: str):
    # Forțăm reîncărcarea fișierului .env localizat în rădăcina proiectului backend
    load_dotenv()
    
    connection_id = os.getenv("SMSLINK_CONNECTION_ID")
    password = os.getenv("SMSLINK_PASSWORD")
    
    if not connection_id or not password:
        print("[CRITICAL] Cheile SMSLink lipsesc din .env sau fișierul .env nu este în folderul corect!")
        return False
        
    message = f"Codul tau de verificare pentru aplicatia de Donare de sange este: {code}. Valabil 5 minute."
    
    # --- LOGICĂ DE CURĂȚARE PENTRU FORMATUL SMSLINK (10 CIFRE) ---
    # 1. Eliminăm spațiile sau caracterul '+' dacă există
    clean_phone = phone.replace("+", "").replace(" ", "")
    
    # 2. Dacă numărul începe cu prefixul țării '407', tăiem '40' și adăugăm '0' ca să devină '07...'
    if clean_phone.startswith("407") and len(clean_phone) == 11:
        clean_phone = "0" + clean_phone[2:]
    # 3. Dacă numărul începe direct cu '7' (fără 0 sau +40), îi punem un '0' în față
    elif clean_phone.startswith("7") and len(clean_phone) == 9:
        clean_phone = "0" + clean_phone

    print(f"\n[DEBUG SMSLink] Număr formatat trimis la gateway: '{clean_phone}' (Lungime: {len(clean_phone)} cifre)")
    
    url = "https://secure.smslink.ro/sms/gateway/communicate/index.php"
    params = {
        "connection_id": connection_id,
        "password": password,
        "to": clean_phone,
        "message": message
    }
    
    try:
        response = requests.get(url, params=params, timeout=5)
        if "status=1" in response.text:
            print(f"[SMSLink Success] Mesajul a fost transmis către {clean_phone}.")
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
    
    # Generăm un cod unic din 6 cifre
    code = f"{random.randint(100000, 999999)}"
    
    # Salvăm codul cu o durată de viață de 5 minute
    sms_verification_store[phone] = {
        "code": code,
        "expires_at": datetime.now() + timedelta(minutes=5)
    }
    
    # Apelăm funcția de trimitere reală
    send_sms_via_provider(phone, code)
    
    return {"detail": "Codul de verificare a fost trimis prin SMS."}

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    phone = user_data.phone
    
    # 1. Verifică codul SMS înainte de orice altă operațiune
    verification_data = sms_verification_store.get(phone)
    
    if not verification_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nu s-a solicitat niciun cod pentru acest număr."
        )
        
    if datetime.now() > verification_data["expires_at"]:
        sms_verification_store.pop(phone, None)  # Curățăm memoria
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Codul SMS a expirat. Solicită un cod nou."
        )
        
    if verification_data["code"] != user_data.sms_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Codul SMS introdus este incorect."
        )

    # 2. Verifică dacă email-ul există deja
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Acest email este deja înregistrat."
        )
    
    # 3. Criptează parola
    hashed_password = pwd_context.hash(user_data.password)
    
    # 4. Creează instanța de utilizator
    new_user = User(
        name=user_data.name,
        surname=user_data.surname,
        phone=user_data.phone,
        email=user_data.email,
        password_hash=hashed_password,
        blood_group=user_data.blood_group
    )
    
    # 5. Salvează în baza de date (SSMS)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Ștergem codul utilizat cu succes din memorie
    sms_verification_store.pop(phone, None)
    
    return new_user