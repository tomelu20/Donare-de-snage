from pydantic import BaseModel, EmailStr
from datetime import date, time, datetime
from typing import Optional, List

class UserCreate(BaseModel):
    name: str
    surname: str
    phone: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    name: str
    surname: str
    phone: str
    email: EmailStr
    role: str

    model_config = {"from_attributes": True}

class CampaignCreate(BaseModel):
    title: str
    location_name: str
    address: str
    date: date
    start_time: time
    end_time: time
    slot_duration: int
    capacity_per_slot: int

class CampaignOut(BaseModel):
    id: int
    title: str
    location_name: str
    address: str
    date: date
    start_time: time
    end_time: time
    slot_duration: int
    capacity_per_slot: int
    is_active: bool

    model_config = {"from_attributes": True}

class AppointmentCreate(BaseModel):
    campaign_id: int
    slot_time: time
    user_id: int

class AppointmentOut(BaseModel):
    id: int
    campaign_id: int
    user_id: int
    slot_time: time
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}

class WaitlistCreate(BaseModel):
    campaign_id: int
    user_id: int
    name: str
    surname: str
    phone: str
    email: EmailStr
    preferred_time_range: str
    travel_time_minutes: int

class WaitlistOut(BaseModel):
    id: int
    campaign_id: int
    user_id: int
    name: str
    surname: str
    phone: str
    email: EmailStr
    preferred_time_range: str
    travel_time_minutes: int
    status: str

    model_config = {"from_attributes": True}

class QuestionOut(BaseModel):
    id: int
    question_text: str
    type: str
    is_required: Optional[bool] = True
    is_active: Optional[bool] = True

    model_config = {"from_attributes": True}

class AnswerSubmit(BaseModel):
    question_id: int
    answer_text: str

class AppointmentWithAnswersCreate(BaseModel):
    appointment: AppointmentCreate
    answers: List[AnswerSubmit]

class SlotOut(BaseModel):
    time: str
    available_slots: int
    is_available: bool