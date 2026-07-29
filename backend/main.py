from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

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
def list_sessions(db: Session = Depends(get_db)):
    return crud.get_sessions(db)

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

app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")