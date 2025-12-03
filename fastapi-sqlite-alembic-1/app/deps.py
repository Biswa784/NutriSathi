from sqlalchemy.orm import Session
from fastapi import Depends
from .db.session import get_db

def get_db_session(db: Session = Depends(get_db)):
    return db