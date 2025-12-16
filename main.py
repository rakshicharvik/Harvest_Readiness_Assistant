from fastapi import FastAPI
from pydantic import BaseModel
from llm import llm_answer
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException
from db import SessionLocal, get_db
from models import User

from guardrails import guard_prompt, guard_output 

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class LoginIn(BaseModel):
    username: str
    is_farmer: bool

@app.post("/login")
def login(payload: LoginIn, db: Session = Depends(get_db)):
    name = (payload.username or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Username required")

    if payload.is_farmer is False:
        raise HTTPException(status_code=403, detail="Only farmers can access this app")

    user = db.query(User).filter(User.username == name).first()
    if not user:
        user = User(username=name, is_farmer=True)
        db.add(user)
        db.commit()
        db.refresh(user)

    return {"user_id": user.id, "username": user.username, "role": "farmer"}




class QueryRequest(BaseModel):
    user_id: int | None = None 
    question: str
    crop: str | None = None
    cropOther: str | None = None
    season: str | None = None
    location: str | None = None
    soil: str | None = None

class QueryResponse(BaseModel):
    answer: str

INTENT_KEYWORDS = [
    "harvest", "harvesting", "ready", "readiness", "maturity", "mature",
    "ripeness", "ripe", "moisture", "brix", "firmness","sign","signs"
    "indicator", "indicators", "field test", "test"
]

@app.post("/ask", response_model=QueryResponse)
def ask_ques(payload: QueryRequest, db: Session = Depends(get_db)):

    # require valid logged-in farmer
    if payload.user_id is not None:
        user = db.query(User).filter(User.id == payload.user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="Please login first")
        if not user.is_farmer:
            raise HTTPException(status_code=403, detail="Only farmers can access this app")
        

    q = (payload.question or "").strip()
    q_lower = q.lower()

    # prompt injection
    guard_prompt(q)

    # harvest-intent guardrail
    is_harvest_intent = any(k in q_lower for k in INTENT_KEYWORDS)
    if not is_harvest_intent:
        return QueryResponse(
            answer="I'm designed only for harvest-readiness questions. Please ask about harvest readiness."
        )

    # crop resolution
    crop_name = ""
    if payload.crop and payload.crop.strip():
        if payload.crop.strip().lower() == "other":
            crop_name = (payload.cropOther or "").strip()
        else:
            crop_name = payload.crop.strip()

    if not crop_name:
        return QueryResponse(answer="Please select a crop or choose Other and type the crop name")

    enriched = f"""
    You are answering ONLY harvest-readiness questions.

    Crop: {crop_name}
    Location: {payload.location or "not specified"}
    Season: {payload.season or "not specified"}
    Soil: {payload.soil or "not specified"}

    Question: {q}""".strip()

    ans = llm_answer(enriched)

    safe_ans = guard_output(ans, crop_name=crop_name)

    return QueryResponse(answer=safe_ans)





































































































































































































'''
class QueryRequest(BaseModel):
    question:str

class QueryResponse(BaseModel):
    answer:str

@app.post("/ask",response_model=QueryResponse)
def ask_ques(payload: QueryRequest):
    
    questions=payload.question
    crops = ["wheat", "tomato", "tomatoes", "pepper", "peppers",
             "maize", "corn", "sugarcane", "rice"]

    intent_keywords = ["harvest", "ready", "readiness", "maturity", "mature",
                       "ripeness", "ripe", "moisture", "brix", "firmness"]

    is_crop = any(crop in questions for crop in crops)
    is_harvest_intent = any(k in questions for k in intent_keywords)

    if is_crop or is_harvest_intent:
        ans = llm_answer(payload.question)

    else:
        ans="Right now I'm only designed for harvest readiness . so please provide your questions about it. "
    

    return QueryResponse(answer=ans)

'''












'''
@app.post("/ans",response_model=QueryResponse)
def ask_ques(payload: QueryRequest):
    
    questions=payload.question.lower()
    if "wheat" in questions:
        ans="Wheat is usually ready to harvest when the grains are hard, the crop turns golden-yellow, and the moisture content is around 18–20%"
    elif "harvest" and "tomatoes" in questions:
        ans="Tomatoes are typically ready to harvest when they reach a uniform red color for that variety and are slightly soft to the touch."
    else:
        ans="Right now I'm a simple demo. I can answer basic harvest questions about wheat and tomatoes. Try asking, for example: 'When is wheat ready to harvest?' "
    

    return QueryResponse(answer=ans)
'''




