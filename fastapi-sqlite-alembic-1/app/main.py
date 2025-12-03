from fastapi import FastAPI
from app.api.v1.endpoints import router as api_router
from app.db.session import engine
from app.db.base import Base

app = FastAPI()

# Create the database tables
@app.on_event("startup")
async def startup():
    Base.metadata.create_all(bind=engine)

# Include the API router
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def read_root():
    return {"message": "Welcome to the FastAPI application with SQLite and Alembic!"}