"""Request/response schemas. Validation happens here, never in the client."""
from pydantic import BaseModel, ConfigDict, Field, field_validator

MAX_SCORE = 10_000  # 25x25 grid fits at most ~6,200 points


class ScoreIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    score: int = Field(ge=10, le=MAX_SCORE)

    @field_validator("score")
    @classmethod
    def multiple_of_ten(cls, v: int) -> int:
        if v % 10:
            raise ValueError("score must be a multiple of 10")
        return v


class ScoreOut(BaseModel):
    score: int
    created_at: str


class ScoreResult(ScoreOut):
    rank: int
    top10: bool
