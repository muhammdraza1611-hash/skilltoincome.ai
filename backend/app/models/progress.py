from sqlalchemy import Column, Integer, Float, Text, ForeignKey, JSON, String, Date, Boolean
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin


class ProgressLog(Base, TimestampMixin):
    __tablename__ = "progress_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    log_date = Column(Date, nullable=False)
    learning_hours = Column(Float, default=0.0)
    tasks_completed = Column(Integer, default=0)
    roadmap_progress_percentage = Column(Float, default=0.0)
    achievements = Column(JSON)    # list of achievement strings
    notes = Column(Text)
    streak_day = Column(Integer, default=0)

    user = relationship("User", back_populates="progress_logs")


class ChatMessage(Base, TimestampMixin):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False)   # user | assistant
    content = Column(Text, nullable=False)
    session_id = Column(String(100), nullable=True)

    user = relationship("User", back_populates="chat_history")


class Notification(Base, TimestampMixin):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(300), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    notification_type = Column(String(50))   # achievement, reminder, system

    user = relationship("User", back_populates="notifications")
