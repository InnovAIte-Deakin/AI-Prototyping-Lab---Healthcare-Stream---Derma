import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# JWT Settings
SECRET_KEY = os.getenv("SECRET_KEY", "dev_secret_key_change_in_production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_MEDIA_ROOT = BASE_DIR / "media"
MEDIA_ROOT = Path(os.getenv("MEDIA_ROOT", DEFAULT_MEDIA_ROOT))
MEDIA_ROOT.mkdir(parents=True, exist_ok=True)
MEDIA_URL = "/media"
MEDIA_URL_TTL_SECONDS = int(os.getenv("MEDIA_URL_TTL_SECONDS", "300"))

# Resilience Settings
MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "5"))
ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]
AI_TIMEOUT_SECONDS = int(os.getenv("AI_TIMEOUT_SECONDS", "30"))

# Data Retention Settings (days, 0 = no auto-cleanup)
MEDIA_RETENTION_DAYS = int(os.getenv("MEDIA_RETENTION_DAYS", "365"))
CHAT_RETENTION_DAYS = int(os.getenv("CHAT_RETENTION_DAYS", "365"))
ANALYSIS_RETENTION_DAYS = int(os.getenv("ANALYSIS_RETENTION_DAYS", "730"))  # 2 years
