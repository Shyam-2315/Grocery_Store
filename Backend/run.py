"""
Production server runner
Usage: python run.py
"""
import uvicorn
from config import settings

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG and settings.ENVIRONMENT == "development",
        log_level="info" if settings.ENVIRONMENT == "production" else "debug"
    )
