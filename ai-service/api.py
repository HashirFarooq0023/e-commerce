from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.assistant.store_assistant import StoreAssistant
# 👇 FIX 1: Import from the NEW ingest_data script
try:
    from scripts.ingest_data import main as run_ingestion
except ImportError:
    print("⚠️ Warning: Could not find scripts/ingest_data.py")
    run_ingestion = None

app = FastAPI()

# CORS for Next.js (Allows localhost:3000 to talk to Python)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 👇 FIX 2: Pass your store name here
print("🧠 Initializing AI Brain...")
assistant = StoreAssistant(store_name="LEEWAY")
print("✅ AI Ready!")

class ChatRequest(BaseModel):
    message: str
    session_id: str = "guest"

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Receives text from Next.js.
    Returns JSON: { "response": "...", "products": [...], "action": "..." }
    """
    try:
        # This now returns a DICTIONARY with products
        response_data = assistant.process_user_message(request.message, request.session_id)
        return response_data
    except Exception as e:
        print(f"❌ Error processing message: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/sync-products")
async def sync_products():
    """
    Call this API when you add a new product in Admin Panel.
    It re-reads MySQL and updates the Vector DB.
    """
    if not run_ingestion:
        raise HTTPException(status_code=500, detail="Ingestion script not found")
        
    try:
        print("🔄 Syncing Products...")
        run_ingestion() # Runs the main() function from ingest_data.py
        return {"status": "success", "message": "Vector DB updated with latest products"}
    except Exception as e:
        print(f"❌ Sync Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Run on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)