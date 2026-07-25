from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


# subject schema

class SubjectCreate(BaseModel):
    name: str
    color: str = "#CC0000"

class SubjectResponse(BaseModel):
    id: int
    name: str
    color: str
    created_at: datetime

    class Config:
        from_attributes = True


# session schema
class SessionCreate(BaseModel):
    subject_id: int
    duration: int = Field(..., gt=0)
    focus_rating: int = Field(..., ge=1, le=5)
    notes: str =""
    location: str = "home"
    distractions: str = ""

class SessionResponse(BaseModel):
    id: int
    subject_id: int
    duration: int
    focus_rating: int
    notes: str
    location: str
    distractions: str
    created_at: datetime
    subject: SubjectResponse

    class Config:
        from_attributes = True


#stats schema
class TodayStats(BaseModel):
    total_minutes: int
    goal_minutes: int
    sessions_count: int
    average_focus: float

class DayBar(BaseModel):
    date: str
    total_minutes: int

class WeekStats(BaseModel):
    days: list[DayBar]
    