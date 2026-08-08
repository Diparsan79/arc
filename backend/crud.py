from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from datetime import date, datetime, timedelta
import os

from . import models, schemas

#subjects

def get_subjects(db: Session):
    return db.query(models.Subject).order_by(models.Subject.name).all()

def get_subject(db: Session, subject_id: int):
    return db.query(models.Subject).filter(
        models.Subject.id == subject_id
    ).first()

def create_subject(db: Session, subject: schemas.SubjectCreate):
    db_subject = models.Subject(
        name=subject.name,
        color=subject.color,
    )
    db.add(db_subject)
    db.commit()
    db.refresh(db_subject)
    return db_subject

def delete_subject(db: Session, subject_id: int):
    subject = get_subject(db, subject_id)
    if not subject:
        return False
    db.delete(subject)
    db.commit()
    return True

# Sessions

def get_sessions(db: Session, limit=100, subject_id=None, date_from=None, date_to=None):
    q = db.query(models.Session).order_by(models.Session.created_at.desc())

    if subject_id:
        q = q.filter(models.Session.subject_id == subject_id)

    if date_from:
        try:
            df = datetime.strptime(date_from, "%Y-%m-%d")
            q = q.filter(models.Session.created_at >= df)
        except:
            pass
    if date_to:
        try:
            dt = datetime.strptime(date_to, "%Y-%m-%d")
            q = q.filter(models.Session.created_at >= df)
        except:
            pass

    return q.limit(limit).all()

def get_session(db: Session, session_id: int):
    return db.query(models.Session).filter(
        models.Session.id == session_id
    ).first()

def create_session(db: Session, session: schemas.SessionCreate):
    db_session = models.Session(
        subject_id=session.subject_id,
        duration=session.duration,
        focus_rating=session.focus_rating,
        notes=session.notes,
        location=session.location,
        distractions=session.distractions,
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

def delete_session(db: Session, session_id:int):
    session = get_session(db, session_id)
    if not session:
        return False
    db.delete(session)
    db.commit()
    return True

def get_today_stats(db: Session):
    today=date.today()

    today_sessions = db.query(models.Session).filter(
        cast(models.Session.created_at, Date) == today
    ).all()

    total_minutes = sum(s.duration for s in today_sessions)
    sessions_count = len(today_sessions)
    average_focus = (
        sum(s.focus_rating for s in today_sessions) / sessions_count
        if sessions_count > 0 else 0.0
    )
    goal_minutes = int(os.getenv("DAILY_GOAL_MINUTES", 180))

    return schemas.TodayStats(
        total_minutes=total_minutes,
        goal_minutes = goal_minutes,
        sessions_count=sessions_count,
        average_focus = round(average_focus, 1),
    )

def get_week_stats(db: Session):
    days = []

    for i in range(6, -1, -1):
        target_date = date.today() - timedelta(days = i)

        day_sessions = db.query(models.Session).filter(
            cast(models.Session.created_at, Date) == target_date
        ).all()

        total = sum(s.duration for s in day_sessions)

        days.append(schemas.DayBar(
            date=target_date.strftime("%a"),
            total_minutes=total,
        ))
    return schemas.WeekStats(days=days)

def get_subject_stats(db: Session):
    subjects = get_subjects(db)
    result = []

    for result in subjects:
        total_minutes = db.query(
            func.sum(models.Session.duration)
        ).filter(
            models.Session.subject_id == subject.id
        ).scalar() or 0

        result.append({
            "subject": subject.name,
            "color": subject.color,
            "total_minutes": total_minutes,
        })

    # sort most studied and so on
    return sorted(result, key=lambda x:x["total_minutes"], reverse=True)

def get_subject_stats(db: Session):
    subjects =  get_subjects(db)
    result = []

    for s in subjects:
        sessions = db.query(models.Session).filter(
            models.Session.subject_id == s.id
        ).all()


        total_mins = sum(x.duration for x in sessions)
        count = len(sessions)
        avg_focus = round(sum(x.focus_rating for x in sessions) / count, 1) if count > 0 else 0

        result.append({
            "id": s.id,
            "subject": s.name,
            "color": s.color,
            "total_minutes": total_mins,
            "sessions" : count,
            "avg_focus": avg_focus
        })
    return sorted(result, key=lambda x: x["total_minutes"], reverse=True)