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


class GradeCreate(BaseModel):
    subject_id: int
    score: int = Field(..., ge=0)
    max_score: int = Field(..., gt=0)
    exam_type: str ="test"
    label: str = ""
    exam_date: str

class GradeResponse(BaseModel):
    id: int
    subject_id: int
    score: int
    max_score: int
    exam_type: str
    label: str
    exam_date: datetime
    created_at: datetime
    subject: SubjectResponse

    class Config:
        from_attributes = True


# exam schemas

class ExamCreate(BaseModel):
    subject_id: int
    label: str
    exam_date: str

class ExamResponse(BaseModel):
    id: int
    subject_id: int
    label: str
    exam_date: datetime
    created_at: datetime
    subject: SubjectResponse

    class Config:
        from_attributes = True

# timer schemas

class TimerStart(BaseModel):
    subject_id: int
    timestamp_ms: int

class TimerAction(BaseModel):
    timestamp_ms: int

class TimerResponse(BaseModel):
    id: int
    subject_id: int
    start_time_ms: int
    total_paused_ms: int
    last_pause_time_ms: Optional[int]
    is_paused: int

    class Config:
        from_attributes = True