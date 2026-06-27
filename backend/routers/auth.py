from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db                  # <-- Schimbat din ..database în database
from schemas.schemas import UserCreate, UserLogin, UserOut  # <-- Schimbat din ..schemas în schemas.schemas
from models import User                      # <-- Schimbat din ..models în models
from passlib.context import CryptContext

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

# Configurare pentru criptarea parolelor
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # 1. Verifică dacă email-ul există deja
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Acest email este deja înregistrat."
        )
    
    # 2. Criptează parola
    hashed_password = pwd_context.hash(user_data.password)
    
    # 3. Creează instanța de utilizator (implicit va fi 'user' / 'donor')
    new_user = User(
        name=user_data.name,
        surname=user_data.surname,
        phone=user_data.phone,
        email=user_data.email,
        password_hash=hashed_password,
        blood_group=user_data.blood_group
    )
    
    # 4. Salvează în baza de date (SSMS)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.post("/login", response_model=UserOut)
def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    # 1. Caută utilizatorul după email
    user = db.query(User).filter(User.email == user_credentials.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Date de conectare invalide."
        )
    
    # 2. Verifică dacă parola se potrivește
    if not pwd_context.verify(user_credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Date de conectare invalide."
        )
    
    # NOTĂ: Aici mai târziu vom genera și returna un Token JWT securizat.
    # Momentan returnăm doar datele utilizatorului pentru test.
    return user