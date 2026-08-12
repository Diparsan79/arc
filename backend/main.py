from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import Optional

from .database import engine, Base, get_db
from . import crud, schemas, models

Base.metadata.create_all(bind=engine)

app=FastAPI(title="SAGE", description="small reference to THE BOYS (sister sage)")

app.add_middleware(
    CORSMiddleware,
    allow_origins =["*"],
    allow_methods =["*"],
    allow_headers =["*"],
)

# ROOT
@app.get("/")
def root():
    return {"message": "SAGE API is running smoot"}

# subjects

@app.get("/subjects", response_model=list[schemas.SubjectResponse])
def list_subjects(db: Session= Depends(get_db)):
    return crud.get_subjects(db)

@app.post("/subjects", response_model=schemas.SubjectResponse)
def create_subject(subject: schemas.SubjectCreate, db: Session = Depends(get_db)):
    return crud.create_subject(db, subject)

@app.delete("/subjects/{subject_id}")
def delete_subject(subject_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_subject(db, subject_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Subject not found")
    return {"message": "deleted"}

#sessions

@app.get("/sessions", response_model=list[schemas.SessionResponse])
def list_sessions(
    subject_id: Optional[int] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return crud.get_sessions(db, subject_id=subject_id, date_from=date_from, date_to=date_to)

@app.post("/sessions", response_model=schemas.SessionResponse)
def create_session(session: schemas.SessionCreate, db: Session = Depends(get_db)):
    subject = crud.get_subject(db, session.subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return crud.create_session(db, session)

@app.delete("/sessions/{session_id}")
def delete_session(session_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_session(db, session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "deleted"}

# stats
@app.get("/stats/today", response_model=schemas.TodayStats)
def today_stats(db: Session = Depends(get_db)):
    return crud.get_today_stats(db)

@app.get("/stats/week", response_model=schemas.WeekStats)
def week_stats(db: Session = Depends(get_db)):
    return crud.get_week_stats(db)

@app.get("/stats/subjects")
def subject_stats(db: Session = Depends(get_db)):
    return crud.get_subject_stats(db)

@app.get("/stats/insights")
def insights(db: Session = Depends(get_db)):
    data = crud.get_insights(db)
    if not data:
        return {"empty": True}
    return data

# grades
@app.get("/grades", response_model=list[schemas.GradeResponse])
def list_grades(subject_id: Optional[int] = None, db: Session = Depends(get_db)):
    return crud.get_grades(db, subject_id=subject_id)

@app.post("/grades", response_model=schemas.GradeResponse)
def create_grade(grade: schemas.gradeCreate, db: Session = Depends(get_db)):
    subject = crud.get_subject(db, grade.subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return crud.create_grade(db, grade)

@app.delete("/grades/{grade_id}")
def delete_grade(grade_id: int, db: Session = Depends(get_db)):
    if not crud.delete_grade(db, grade_id):
        raise HTTPException(status_code=404, details="Grade not found")
    return {"message": "deleted"}

@app.get("/stats/correlation")
def grade_correlation(db: Session = Depends(get_db)):
    return crud.get_grade_correlation(db)

# exams
@app.get("/exams")
def list_exams(db, Session = Depends(get_db)):
    return crud.get_upcoming_exams(db)

@app.post("/exams", response_model=schemas.ExamResponse)
def create_exam(exam: schemas.ExamCreate, db: Session = Depends(get_db)):
    subject = crud.get_subject(db, exam.subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return crud.create_exam(db, exam)

@app.delete("/exams/{exam_id}")
def delete_exam(exam_id: int, db: Session = Depends(get_db)):
    if not crud.delete_exam(db, exam_id):
        raise HTTPException(status_code=404, detail="exam not found")
    return {"message": "deleted"}

app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")