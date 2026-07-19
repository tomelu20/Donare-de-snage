from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from google import genai
from google.genai import types
import os
from sqlalchemy.orm import Session
from datetime import date

# Importurile tale existente pentru DB și Config
from config import settings 
from database import get_db  # Asigură-te că folosești funcția ta corectă pentru yield session
from models import Campaign  # Modelul tău SQLAlchemy

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
def chat_with_assistant(payload: ChatMessage, db: Session = Depends(get_db)):
    if not client:
        return {
            "reply": "Asistentul AI este momentan dezactivat. Verificați variabila GEMINI_API_KEY din fișierul .env."
        }

    # 1. Definim funcția locală pe care AI-ul o poate rula pentru a citi DOAR campaniile active
    def get_active_campaigns() -> str:
        """
        Aduce toate campaniile de donare de sânge active din baza de date. 
        Returnează detalii precum titlul, locația, adresa, data și programul.
        """
        # Interogăm doar tabelul de campanii, ignorând complet utilizatorii sau programările
        campaigns = db.query(Campaign).filter(Campaign.is_active == True).all()
        
        if not campaigns:
            return "În acest moment nu există campanii active de donare de sânge programate."

        result = "Campanii active disponibile:\n"
        for c in campaigns:
            result += (
                f"- **{c.title}**\n"
                f"  Locație: {c.location_name} ({c.address})\n"
                f"  Perioadă: {c.date} până la {c.end_date if c.end_date else c.date}\n"
                f"  Program: {c.start_time} - {c.end_time}\n\n"
            )
        return result

    try:
        # 2. Mapăm funcția într-un dicționar pentru executare manuală facilă
        available_tools = {
            "get_active_campaigns": get_active_campaigns
        }

        # 3. Trimitem cererea inițială către Gemini, oferindu-i funcția ca unealtă (Tool)
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=payload.message,
            config=types.GenerateContentConfig(
                max_output_tokens=1000,
                temperature=0.4,
                system_instruction=(
                    "Ești asistentul virtual inteligent numit 'Don AI' integrat în Platforma Digitală de Donare Sânge.\n"
                    "Misiunea ta este să ajuți donatorii cu informații calde, sigure, precise și optimiste despre proces.\n"
                    "Ai acces la o unealtă numită `get_active_campaigns`. Folosește-o OBLIGATORIU de fiecare dată când utilizatorul "
                    "întreabă despre campanii active, locații unde poate dona sau unde sunt organizate caravane în acest moment.\n"
                    "IMPORTANT: Nu ai acces la datele participanților sau la conturile lor dintr-un motiv de securitate.\n"
                    "Reguli de bază privind donarea pe care trebuie să le cunoști și să le reamintești când ești întrebat:\n"
                    "- Vârsta acceptată: între 18 și 60 de ani.\n"
                    "- Greutate minimă: 50 kg atât pentru femei, cât și pentru bărbați.\n"
                    "- Tensiunea arterială trebuie să fie stabilă.\n"
                    "- Fără consum de alcool cu 48 de ore înainte de donare!\n"
                    "- Micul dejun din dimineața donării trebuie să fie ușor (fără grăsimi, fără lactate grele), dar obligatoriu!\n"
                    "- Hidratarea este esențială: recomandă-le să bea apă sau ceai înainte. Fără cafea chiar înainte de donare.\n"
                    "Dacă utilizatorul întreabă probleme tehnice despre contul lui, erori sau dorește modificări administrative complexe, "
                    "îndrumă-l politicos să folosească butoanele din Dashboard sau să contacteze echipa de suport / Administratorul.\n"
                    "Răspunde exclusiv în limba română, folosește un ton empatic și profesionist. Păstrează răspunsurile concise și ușor de citit."
                ),
                tools=[get_active_campaigns]  # Îi dăm acces la definiția funcției
            )
        )

        # 4. Verificăm dacă modelul a decis că are nevoie să apeleze funcția noastră
        if response.function_calls:
            function_responses = []
            
            for function_call in response.function_calls:
                name = function_call.name
                args = function_call.args
                
                if name in available_tools:
                    # Executăm funcția python care extrage datele curate din DB[cite: 10]
                    tool_result = available_tools[name](**args)
                    
                    # Trimitem rezultatul înapoi în istoricul conversației pentru ca AI-ul să formuleze răspunsul final
                    function_responses.append(
                        types.Part.from_function_response(
                            name=name,
                            response={'result': tool_result}
                        )
                    )
            
            # Trimitem datele reale înapoi la Gemini pentru generarea textului final, prietenos
            final_response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=[
                    types.Part.from_text(text=payload.message),
                    *response.candidates[0].content.parts, # Apelul inițial generat de model
                    *function_responses # Rezultatul adus din baza de date
                ]
            )
            return {"reply": final_response.text}

        # Dacă utilizatorul a pus o întrebare generală (ex: "Cât trebuie să am în greutate?"), răspunde direct[cite: 1]
        return {"reply": response.text}
        
    except Exception as e:
        print(f"\n!!! EROARE GEMINI DETALIATĂ: {str(e)}\n")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Eroare la comunicarea cu motorul LLM: {str(e)}"
        )