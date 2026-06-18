# -*- coding: utf-8 -*-
"""
Google OAuth 2.0 routes.
GET /auth/google          → redirige vers la page de consentement Google
GET /auth/google/callback → traite le retour, crée l'utilisateur, renvoie un JWT
"""
import os
from fastapi import APIRouter, Depends
from fastapi.responses import RedirectResponse
from starlette.requests import Request
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuth

from app.database import get_db, User
from app.services.auth_service import create_access_token

# ── OAuth client ──────────────────────────────────────────────────────────────
oauth = OAuth()
oauth.register(
    name               = "google",
    client_id          = os.getenv("GOOGLE_CLIENT_ID"),
    client_secret      = os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url= "https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs      = {"scope": "openid email profile"},
)

FRONTEND_URL       = "http://localhost:5173"
BACKEND_CALLBACK   = "http://localhost:8000/auth/google/callback"
GOOGLE_SENTINEL    = "__GOOGLE__"   # valeur stockée dans hashed_password pour les comptes Google

router = APIRouter(prefix="/auth", tags=["Auth Google"])


@router.get("/google")
async def google_login(request: Request):
    """Redirige l'utilisateur vers la page de consentement Google."""
    return await oauth.google.authorize_redirect(request, BACKEND_CALLBACK)


@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    """
    Reçoit le code d'autorisation de Google, échange contre un token,
    récupère email + nom, crée ou retrouve l'utilisateur, génère un JWT,
    et redirige vers le frontend avec le token dans l'URL.
    """
    try:
        token     = await oauth.google.authorize_access_token(request)
        user_info = token.get("userinfo") or {}

        email  = user_info.get("email", "")
        prenom = user_info.get("given_name", "")
        nom    = user_info.get("family_name", "") or user_info.get("name", email.split("@")[0])

        if not email:
            return RedirectResponse(f"{FRONTEND_URL}/auth?error=no_email")

        # Retrouver ou créer l'utilisateur
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                email           = email,
                hashed_password = GOOGLE_SENTINEL,
                nom             = nom    or "Google",
                prenom          = prenom or email.split("@")[0],
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        jwt_token = create_access_token(user.id)
        return RedirectResponse(f"{FRONTEND_URL}/auth/callback?token={jwt_token}")

    except Exception as exc:
        print(f"[Google OAuth] Erreur callback : {exc}")
        return RedirectResponse(f"{FRONTEND_URL}/auth?error=oauth_failed")
