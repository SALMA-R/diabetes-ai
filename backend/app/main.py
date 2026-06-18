# -*- coding: utf-8 -*-
"""
Diabetes AI API - FastAPI main entrypoint
"""
import os
from contextlib import asynccontextmanager
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.database import init_db
from app.services.ml_service import ml_service
from app.routes.predict      import router as predict_router
from app.routes.recommend    import router as recommend_router
from app.routes.chat         import router as chat_router
from app.routes.auth         import router as auth_router
from app.routes.google_auth  import router as google_auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()                # create SQLite tables if not present
    ml_service.load()        # load XGBoost model + scaler + SHAP explainer
    yield


app = FastAPI(
    title       = "Diabetes AI API",
    description = "Prediction du risque de diabete via XGBoost + explications SHAP + JWT auth",
    version     = "2.0.0",
    lifespan    = lifespan,
)

# SessionMiddleware requis par authlib pour stocker le state OAuth entre les requêtes
app.add_middleware(
    SessionMiddleware,
    secret_key = os.getenv("SECRET_KEY", "fallback-session-secret"),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

app.include_router(auth_router,        tags=["Auth"])
app.include_router(google_auth_router, tags=["Auth Google"])
app.include_router(predict_router,     tags=["Prediction"])
app.include_router(recommend_router,   tags=["Recommandations"])
app.include_router(chat_router,        tags=["Chat"])


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "Diabetes AI API v2"}


@app.get("/health", tags=["Health"])
def health():
    return {
        "status": "ok",
        "model" : type(ml_service.model).__name__ if ml_service._loaded else "not loaded",
        "loaded": ml_service._loaded,
    }
