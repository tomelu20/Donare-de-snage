from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routers import auth, campaigns, appointments, eligibility

app = FastAPI(title="Donare Sange API")

# Configurare CORS folosind lista din setări
origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Includem routerele noastre
app.include_router(auth.router)
app.include_router(campaigns.router)
app.include_router(appointments.router)
app.include_router(eligibility.router)

@app.get("/")
def root():
    return {"message": "Sistemul de programari donare sange este activ!"}