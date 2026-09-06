import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_db, get_current_user
from app.schemas.common import ChatRequest, ChatResponse
from app.services.chat_service import ChatService

router = APIRouter(prefix="/chat", tags=["AI Mentor Chat"])


@router.post("/message", response_model=ChatResponse)
async def send_message(data: ChatRequest, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    session_id = data.session_id or str(uuid.uuid4())
    service = ChatService(db)
    response = await service.chat(current_user.id, data.message, session_id, current_user.full_name)
    return ChatResponse(response=response, session_id=session_id)


@router.get("/history/{session_id}")
async def get_history(session_id: str, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    service = ChatService(db)
    return await service.get_chat_history(current_user.id, session_id)
