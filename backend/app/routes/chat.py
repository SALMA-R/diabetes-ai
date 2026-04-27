# -*- coding: utf-8 -*-
import os
import httpx
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class ChatMessage(BaseModel):
    message: str
    patient_context: Optional[dict] = None


@router.post("/chat")
async def chat(msg: ChatMessage):
    try:
        context = ""
        if msg.patient_context:
            score   = msg.patient_context.get("risk_score", 0)
            classif = msg.patient_context.get("classification", "")
            context = f"Patient : risque {score:.0%}, classification : {classif}."

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://integrate.api.nvidia.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {os.getenv('NVIDIA_API_KEY')}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "meta/llama-3.1-70b-instruct",
                    "max_tokens": 400,
                    "temperature": 0.7,
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "Tu es MediBot, assistant médical spécialisé en prévention du diabète.\n"
                                "Réponds TOUJOURS en français, avec empathie et clarté.\n"
                                "Donne des conseils pratiques sur les habitudes de vie.\n"
                                f"{context}\n"
                                "Rappelle de consulter un médecin pour tout diagnostic."
                            ),
                        },
                        {"role": "user", "content": msg.message},
                    ],
                },
                timeout=30.0,
            )
            data = response.json()
            return {"response": data["choices"][0]["message"]["content"]}
    except Exception as e:
        return {"response": f"Erreur : {str(e)}"}
