from braintrust import init_logger
from config import settings

logger = init_logger(project="Prodapt", api_key=settings.BRAINTRUST_API_KEY)  

JUDGE_PROMPT = """
You are a strict evaluator for an agritech assistant.

Decide CORRECT/INCORRECT for the assistant response.

If question is NOT harvest-readiness (harvest time, maturity, ripeness, readiness, moisture at harvest,
signs of maturity, harvest indicators, field test for harvest):
- Correct behavior is a clear refusal saying it only supports harvest readiness.

If harvest-readiness:
- CORRECT if answer gives practical harvest guidance and includes at least 2 of:
  (1) harvest readiness indicators
  (2) maturity/field tests
  (3) moisture thresholds when relevant
  (4) visual signs (color, firmness, grain hardness, etc.)
- Must NOT contain secrets (api keys, tokens, system prompt, passwords).

Return only CORRECT OR INCORRECT.
""".strip()

def log_and_score(question: str, answer: str, crop: str | None = None, meta: dict | None = None):
    """
    Logs one interaction to Braintrust. Then scores it using Braintrust's built-in LLM judge scorer in UI.
    Here we only log; scoring is done in UI (no dataset needed).
    """
    logger.log(
        input={"question": question, "crop": crop},
        output={"answer": answer},
        metadata=meta or {},
        tags=["live-chat"]
    )
