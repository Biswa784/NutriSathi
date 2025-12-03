from sqlalchemy import Column, Integer, String
from app.db.base import Base

class Item(Base):
    __tablename__ = 'items'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, default="")
    price = Column(Integer)
    is_active = Column(Integer, default=1)  # 1 for active, 0 for inactive