from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import  declarative_base


Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String(80), unique=True, nullable=False, index=True)
    is_farmer = Column(Boolean, nullable=False)
