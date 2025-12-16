import re

INJECTION_PATTERNS = [
    r"ignore\s+previous\s+instructions",
    r"act\s+as\s+system",
    r"system\s+prompt",
    r"developer\s+message",
    r"reveal\s+the\s+prompt",
    r"show\s+your\s+instructions",
]

SECRET_PATTERNS = [
    r"sk-[a-zA-Z0-9]{10,}",              # OpenAI key pattern
    r"api[_-]?key",
    r"authorization:\s*bearer",
    r"BEGIN\s+PRIVATE\s+KEY",
    r"password",
    r"token",
    r"system\s+prompt",
    r"developer\s+message",
]

def guard_prompt(question: str) -> None:
    q = (question or "").lower()
    for pat in INJECTION_PATTERNS:
        if re.search(pat, q):
            # keep it simple: treat as unsafe input
            raise ValueError("Unsafe prompt detected")


def guard_output(answer: str, crop_name: str = "your crop") -> str:
    
    text = (answer or "").strip()
    if not text:
        return (
            "Summary:\n"
            "- I couldn't generate an answer right now.\n\n"
            f"{crop_name}:\n"
            "Indicators:\n"
            "- Please try again.\n"
            "- Ensure you selected the correct crop.\n"
            "- Ask specifically about harvest readiness.\n\n"
            "How to check (field test):\n"
            "- Re-ask the question with crop name.\n"
            "- Include location/season if possible.\n\n"
            
        )

    low = text.lower()

    # 1) Block secrets / prompt leaks
    for pat in SECRET_PATTERNS:
        if re.search(pat, low):
            return (
                "Summary:\n"
                "- I can’t share internal or sensitive information.\n\n"
                f"{crop_name}:\n"
                "Indicators:\n"
                "- Color/appearance changes typical for maturity\n"
                "- Proper firmness/dryness depending on crop\n"
                "- Moisture/field indicators match harvest stage\n\n"
                "How to check (field test):\n"
                "- Do a simple maturity/moisture check in the field\n"
                "- Compare with recommended harvest indicators\n\n"
                "Notes:\n"
                "- Ask a harvest-readiness question and I’ll help.\n"
            )

    # 2) Soft format check (DON’T fail hard)
    required = ["Summary:", "Indicators:", "How to check", "Notes:"]
    missing = [r for r in required if r not in text]
    if missing:
        # wrap it into expected format rather than erroring
        return (
            "Summary:\n"
            "- Here’s a harvest-readiness focused answer.\n\n"
            f"{crop_name}:\n"
            "Indicators:\n"
            f"- {text[:120].replace('\\n', ' ')}...\n"
            "- Look for maturity indicators (color, dryness, firmness)\n"
            "- Check moisture levels if applicable\n\n"
            "How to check (field test):\n"
            "- Inspect physical maturity signs in the field\n"
            "- Use a moisture meter / simple test where applicable\n\n"
            "Notes:\n"
            "- If you share crop stage/location, I can be more specific.\n"
        )

    return text
