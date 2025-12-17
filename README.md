# 🌾 Agri Harvest Assistant 

##  Project Overview

The **Agri Harvest Assistant** is a **domain-specific AI application designed only for Harvest Readiness**. It intentionally does **not** act as a general agriculture chatbot.

The system answers questions related to **harvest timing, harvest readiness, and crop maturity**. Any non-harvest-related query is rejected by backend guardrails.

The solution is built incrementally using a **prototype-first approach**, validated through manual testing and automated tests, and then enhanced with an LLM.

## High-Level Architecture 
![alt text](Architecture.png)
The system is **intentionally scoped** to solve a **single, well-defined problem**:

> Harvest Readiness Question Answering for Farmers-  It is **not** designed as a general chatbot

The solution follows a **layered architecture**, where each layer has a single responsibility:

1. **Frontend (React)** – User interaction layer
2. **API Layer (FastAPI – main.py)** – Orchestration layer
3. **Guardrails Layer** – Domain validation layer
4. **LLM Layer** – Answer generation layer
5. **Evaluation Layer** – Quality and scoring layer
6. **Persistence Layer (PostgreSQL)** – User data storage

Each request flows **top-down**, and decisions are enforced **as early as possible** to reduce cost, risk, and complexity.



**How this principle was applied:**

1. **Define a narrow scope** — Harvest Readiness only (not a general chatbot).
2. **Build a backend prototype first** — deterministic logic validated without AI.
3. **Validate behavior early** — manual API testing (Bruno) followed by automated tests.
4. **Introduce AI last** — add an LLM only after business rules and guardrails were proven.
5. **Evaluate continuously** — observe real queries, responses, and scores to guide iteration.

This approach reduces risk, simplifies debugging, and makes design trade-offs explicit and reviewable.

##  How to Install and Run the Application

### Prerequisites

- Node.js (v18+ recommended)
- Python (3.10+)
- PostgreSQL
- Git

---

### Backend Setup (FastAPI)

```bash
# clone repository
git clone <repo-url>
cd backend

# create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# install dependencies
pip install -r requirements.txt
```

#### Configure Database

- Create a PostgreSQL database
- Update DB credentials in environment variables or config file

```env
DATABASE_URL=postgresql://user:password@localhost:5432/agri_db
```

#### Run Backend

```bash
uvicorn main:app --reload
```

Backend will run at:

```
http://localhost:8000
```

---

### Frontend Setup (React)

```bash
cd frontend
npm install
npm run dev
```

Frontend will run at:

```
http://localhost:5173
```

---

## Sample Data / Sample Queries

### Login Sample

- Username: `ram`
- Farmer: `Yes`

Only farmers are allowed to proceed.

---

### Sample Questions to Test the Application

- "Is my rice crop ready for harvest?"
- "Best season to grow groundnut in Tamil Nadu"
- "How to protect crops from pests during monsoon?"
- "When should I harvest sugarcane?"

These queries help validate:

- Backend AI integration
- Chat session handling
- End-to-end data flow



##  Key Decisions and Trade-offs

This section captures **seven end-to-end architectural decisions** that define the system. These decisions were made to keep the solution **simple, correct, and reviewable**, while still demonstrating strong system design thinking.

---

### 1. Narrow, Well-Defined Problem Scope (Harvest Readiness Only)

**Decision:** Restrict the system strictly to harvest readiness questions.

**Why:**

- Solving a smaller problem well produces more reliable results
- Reduces ambiguity and hallucination in AI responses
- Makes evaluation clearer and more objective

**Trade-off:**

- The assistant does not answer general agriculture questions

---

### 2. Orchestration Layer as the System Backbone (`main.py`)

**Decision:** Use a dedicated orchestration layer to control request flow.

**Why:**

- Centralizes decision-making (login, validation, routing)
- Keeps business logic out of the frontend
- Makes the request lifecycle easy to reason about

**Trade-off:**

- Adds an extra abstraction layer
- Greatly improves clarity and control

---

### 3. Prototype-First Development Before AI Integration

**Decision:** Build a fully working backend prototype before introducing the LLM.

**Why:**

- Separates business logic correctness from AI behavior
- Simplifies debugging and validation
- Ensures the system works even without AI

**Trade-off:**

- Requires more initial setup
- Reduces long-term complexity and risk

---

### 4. Guardrails Before LLM Invocation

**Decision:** Validate question intent before calling the LLM.

**Why:**

- Prevents non-harvest queries from reaching the model
- Reduces unnecessary AI calls
- Enforces domain boundaries early

**Trade-off:**

- Additional validation logic
- Significantly improved safety and predictability

---

### 5. LLM-Only Design (No RAG, No LangChain)

**Decision:** Use a direct LLM call with a constrained prompt, without RAG or LangChain.

**Why:**

- Harvest readiness does not require document retrieval
- Avoids unnecessary infrastructure and complexity
- Keeps the reasoning path transparent

**Trade-off:**

- Limited to the model’s internal knowledge
- Not suitable for document-heavy use cases

---

### 6. LLM-as-a-Judge for Answer Evaluation

**Decision:** Use the LLM itself to evaluate response quality instead of retrieval-based evaluation.

**Why:**

- Enables semantic judgment of answers
- Avoids building and maintaining labeled datasets
- Flexible across varied user phrasing

**Trade-off:**

- Evaluation quality depends on model behavior

---

### 7. Observability Through Live Logs and Scoring (Braintrust)

**Decision:** Capture live prompts, responses, and evaluation scores using Braintrust.

**Why:**

- Provides visibility into real system behavior
- Enables iterative improvement based on evidence
- Makes AI behavior auditable for reviewers

**Trade-off:**

- External dependency
- Strong gains in transparency and learning

---

Conclusion:

These decisions reflect a deliberate focus on **clarity over complexity**, **correctness over breadth**, and **explainability over abstraction**—making the system easier to evaluate, reason about, and extend.
