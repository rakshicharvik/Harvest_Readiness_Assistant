🌾 Agri Harvest Assistant 

1. Project Overview
The Agri Harvest Assistant is a domain-specific AI application designed only for Harvest Readiness. It intentionally does not act as a general agriculture chatbot.
The system answers questions related to harvest timing, harvest readiness, and crop maturity. Any non-harvest-related query is rejected by backend guardrails.


2. High-Level Architecture
The solution follows a layered architecture, where each layer has a single responsibility:
Frontend (React) – User interaction layer
API Layer (FastAPI – main.py) – Orchestration layer
Guardrails Layer – Domain validation layer
LLM Layer – Answer generation layer
Evaluation Layer – Quality and scoring layer
Persistence Layer (PostgreSQL) – User data storage
Each request flows top-down, and decisions are enforced as early as possible to reduce cost, risk, and complexity.


3. How to Install and Run the Application
Prerequisites
Node.js (v18+ recommended)
Python (3.10+)
PostgreSQL
Git

Backend Setup (FastAPI)
# clone repository
git clone <repo-url>
cd backend
# create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# install dependencies
pip install -r requirements.txt
Configure Database
Create a PostgreSQL database
Update DB credentials in environment variables or config file
DATABASE_URL=postgresql://user:password@localhost:5432/agri_db

Run Backend
uvicorn main:app --reload

Backend will run at:
http://localhost:8000

Frontend Setup (React)
cd frontend
npm install
npm run dev

Frontend will run at:
http://localhost:5173


4. Sample Data
Login Sample
Username: ram
Farmer: Yes
Only farmers are allowed to proceed.

Sample Questions to Test the Application
"Is my rice crop ready for harvest?"
"Best season to grow groundnut in Tamil Nadu"
"How to protect crops from pests during monsoon?"
"When should I harvest sugarcane?"
These queries help validate:
Backend AI integration
Chat session handling
End-to-end data flow


5. Key Decisions and Trade-offs
This section highlights intentional engineering decisions made while building the system, along with their trade-offs. These decisions reflect a focus on clarity, safety, and evaluability over unnecessary complexity.


1. Domain-Restricted AI (Harvest Readiness Only)
Decision: Restrict the assistant strictly to harvest readiness queries.
Why:
Reduces hallucination risk
Improves answer reliability
Aligns with a real-world, well-bounded use case
Trade-off:
The system cannot answer general agriculture questions
 Prototype-First, Then AI Integration


2. Decision: Build a working backend prototype before introducing the LLM.
Implementation Path:
Hardcoded harvest Q&A logic in backend
Manual API testing using Bruno
Automated validation using pytest
LLM introduced only after logic correctness was confirmed
Why:
Prevents debugging AI and logic at the same time
Ensures business rules work independently of AI
Trade-off:
Slightly longer initial development time


3. Choosing LLM-Only Instead of RAG or LangChain
Decision: Use a direct LLM call with a constrained prompt, without RAG or LangChain.
Why:
Harvest readiness does not require large external knowledge bases
Avoids unnecessary vector databases and retrieval complexity
Keeps reasoning flow transparent and debuggable
Trade-off:
Limited to model knowledge
Not suitable for large document-based QA


4. Guardrails Before LLM Invocation
Decision: Validate question intent before calling the LLM.
Why:
Prevents non-harvest questions from reaching the model
Reduces token usage and cost
Improves safety and consistency
Trade-off:
Requires explicit intent classification logic


5. LLM-as-a-Judge Instead of RAG Evaluation
Decision: Use the LLM itself as a judge for response quality, rather than retrieval-based evaluation.
Why:
Enables semantic evaluation of answers
Avoids building a separate evaluation dataset
Flexible scoring across varied phrasing
Trade-off:
Evaluation depends on model behavior


6. Using Braintrust for Live Q&A Logs and Scoring
Decision: Integrate Braintrust to capture live prompts, responses, and evaluation scores.
Why:
Provides visibility into real user interactions
Enables prompt iteration based on real data
Makes evaluation transparent and auditable
Trade-off:
External dependency
Requires careful logging discipline


7. Separation of Concerns Across Files
Decision: Strict separation of responsibilities across backend files.
Mapping:
main.py – Request orchestration
guardrails.py – Domain validation
llm.py – Model interaction
eval.py – Scoring and evaluation
models.py – API schemas
db.py – Persistence
Why:
Easier reasoning and testing
Clear architectural ownership
Trade-off:
More files to manage


8. Backend as the Source of Truth
Decision: Enforce all critical rules in the backend.
Why:
Frontend can be bypassed
Backend guarantees correctness and safety
Trade-off:
Some validation logic appears duplicated in frontend for UX reasons


9. Prototype-First Development Approach
Decision: Build and validate the system step by step
Prototype Flow:
Hard-coded questions and answers in backend
Manual API testing using Bruno
Automated validation using pytest
Introduced LLM only after logic correctness
Trade-off:
More initial steps
Strong confidence before LLM integration


10. Using SQLAlchemy ORM instead of Raw SQL
Decision: Use SQLAlchemy ORM
Reason:
Cleaner database interaction
Prevents SQL injection
Easier schema management
Trade-off:
Slight performance overhead compared to raw SQL
Improved readability and safety


11. Using PostgreSQL
Decision: Choose PostgreSQL over SQLite
Reason:
Production-ready
Better concurrency handling
Scales well with users
Trade-off:
More setup compared to SQLite
Suitable for real-world deployment



Conclusion:
The Agri Harvest Assistant is designed with clarity, correctness, and scalability in mind. The system balances simplicity with real-world best practices, ensuring secure access, clean architecture, and an intuitive user experience for farmers.
