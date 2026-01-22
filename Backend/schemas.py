from datetime import datetime
from pydantic import BaseModel, EmailStr, validator, field_validator
from typing import Optional, List, Union
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
# CATEGORY SCHEMAS
# ==========================================

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int
    tenant_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# ==========================================
# INVENTORY (PRODUCT) SCHEMAS
# ==========================================

class ProductBase(BaseModel):
    name: str
    barcode: Optional[str] = None
    category_id: Optional[int] = None
    cost_price: float = 0.0
    selling_price: float
    stock_quantity: int = 0
    min_stock_level: int = 5
    
    @validator('category_id', pre=True, always=True)
    def validate_category_id(cls, v):
        """Convert empty string, None, 0, or 'null' to None and ensure integer type"""
        if v is None or v == '' or v == 'null' or v == 0 or v == '0' or v == 'undefined':
            return None
        try:
            int_val = int(v) if isinstance(v, (str, float)) else v
            return None if int_val == 0 else int_val
        except (ValueError, TypeError):
            return None
    
    @validator('barcode', pre=True)
    def validate_barcode(cls, v):
        """Convert empty string to None"""
        if v == '' or v is None:
            return None
        return str(v).strip() if v else None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    barcode: Optional[str] = None
    category_id: Optional[int] = None
    cost_price: Optional[float] = None
    selling_price: Optional[float] = None
    stock_quantity: Optional[int] = None
    min_stock_level: Optional[int] = None

class ProductResponse(ProductBase):
    id: int
    tenant_id: int
    category_name: Optional[str] = None

    class Config:
        from_attributes = True

# ==========================================
# CUSTOMER SCHEMAS
# ==========================================

class CustomerBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None

class CustomerResponse(CustomerBase):
    id: int
    tenant_id: int
    loyalty_points: int
    total_purchases: float
    last_purchase_date: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ==========================================
# TRANSACTION SCHEMAS
# ==========================================
class CartItem(BaseModel):
    product_id: int
    product_name: str
    quantity: int
    unit_price: float
    # We calculate line total in backend to be safe

class TransactionCreate(BaseModel):
    items: List[CartItem]
    payment_method: str
    customer_id: Optional[int] = None
    discount_type: Optional[str] = None  # 'percentage' or 'fixed'
    discount_value: Optional[float] = None
    # Total is calculated on backend for security

class TransactionItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    quantity: int
    unit_price: float
    total_price: float

    class Config:
        from_attributes = True

class TransactionDetailResponse(BaseModel):
    id: int
    tenant_id: int
    user_id: int
    customer_id: Optional[int] = None
    subtotal: float
    discount_amount: float
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    total_amount: float
    payment_method: str
    created_at: datetime
    items: List[TransactionItemResponse]
    customer_name: Optional[str] = None

    class Config:
        from_attributes = True

class TransactionResponse(BaseModel):
    id: int
    total_amount: float
    created_at: datetime
    message: str

# ==========================================
# ANALYTICS SCHEMAS
# ==========================================

class DashboardStats(BaseModel):
    today_sales: float
    today_transactions: int
    low_stock_items: int
    total_products: int
    monthly_sales: float
    monthly_transactions: int

class SalesAnalytics(BaseModel):
    date: str
    total_sales: float
    transaction_count: int

# ==========================================
# RECEIPT SCHEMAS
# ==========================================

class ReceiptData(BaseModel):
    transaction_id: int
    store_name: str
    store_address: str
    store_phone: str
    transaction_date: datetime
    items: List[TransactionItemResponse]
    subtotal: float
    discount_amount: float
    total_amount: float
    payment_method: str
    customer_name: Optional[str] = None
    cashier_name: Optional[str] = None        