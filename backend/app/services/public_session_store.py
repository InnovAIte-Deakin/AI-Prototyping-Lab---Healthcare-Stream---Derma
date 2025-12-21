from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from typing import Any, Dict, List
from uuid import uuid4

from fastapi import HTTPException, status


class PublicSessionStore:
    """
    Lightweight in-memory store for anonymous analysis sessions.
    Sessions expire automatically after a short TTL and never touch the database.
    """

    def __init__(self, ttl_minutes: int = 20):
        self.ttl = timedelta(minutes=ttl_minutes)
        self.sessions: Dict[str, Dict[str, Any]] = {}

    def _is_expired(self, created_at: datetime) -> bool:
        return datetime.now(timezone.utc) - created_at > self.ttl

    def _prune(self) -> None:
        """Remove expired sessions to keep memory usage predictable."""
        expired_ids: List[str] = []
        for session_id, data in self.sessions.items():
            if self._is_expired(data["created_at"]):
                expired_ids.append(session_id)

        for session_id in expired_ids:
            self.sessions.pop(session_id, None)

    def create_session(self, analysis: Dict[str, Any]) -> str:
        """Create a new anonymous session and return its ID."""
        self._prune()
        session_id = uuid4().hex
        self.sessions[session_id] = {
            "analysis": analysis,
            "created_at": datetime.now(timezone.utc),
            "messages": [],  # List[SimpleNamespace] with sender_role/message for chat context
        }
        return session_id

    def get_session(self, session_id: str) -> Dict[str, Any]:
        """Retrieve a session or raise 404 if missing/expired."""
        self._prune()
        session = self.sessions.get(session_id)

        if not session or self._is_expired(session["created_at"]):
            self.sessions.pop(session_id, None)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session expired or not found",
            )

        return session

    def append_message(self, session_id: str, sender_role: str, message: str) -> None:
        """Record a chat message against a session."""
        session = self.get_session(session_id)
        session["messages"].append(SimpleNamespace(sender_role=sender_role, message=message))

    def clear(self) -> None:
        """Utility for tests to reset state."""
        self.sessions.clear()


public_session_store = PublicSessionStore(ttl_minutes=20)

