from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from config import settings

DATABASE_URL = str(settings.DATABASE_URL)

# sqlalchemy connect to postgress sql db using engine . cause engine manages connecting db 
engine = create_engine(DATABASE_URL)

#postgress sql create db session and connecting with sqlalchemy
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base() # base class for db models

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
