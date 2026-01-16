from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
import re

# ==========================================
# AUTHENTICATION SCHEMAS
# ==========================================

class SignupRequest(BaseModel):
    # Store Details
    store_name: str
    store_code: Optional[str] = None
    contact_phone: str
    address: str
    city: str
    state: str
    registration_number: Optional[str] = None
    
    # Owner Details
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    
    # Subscription
    plan_id: str
    
    # Agreements
    terms_accepted: bool

    # Password Strength Validator
    @validator('password')
    def validate_password(cls, v):
        regex = r"^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"
        if not re.match(regex, v):
            raise ValueError('Password must be 8+ chars, contain 1 uppercase, 1 number, and 1 special char')
        return v

class AuthResponse(BaseModel):
    user_id: int
    store_id: int
    access_token: str
    token_type: str
    message: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = False

# --- DETAILED LOGIN RESPONSE ---
class UserInfo(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    role: str

class StoreInfo(BaseModel):
    id: int
    business_name: str
    subscription_status: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user: UserInfo
    store: StoreInfo
    subscription_status: str
    message: str

class Token(BaseModel):
    access_token: str
    token_type: str

# ==========================================
# INVENTORY (PRODUCT) SCHEMAS
# ==========================================

class ProductBase(BaseModel):
    name: str
    barcode: Optional[str] = None
    category: str
    cost_price: float
    selling_price: float
    stock_quantity: int
    min_stock_level: int = 5

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    tenant_id: int

    class Config:
        from_attributes = True