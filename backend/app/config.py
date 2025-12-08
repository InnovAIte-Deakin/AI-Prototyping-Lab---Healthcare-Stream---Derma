import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_MEDIA_ROOT = BASE_DIR / "media"
MEDIA_ROOT = Path(os.getenv("MEDIA_ROOT", DEFAULT_MEDIA_ROOT))
MEDIA_ROOT.mkdir(parents=True, exist_ok=True)
MEDIA_URL = "/media"
