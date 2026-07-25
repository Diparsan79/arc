from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base

Base.metadata.create_all(bind=engine)

app=FastAPI(title="SAGE", description="small reference to THE BOYS (sister sage)")

app.add_middleware(
    CORSMiddleware,
    allow_origins =["*"],
    allow_methods =["*"],
    allow_headers =["*"],
)


@app.get("/")
def root():
    return {"message": "SAGE API is running smoot"}