# -*- coding: utf-8 -*-
"""
Diabetes AI API - FastAPI main entrypoint
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.services.ml_service import ml_service
from app.routes.predict import router as predict_router
from app.routes.recommend import router as recommend_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup: load model + scaler + SHAP explainer
    ml_service.load()
    yield
    # shutdown (nothing to clean up)


app = FastAPI(
    title       = "Diabetes AI API",
    description = "Prediction du risque de diabete via XGBoost + explications SHAP",
    version     = "1.0.0",
    lifespan    = lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["http://localhost:5173", "http://localhost:3000"],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

app.include_router(predict_router,   tags=["Prediction"])
app.include_router(recommend_router, tags=["Recommandations"])


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "Diabetes AI API"}


@app.get("/health", tags=["Health"])
def health():
    return {
        "status" : "ok",
        "model"  : type(ml_service.model).__name__ if ml_service._loaded else "not loaded",
        "loaded" : ml_service._loaded,
    }
