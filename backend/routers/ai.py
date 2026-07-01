from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from google import genai
from google.genai import types
import os

# Importăm setările centralizate din aplicația ta
from config import settings 

router = APIRouter(
    prefix="/ai",
    tags=["AI Assistant"]
)

class ChatMessage(BaseModel):
    message: str

# Preluăm cheia din obiectul tău de setări
gemini_key = settings.GEMINI_API_KEY if hasattr(settings, "GEMINI_API_KEY") else os.getenv("GEMINI_API_KEY", "")
gemini_key = gemini_key.strip() if gemini_key else ""

# Inițializăm clientul nou dacă există cheia
client = genai.Client(api_key=gemini_key) if gemini_key else None

@router.post("/chat", status_code=status.HTTP_200_OK)
def chat_with_assistant(payload: ChatMessage):
    if not client:
        return {
            "reply": "Asistentul AI este momentan dezactivat. Verificați variabila GEMINI_API_KEY din fișierul .env."
        }

    try:
        # Folosim noul client și modelul gemini-2.5-flash (sau gemini-1.5-flash)
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=payload.message,
            config=types.GenerateContentConfig(
                max_output_tokens=400,
                temperature=0.6,
                system_instruction=(
                    "Ești asistentul virtual inteligent numit 'G4 AI' integrat în Platforma Digitală de Donare Sânge. "
                    "Misiunea ta este să ajuți donatorii cu informații calde, sigure, precise și optimiste despre proces. "
                    "Reguli de bază privind donarea pe care trebuie să le cunoști și să le reamintești când ești întrebat: "
                    "- Vârsta acceptată: între 18 și 60 de ani. "
                    "- Greutate minimă: 50 kg atât pentru femei, cât și pentru bărbați. "
                    "- Tensiunea arterială trebuie să fie stabilă. "
                    "- Fără consum de alcool cu 48 de ore înainte de donare! "
                    "- Micul dejun din dimineața donării trebuie să fie ușor (fără grăsimi, fără lactate grele), dar obligatoriu! "
                    "- Hidratarea este esențială: recomandă-le să bea apă sau ceai înainte. Fără cafea chiar înainte de donare. "
                    "Dacă utilizatorul întreabă probleme tehnice despre contul lui, erori sau dorește modificări administrative complexe, "
                    "îndrumă-l politicos să folosească butoanele din Dashboard sau să contacteze echipa de suport / Administratorul. "
                    "Răspunde exclusiv în limba română, folosește un ton empatic și profesionist. Păstrează răspunsurile concise și ușor de citit."
                )
            )
        )
        
        return {"reply": response.text}
        
    except Exception as e:
        print(f"\n!!! EROARE GEMINI DETALIATĂ: {str(e)}\n")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Eroare la comunicarea cu motorul LLM: {str(e)}"
        )