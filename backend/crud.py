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
            q = q.filter(models.Session.created_at <= dt)
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

def get_insights(db: Session):
    from collections import Counter

    sessions = db.query(models.Session).order_by(
        models.Session.created_at.asc()
    ).all()

    if not sessions:
        return None

    time_buckets = {
        "morning": {"sessions": [], "label": "6am - 12pm"},
        "afternoon": {"sessions": [], "label": "12pm - 6pm"},
        "evening": {"sessions": [], "label": "6pm - 10pm"},
        "night": {"sessions": [], "label": "10pm - 2am"},
    }

    for s in sessions:
        hr = s.created_at.hour
        if 6 <= hr < 12: time_buckets["morning"]["sessions"].append(s)
        elif 12 <= hr < 18: time_buckets["afternoon"]["sessions"].append(s)
        elif 18 <= hr < 22: time_buckets["evening"]["sessions"].append(s)
        else: time_buckets["night"]["sessions"].append(s)

    best_time = None
    best_focus = 0
    time_breakdown = []

    for period, bucket in time_buckets.items():
        ss = bucket["sessions"]
        cnt = len(ss)
        avg = round(sum(x.focus_rating for x in ss) / cnt,1) if cnt > 0 else 0

        time_breakdown.append({
            "period": period,
            "label": bucket["label"],
            "sessions": cnt,
            "avg_focus": avg,
        })

        if avg > best_focus and cnt > 0:
            best_focus = avg
            best_time = period
# streajks

    study_dates = set()
    for s in sessions:
        study_dates.add(s.created_at.date())

    today = date.today()
    streak = 0
    current = today

    while current in study_dates:
        streak += 1
        current -=timedelta(days=1)

    sorted_dates = sorted(study_dates)
    longest = 1
    running = 1

    for i in range(1, len(sorted_dates)):
        diff = (sorted_dates[1] - sorted_dates[i-1]).days
        if diff == 1:
            running += 1
            longest = max(longest, running)
        else:
            running = 1
# distractions
    all_distractions = []
    for s in sessions:
        if s.distractions and s.distractions.strip():
            parts = [d.strip().lower() for d in s.distractions.split(",") if d.strip()]
            all_distractions.extend(parts)

    distraction_counts = Counter(all_distractions).most_common(5)


# focus trend
    mid = len(sessions) // 2
    early = sessions[:mid]
    late = sessions[mid:]

    early_avg = round(sum(s.focus_rating for s in early) / len(early), 1) if early else 0
    late_avg = round(sum(s.focus_rating for s in late) / len(late), 1) if late else 0
    trend = round(late_avg - early_avg, 1)

    subjects = db.query(models.Subject).all()
    subject_counts = Counter(s.subject_id for s in sessions)

    avoided = None
    min_count = float("inf")

    for subj in subjects:
        cnt = subject_counts.get(subj.id, 0)
        if cnt < min_count:
            min_count = cnt
            avoided = subj.name


    total_days = max(1, (today - sorted_dates[0]).days + 1) if sorted_dates else 1
    total_weeks = max(1, total_days / 7)
    total_mins = sum(s.duration for s in sessions)
    weekly_avg = round(total_mins / total_weeks)

    return {
        "best_time": best_time,
        "time_breakdown": time_breakdown,
        "streak": streak,
        "longest_streak": longest,
        "distractions": distraction_counts,
        "focus_trend": trend,
        "early_avg_focus": early_avg,
        "late_avg_focus": late_avg,
        "avoided_subject": avoided,
        "weekly_avg_minutes": weekly_avg,
        "total_sessions": len(sessions)
    }

#grades
def get_grades(db: Session, subject_id=None):
    q = db.query(models.Grade).order_by(models.Grade.exam_date.desc())
    if subject_id:
        q = q.filter(models.Grade.subject_id == subject_id)
    return q.all()

def create_grade(db: Session, grade: schemas.GradeCreate):
    from datetime import datetime
    db_grade = models.Grade(
        subject_id = grade.subject_id,
        score = grade.score,
        max_score = grade.max_score,
        exam_type = grade.exam_type,
        label = grade.label,
        exam_date = datetime.strptime(grade.exam_date, "%Y-%m-%d"),
    )
    db.add(db_grade)
    db.commit()
    db.refresh(db_grade)
    return db_grade

def delete_grade(db: Session, grade_id: int):
    g = db.query(models.Grade).filter(models.Grade.id == grade_id).first()
    if not g:
        return False
    db.delete(g)
    db.commit()
    return True

def get_grade_correlation(db: Session):
    grades = db.query(models.Grade).order_by(models.Grade.exam_date).all()
    result = []

    for g in grades:
        exam_date = g.exam_date.date()
        two_weeks_before = exam_date - timedelta(days=14)

        study_sessions = db.query(models.Session).filter(
            models.Session.subject_id == g.subject_id,
            cast(models.Session.created_at, Date) >= two_weeks_before,
            cast(models.Session.created_at, Date) < exam_date,
        ).all()

        study_mins = sum(s.duration for s in study_sessions)
        pct = round((g.score / g.max_score) * 100, 1)

        result.append({
            "subject": g.subject.name,
            "color": g.subject.color,
            "label": g.label or g.exam_type,
            "score_pct": pct,
            "study_hours": round(study_mins/ 60 , 1),
            "exam_date": exam_date.isoformat(),
        })

    return result

# exams

def get_upcoming_exams(db: Session):
    today = date.today()
    exams = db.query(models.Exam).filter(
        cast(models.Exam.exam_date, Date) >= today
    ).order_by(models.Exam.exam_date).all()

    result = []
    for e in exams:
        days_left = (e.exam_date.date() - today).days
        result.append({
            "id": e.id,
            "subject": e.subject.name,
            "color": e.subject.color,
            "label": e.label,
            "exam_date": e.exam_date.date().isoformat(),
            "days_left": days_left,
        })

    return result

def create_exam(db: Session, exam: schemas.ExamCreate):
    from datetime import datetime
    db_exam = models.Exam(
        subject_id = exam.subject_id,
        label = exam.label,
        exam_date = datetime.strptime(exam.exam_date, "%Y-%m-%d"),
    )
    db.add(db_exam)
    db.commit()
    db.refresh(db_exam)
    return db_exam

def delete_exam(db: Session, exam_id: int):
    e = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not e:
        return False
    db.delete(e)
    db.commit()
    return True