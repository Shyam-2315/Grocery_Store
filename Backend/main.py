from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from datetime import timedelta, datetime
from typing import List

# Import local modules
import models
import schemas
import utils
import database
import auth

# 1. Initialize Database Tables
# This creates the tables in PostgreSQL if they don't exist
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="GroceryPOS Pro API", version="1.0.0")

# 2. CORS Configuration (Allow Frontend to talk to Backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "GroceryPOS Backend is Online with PostgreSQL"}

# ==========================================
# AUTHENTICATION ENDPOINTS
# ==========================================

@app.post("/api/v1/auth/signup", response_model=schemas.AuthResponse)
def signup(payload: schemas.SignupRequest, db: Session = Depends(database.get_db)):
    """
    Registers a new Tenant (Store) and a new User (Owner).
    Returns an access token for immediate login.
    """
    
    # 1. Check if Email is already registered
    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # 2. Check if Store Code is taken (only if provided)
    if payload.store_code:
        if db.query(models.Tenant).filter(models.Tenant.store_code == payload.store_code).first():
            raise HTTPException(status_code=400, detail="Store Code already taken")

    # 3. Create the Tenant (Store) Record
    new_tenant = models.Tenant(
        business_name=payload.store_name,
        store_code=payload.store_code,  # Model handles auto-generation if None
        contact_phone=payload.contact_phone,
        address=payload.address,
        city=payload.city,
        state=payload.state,
        registration_number=payload.registration_number,
        plan_id=payload.plan_id
    )
    db.add(new_tenant)
    db.commit()
    db.refresh(new_tenant)

    # 4. Create the User (Owner) Record linked to Tenant
    hashed_pwd = utils.get_password_hash(payload.password)
    new_user = models.User(
        email=payload.email,
        first_name=payload.first_name,
        last_name=payload.last_name,
        hashed_password=hashed_pwd,
        terms_accepted=payload.terms_accepted,
        tenant_id=new_tenant.id,
        role="owner"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 5. Generate Access Token (Auto-Login)
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={
            "sub": new_user.email, 
            "role": new_user.role, 
            "tenant_id": new_user.tenant_id
        }, 
        expires_delta=access_token_expires
    )

    return {
        "user_id": new_user.id,
        "store_id": new_tenant.id,
        "access_token": access_token,
        "token_type": "bearer",
        "message": "Account created successfully"
    }

@app.post("/api/v1/auth/login", response_model=schemas.LoginResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(database.get_db)):
    """
    Advanced Login: Checks user existence, account lock status, 
    password validity, and subscription status.
    """
    
    # 1. Fetch User
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    
    # 2. Check if User Exists (Generic error for security)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # 3. Check if Account is Locked
    if user.is_locked:
        raise HTTPException(status_code=403, detail="Account locked. Contact support.")

    # 4. Verify Password
    if not utils.verify_password(payload.password, user.hashed_password):
        # Increment failed attempts
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= 5:
            user.is_locked = True
            db.commit()
            raise HTTPException(status_code=403, detail="Account locked. Too many failed attempts.")
        
        db.commit()
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # 5. Check Subscription Status (via Tenant)
    if user.tenant.subscription_status != 'active':
        raise HTTPException(status_code=402, detail="Subscription expired.")

    # --- SUCCESSFUL LOGIN ---
    
    # Reset security counters & Update login time
    user.failed_login_attempts = 0
    user.is_locked = False
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Generate Token
    expire_minutes = auth.ACCESS_TOKEN_EXPIRE_MINUTES * (10 if payload.remember_me else 1)
    access_token_expires = timedelta(minutes=expire_minutes)
    
    access_token = auth.create_access_token(
        data={"sub": user.email, "role": user.role, "tenant_id": user.tenant_id},
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": expire_minutes * 60,
        "user": {
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "role": user.role
        },
        "store": {
            "id": user.tenant.id,
            "business_name": user.tenant.business_name,
            "subscription_status": user.tenant.subscription_status
        },
        "subscription_status": user.tenant.subscription_status,
        "message": "Login successful"
    }

# ==========================================
# INVENTORY ENDPOINTS
# ==========================================

@app.get("/api/v1/products", response_model=List[schemas.ProductResponse])
def get_products(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Get all products belonging to the logged-in user's store (Tenant).
    """
    return db.query(models.Product).filter(models.Product.tenant_id == current_user.tenant_id).all()

@app.post("/api/v1/products", response_model=schemas.ProductResponse)
def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Add a new product to the inventory.
    """
    # Create the product linked to the current user's tenant
    new_product = models.Product(
        name=product.name,
        barcode=product.barcode,
        category=product.category,
        cost_price=product.cost_price,
        selling_price=product.selling_price,
        stock_quantity=product.stock_quantity,
        min_stock_level=product.min_stock_level,
        tenant_id=current_user.tenant_id
    )
    
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product