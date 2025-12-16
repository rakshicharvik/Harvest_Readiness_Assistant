import re #pattern  matching
from fastapi import HTTPException #block request

INJECTION_PATTERNS = [
    r"ignore\s+previous\s+instructions",
    r"act\s+as\s+system",
    r"system\s+prompt",
    r"developer\s+message",
    r"reveal\s+the\s+prompt",
    r"show\s+your\s+instructions",
]

SECRET_PATTERNS = [
    r"sk-[a-zA-Z0-9]{10,}",
    r"api[_-]?key",
    r"authorization:\s*bearer",
    r"BEGIN\s+PRIVATE\s+KEY",
    r"\bpassword\b",
    r"\btoken\b",
    r"system\s+prompt",
    r"developer\s+message",
]

def guard_prompt(question: str) -> None:
    q = (question or "").lower()
    for pat in INJECTION_PATTERNS:
        if re.search(pat, q):
            raise HTTPException(status_code=400, detail="Unsafe prompt detected")


def guard_output(answer: str, crop_name: str = "your crop") -> str:
    text = (answer or "").strip()
    if not text:
        return (
            "I designed only for harvest readiness.  So could not generate an answer right now"
            f"Please ask again about harvest readiness for {crop_name}."
        )

    low = text.lower()

    # block secrets / prompt leaks (replace with safe harvest guidance)
    for pat in SECRET_PATTERNS:
        if re.search(pat, low):
            return (
                "I can’t share internal or sensitive information. "
                f"Ask a harvest-readiness question for {crop_name} and I’ll help."
            )
    return text
