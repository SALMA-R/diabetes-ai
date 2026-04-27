# -*- coding: utf-8 -*-
"""
Entry point: python backend/run.py
"""
import os
import sys

# make sure 'backend/' is on sys.path so 'app.*' imports work
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host    = "0.0.0.0",
        port    = 8000,
        reload  = True,
        reload_dirs = [os.path.dirname(os.path.abspath(__file__))],
    )
