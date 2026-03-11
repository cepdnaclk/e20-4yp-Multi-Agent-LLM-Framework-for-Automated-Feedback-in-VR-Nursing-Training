import os
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv
from pathlib import Path

# Load .env variables
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent

FIREBASE_SA = BASE_DIR/ "fyp-woundcaresim-firebase-adminsdk-fbsvc-ec03499240.json"

if not FIREBASE_SA:
    raise RuntimeError(
        "FIREBASE_SERVICE_ACCOUNT env var not set (path to service account JSON)"
    )

# Initialize Firebase app only once
if not firebase_admin._apps:
    cred = credentials.Certificate(FIREBASE_SA)
    firebase_admin.initialize_app(cred)

# Firestore client
db = firestore.client()
