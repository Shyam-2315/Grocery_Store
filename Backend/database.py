from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# FORMAT: postgresql://username:password@localhost/db_name
# Replace 'postgres' and 'password' with your actual Postgres credentials
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:Shyam2315@localhost/grocery_pos"

engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()