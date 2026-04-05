from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    name: str
    description: str
    image: str
    category: str

class InquiryCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    product: str
    message: Optional[str] = ""

class Inquiry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    name: str
    email: EmailStr
    phone: str
    product: str
    message: Optional[str] = ""
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContactCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    subject: str
    message: str

class Contact(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    name: str
    email: EmailStr
    phone: str
    subject: str
    message: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BrochureDownloadCreate(BaseModel):
    name: str
    email: EmailStr

class BrochureDownload(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    name: str
    email: EmailStr
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Products data
products_data = [
    {
        "id": "basmati-rice",
        "name": "Basmati Rice",
        "description": "Premium quality aromatic Basmati rice, known for its distinctive fragrance and long grains. Perfect for biryanis, pulao, and everyday meals.",
        "image": "https://images.pexels.com/photos/36346844/pexels-photo-36346844.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "category": "Rice"
    },
    {
        "id": "yellow-corn",
        "name": "Yellow Corn",
        "description": "High-quality yellow corn sourced from the finest farms. Ideal for animal feed, food processing, and industrial applications.",
        "image": "https://images.pexels.com/photos/1459331/pexels-photo-1459331.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "category": "Corn"
    },
    {
        "id": "lokwan-wheat",
        "name": "Lokwan Wheat",
        "description": "Superior grade Lokwan wheat variety with excellent nutritional value. Suitable for flour production and various food applications.",
        "image": "https://images.pexels.com/photos/30723398/pexels-photo-30723398.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "category": "Wheat"
    },
    {
        "id": "wheat-malt-extract",
        "name": "Wheat & Malt Extract",
        "description": "Natural wheat and malt extract rich in nutrients. Perfect for beverages, food supplements, and health products.",
        "image": "https://images.pexels.com/photos/30723398/pexels-photo-30723398.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "category": "Extract"
    }
]


# API Routes
@api_router.get("/")
async def root():
    return {"message": "Bolia Brothers LLP API"}

@api_router.get("/products", response_model=List[Product])
async def get_products():
    return products_data

@api_router.post("/inquiry", response_model=Inquiry)
async def create_inquiry(input: InquiryCreate):
    inquiry_obj = Inquiry(**input.model_dump())
    doc = inquiry_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.inquiries.insert_one(doc)
    return inquiry_obj

@api_router.post("/contact", response_model=Contact)
async def create_contact(input: ContactCreate):
    contact_obj = Contact(**input.model_dump())
    doc = contact_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.contacts.insert_one(doc)
    return contact_obj

@api_router.post("/brochure-download", response_model=BrochureDownload)
async def log_brochure_download(input: BrochureDownloadCreate):
    download_obj = BrochureDownload(**input.model_dump())
    doc = download_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.brochure_downloads.insert_one(doc)
    return download_obj


# Include API router
app.include_router(api_router)

# Serve frontend HTML
@app.get("/")
async def serve_frontend():
    return FileResponse(ROOT_DIR / "index.html")

# Catch-all for any other routes (returns frontend)
@app.get("/{full_path:path}")
async def catch_all(full_path: str):
    return FileResponse(ROOT_DIR / "index.html")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    client.close()
