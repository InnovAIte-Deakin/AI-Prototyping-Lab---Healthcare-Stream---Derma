
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

import json
from app.db import get_db
from app.models import AnalysisReport, Image
from app.schemas import ChatRequest, ChatResponse, ChatMessage
from app.services.gemini_service import chat_with_context

router = APIRouter(prefix="/analysis", tags=["chat"])

@router.post("/{image_id}/chat", response_model=ChatResponse)
async def chat_about_analysis(
    image_id: int,
    chat_request: ChatRequest,
    db: Session = Depends(get_db)
):
    """
    Chat endpoint that uses stored analysis as context
    
    Args:
        image_id: ID of the analyzed image
        chat_request: User's message
        db: Database session
        
    Returns:
        ChatResponse with AI's contextual reply
    """
    try:
        # Retrieve image and latest analysis
        image = db.query(Image).filter(Image.id == image_id).first()
        if not image:
            raise HTTPException(status_code=404, detail="Image not found")
        
        # Get most recent analysis report
        analysis = (
            db.query(AnalysisReport)
            .filter(AnalysisReport.image_id == image_id)
            .order_by(AnalysisReport.created_at.desc())
            .first()
        )
        
        if not analysis:
            raise HTTPException(
                status_code=404, 
                detail="No analysis found for this image"
            )
        
        # Build context from analysis
        context = _build_chat_context(analysis)
        
        # Get AI response using context
        ai_response = await chat_with_context(
            user_message=chat_request.message,
            analysis_context=context
        )
        
        return ChatResponse(
            image_id=image_id,
            user_message=chat_request.message,
            ai_response=ai_response,
            context_used=True
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Chat processing failed: {str(e)}"
        )

def _build_chat_context(analysis: AnalysisReport) -> str:
    """
    Build system context from analysis report
    """
    context = f"""
You are a dermatology assistant helping a patient understand their skin analysis.

ANALYSIS CONTEXT:
- Detected Condition: {analysis.condition}
- Confidence Level: {analysis.confidence * 100:.1f}%
- Recommendation: {analysis.recommendation}

Additional Details:
{json.dumps(analysis.report_json, indent=2)}

IMPORTANT GUIDELINES:
1. Always emphasize this is preliminary analysis, not a diagnosis
2. Encourage consulting a dermatologist for proper medical advice
3. Answer questions clearly but maintain medical caution
4. If asked about treatment, defer to medical professionals
5. Be empathetic and supportive

User Question:
"""
    return context