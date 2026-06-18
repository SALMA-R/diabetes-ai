# -*- coding: utf-8 -*-
import asyncio
import os

import httpx
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
MODEL      = "meta/llama-3.1-8b-instruct"
TIMEOUT    = 120.0   # secondes
MAX_TRIES  = 2       # 1 tentative initiale + 1 retry


class ChatMessage(BaseModel):
    message: str
    patient_context: Optional[dict] = None


async def _call_nvidia(api_key: str, messages: list) -> str:
    """
    Appelle l'API NVIDIA et retourne le contenu texte.
    Lève httpx.TimeoutException ou RuntimeError si la réponse est invalide.
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(
            NVIDIA_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model":       MODEL,
                "max_tokens":  400,
                "temperature": 0.7,
                "messages":    messages,
            },
            timeout=TIMEOUT,
        )

    print(f"[Chat] Status {response.status_code}")

    if response.status_code != 200:
        body = response.text[:300]
        print(f"[Chat] Erreur HTTP {response.status_code}: {body}")
        raise RuntimeError(f"HTTP {response.status_code}")

    data    = response.json()
    choices = data.get("choices")
    if not choices:
        print(f"[Chat] Réponse sans 'choices': {data}")
        raise RuntimeError("Réponse inattendue (pas de 'choices')")

    content = choices[0].get("message", {}).get("content", "").strip()
    if not content:
        print(f"[Chat] Contenu vide dans la réponse")
        raise RuntimeError("Contenu vide")

    return content


@router.post("/chat")
async def chat(msg: ChatMessage):
    api_key = os.getenv("NVIDIA_API_KEY", "")
    if not api_key:
        print("[Chat] ERREUR : NVIDIA_API_KEY manquant dans .env")
        return {"response": "Clé API manquante. Configurez NVIDIA_API_KEY dans le fichier .env."}

    context = ""
    if msg.patient_context:
        score   = msg.patient_context.get("risk_score", 0)
        classif = msg.patient_context.get("classification", "")
        if score or classif:
            context = f"\nContexte patient : risque {score:.0%}, classification : {classif}."

    messages = [
        {
            "role": "system",
            "content": (
                "Tu es MediBot, assistant médical spécialisé en prévention du diabète.\n"
                "Réponds TOUJOURS en français, avec empathie et clarté.\n"
                "Donne des conseils pratiques sur les habitudes de vie."
                + context + "\n"
                "Rappelle de consulter un médecin pour tout diagnostic officiel."
            ),
        },
        {"role": "user", "content": msg.message},
    ]

    last_error = ""
    for attempt in range(1, MAX_TRIES + 1):
        try:
            print(f"[Chat] Tentative {attempt}/{MAX_TRIES} — modèle {MODEL}")
            content = await _call_nvidia(api_key, messages)
            return {"response": content}

        except httpx.TimeoutException:
            last_error = f"timeout (>{TIMEOUT:.0f}s)"
            print(f"[Chat] Tentative {attempt} : {last_error}")

        except httpx.ConnectError as e:
            print(f"[Chat] ConnectError : {e}")
            return {"response": "Impossible de joindre l'API NVIDIA. Vérifiez votre connexion internet."}

        except Exception as e:
            last_error = str(e)
            print(f"[Chat] Tentative {attempt} échouée : {last_error}")

        # Pause courte entre les tentatives (sauf après la dernière)
        if attempt < MAX_TRIES:
            print(f"[Chat] Nouvelle tentative dans 3 s…")
            await asyncio.sleep(3)

    print(f"[Chat] Toutes les tentatives ont échoué. Dernière erreur : {last_error}")
    return {
        "response": (
            "L'assistant IA est temporairement indisponible "
            "(serveurs NVIDIA surchargés). Réessayez dans quelques instants."
        )
    }
