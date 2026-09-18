import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class ChatRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    message: str = Field(min_length=1, max_length=4000)


class AgentReply(BaseModel):
    reply: str = Field(min_length=1, max_length=32000)
    provider: str = Field(min_length=1, max_length=50)


class ChatResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    prompt: str
    reply: str
    provider: str
    created_at: datetime
