from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from typing import Dict, Set
import json

from app.db import get_db
from app.models import AnalysisReport, ChatMessage
from app.services.auth import verify_token

router = APIRouter(tags=["WebSocket Chat"])

# Store active connections by report_id
# { report_id: { user_id: websocket } }
active_connections: Dict[int, Dict[int, WebSocket]] = {}


class ConnectionManager:
    def __init__(self):
        self.connections: Dict[int, Dict[int, WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, report_id: int, user_id: int):
        await websocket.accept()
        if report_id not in self.connections:
            self.connections[report_id] = {}
        self.connections[report_id][user_id] = websocket
        print(f"[WS] User {user_id} connected to report {report_id}")
    
    def disconnect(self, report_id: int, user_id: int):
        if report_id in self.connections:
            if user_id in self.connections[report_id]:
                del self.connections[report_id][user_id]
                print(f"[WS] User {user_id} disconnected from report {report_id}")
            if not self.connections[report_id]:
                del self.connections[report_id]
    
    async def broadcast_to_report(self, report_id: int, message: dict, exclude_user: int = None):
        """Send message to all users connected to a report"""
        if report_id in self.connections:
            for user_id, websocket in self.connections[report_id].items():
                if user_id != exclude_user:
                    try:
                        await websocket.send_json(message)
                    except Exception as e:
                        print(f"[WS] Error sending to user {user_id}: {e}")


manager = ConnectionManager()


@router.websocket("/ws/chat/{report_id}")
async def websocket_chat(
    websocket: WebSocket,
    report_id: int
):
    """
    WebSocket endpoint for real-time chat.
    Client must send auth token as first message.
    """
    # Get a database session
    db = next(get_db())
    user_id = None
    
    try:
        # Wait for auth token
        await websocket.accept()
        print(f"[WS] Connection accepted for report {report_id}")
        
        auth_data = await websocket.receive_json()
        
        token = auth_data.get("token")
        if not token:
            print(f"[WS] No token provided")
            await websocket.send_json({"error": "No token provided"})
            await websocket.close()
            return
        
        # Verify token
        payload = verify_token(token)
        if not payload:
            print(f"[WS] Invalid token")
            await websocket.send_json({"error": "Invalid token"})
            await websocket.close()
            return
        
        user_id = int(payload.get("sub"))
        user_role = payload.get("role", "patient")
        print(f"[WS] User {user_id} ({user_role}) attempting to access report {report_id}")
        
        # Verify access to this report
        report = db.query(AnalysisReport).filter(AnalysisReport.id == report_id).first()
        if not report:
            print(f"[WS] Report {report_id} not found")
            await websocket.send_json({"error": "Report not found"})
            await websocket.close()
            return
        
        print(f"[WS] Report found: patient_id={report.patient_id}, doctor_id={report.doctor_id}, status={report.review_status}")
        
        # Permission check
        is_patient = user_role == "patient" and report.patient_id == user_id
        # Doctor can access if: they're assigned OR the case is pending/accepted (for triage)
        is_doctor = user_role == "doctor" and (
            report.doctor_id == user_id or 
            report.review_status in ["pending", "accepted"]
        )
        
        print(f"[WS] Permission check: is_patient={is_patient}, is_doctor={is_doctor}")
        
        if not (is_patient or is_doctor):
            print(f"[WS] Unauthorized access attempt")
            await websocket.send_json({"error": "Unauthorized"})
            await websocket.close()
            return
        
        print(f"[WS] Access granted, registering connection")
        
        # Register connection
        if report_id not in manager.connections:
            manager.connections[report_id] = {}
        manager.connections[report_id][user_id] = websocket
        
        # Send connection success and existing messages
        messages = db.query(ChatMessage).filter(ChatMessage.report_id == report_id).order_by(ChatMessage.created_at.asc()).all()
        print(f"[WS] Sending {len(messages)} existing messages")
        await websocket.send_json({
            "type": "connected",
            "user_id": user_id,
            "role": user_role,
            "messages": [
                {
                    "id": m.id,
                    "sender_role": m.sender_role,
                    "sender_id": m.sender_id,
                    "message": m.message,
                    "created_at": m.created_at.isoformat()
                } for m in messages
            ]
        })
        print(f"[WS] Connected message sent successfully, entering message loop")
        
        # Listen for messages
        while True:
            data = await websocket.receive_json()
            
            if data.get("type") == "message":
                message_text = data.get("message", "").strip()
                if message_text:
                    # Save to database
                    new_msg = ChatMessage(
                        report_id=report_id,
                        sender_id=user_id,
                        sender_role=user_role,
                        message=message_text
                    )
                    db.add(new_msg)
                    db.commit()
                    db.refresh(new_msg)
                    
                    # Broadcast to all connected users
                    broadcast_msg = {
                        "type": "new_message",
                        "id": new_msg.id,
                        "sender_role": user_role,
                        "sender_id": user_id,
                        "message": message_text,
                        "created_at": new_msg.created_at.isoformat()
                    }
                    
                    for uid, ws in manager.connections.get(report_id, {}).items():
                        try:
                            await ws.send_json(broadcast_msg)
                        except:
                            pass
                    
                    # If patient sent message and doctor is not active, trigger AI response
                    if user_role == "patient" and not report.doctor_active:
                        # Import here to avoid circular imports
                        from app.services.gemini_service import gemini_service
                        
                        # Get history for context
                        history = db.query(ChatMessage).filter(ChatMessage.report_id == report_id).all()
                        analysis_data = report.report_json
                        if isinstance(analysis_data, str):
                            analysis_data = json.loads(analysis_data)
                        
                        # Get AI response
                        ai_reply = await gemini_service.chat_about_lesion(analysis_data, message_text, history=history)
                        
                        # Save AI message
                        ai_msg = ChatMessage(
                            report_id=report_id,
                            sender_role="ai",
                            message=ai_reply
                        )
                        db.add(ai_msg)
                        db.commit()
                        db.refresh(ai_msg)
                        
                        # Broadcast AI response
                        ai_broadcast = {
                            "type": "new_message",
                            "id": ai_msg.id,
                            "sender_role": "ai",
                            "sender_id": None,
                            "message": ai_reply,
                            "created_at": ai_msg.created_at.isoformat()
                        }
                        
                        for uid, ws in manager.connections.get(report_id, {}).items():
                            try:
                                await ws.send_json(ai_broadcast)
                            except:
                                pass
    
    except WebSocketDisconnect:
        manager.disconnect(report_id, user_id if 'user_id' in dir() else 0)
    except Exception as e:
        print(f"[WS] Error: {e}")
        try:
            await websocket.close()
        except:
            pass
    finally:
        db.close()
