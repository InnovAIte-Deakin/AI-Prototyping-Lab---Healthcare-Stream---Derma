import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

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
