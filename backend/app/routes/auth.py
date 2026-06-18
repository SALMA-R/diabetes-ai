# -*- coding: utf-8 -*-
"""
Authentication routes: register, login, me, history, stats.
"""
import json
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db, User, Prediction
from app.models.schemas import UserRegister, UserLogin, UserResponse, Token
from app.services.auth_service import (
    hash_password, verify_password, create_access_token, get_current_user,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(body: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé.")
    user = User(
        email           = body.email,
        hashed_password = hash_password(body.password),
        nom             = body.nom,
        prenom          = body.prenom,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return Token(access_token=create_access_token(user.id), token_type="bearer")


@router.post("/login", response_model=Token)
def login(body: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect.")
    # Compte créé via Google OAuth — pas de mot de passe local
    if user.hashed_password == "__GOOGLE__":
        raise HTTPException(
            status_code=400,
            detail="Ce compte utilise la connexion Google. Cliquez sur 'Se connecter avec Google'."
        )
    if not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect.")
    return Token(access_token=create_access_token(user.id), token_type="bearer")


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/history")
def history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    preds = (
        db.query(Prediction)
        .filter(Prediction.user_id == current_user.id)
        .order_by(Prediction.created_at.desc())
        .limit(20)
        .all()
    )
    return [
        {
            "id"            : p.id,
            "risk_score"    : p.risk_score,
            "classification": p.classification,
            "patient_data"  : json.loads(p.patient_data) if p.patient_data else None,
            "created_at"    : p.created_at.isoformat(),
        }
        for p in preds
    ]


@router.get("/stats")
def stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    preds = db.query(Prediction).filter(Prediction.user_id == current_user.id).all()
    total     = len(preds)
    avg_score = sum(p.risk_score for p in preds) / total if total > 0 else 0.0
    return {
        "total_evaluations": total,
        "avg_risk_score"   : round(avg_score, 4),
        "user"             : UserResponse.model_validate(current_user),
    }


@router.delete("/me")
def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(Prediction).filter(Prediction.user_id == current_user.id).delete()
    db.delete(current_user)
    db.commit()
    return {"message": "Compte supprimé avec succès."}
