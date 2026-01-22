from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, text
from fastapi.middleware.cors import CORSMiddleware
from datetime import timedelta, datetime, timezone, date
from typing import List, Optional
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import local modules
import models
import schemas
import utils
import database
import auth
from config import settings

# 1. Initialize Database Tables
# This creates the tables in PostgreSQL if they don't exist
models.Base.metadata.create_all(bind=database.engine)

# 2. Run database migration if needed (only once, safe to run multiple times)
try:
    from migrate_database import migrate_database
    print("Running database migration...")
    migrate_database()
except ImportError:
    print("Migration script not found, skipping...")
except Exception as e:
    print(f"Migration completed or already done: {str(e)[:100]}")
    # Continue - migration might already be done

app = FastAPI(
    title="GroceryPOS Pro API",
    version="1.0.0",
    description="Complete POS system for grocery stores",
    docs_url="/docs" if settings.DEBUG else None,  # Disable docs in production
    redoc_url="/redoc" if settings.DEBUG else None
)

# Add logging middleware
from middleware import LoggingMiddleware
app.add_middleware(LoggingMiddleware)

# Custom exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Better error messages for validation errors"""
    errors = exc.errors()
    error_details = []
    for error in errors:
        error_details.append({
            "field": ".".join(str(x) for x in error.get("loc", [])),
            "message": error.get("msg"),
            "type": error.get("type")
        })
    return JSONResponse(
        status_code=422,
        content={
            "detail": error_details,
            "message": "Validation error. Please check your input data."
        }
    )

# 2. CORS Configuration (Allow Frontend to talk to Backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "message": "GroceryPOS Backend is Online",
        "version": "1.0.0",
        "status": "healthy"
    }

@app.get("/health")
def health_check():
    """Health check endpoint for monitoring and load balancers"""
    try:
        # Test database connection
        db = next(database.get_db())
        db.execute(text("SELECT 1"))
        db.close()
        return {
            "status": "healthy",
            "database": "connected",
            "version": "1.0.0",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "database": "disconnected",
                "error": str(e) if settings.DEBUG else "Service unavailable",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        )

@app.get("/api/v1/info")
def get_api_info():
    """Get API information"""
    return {
        "name": "GroceryPOS Pro API",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "docs": "/docs" if settings.DEBUG else "disabled"
    }

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
    # Only set store_code if provided, otherwise it will be auto-generated
    tenant_data = {
        "business_name": payload.store_name,
        "contact_phone": payload.contact_phone,
        "address": payload.address,
        "city": payload.city,
        "state": payload.state,
        "registration_number": payload.registration_number,
        "plan_id": payload.plan_id
    }
    if payload.store_code:
        tenant_data["store_code"] = payload.store_code
    
    new_tenant = models.Tenant(**tenant_data)
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
    user.last_login = datetime.now(timezone.utc)
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
    barcode: Optional[str] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Get all products belonging to the logged-in user's store (Tenant).
    Optionally filter by barcode.
    """
    query = db.query(models.Product).filter(models.Product.tenant_id == current_user.tenant_id)
    
    # Filter by barcode if provided
    if barcode:
        query = query.filter(models.Product.barcode == barcode)
    
    products = query.all()
    
    # Add category_name to each product
    result = []
    for product in products:
        product_dict = {
            "id": product.id,
            "name": product.name,
            "barcode": product.barcode,
            "category_id": product.category_id,
            "cost_price": product.cost_price,
            "selling_price": product.selling_price,
            "stock_quantity": product.stock_quantity,
            "min_stock_level": product.min_stock_level,
            "tenant_id": product.tenant_id,
            "category_name": product.category.name if product.category else None
        }
        result.append(product_dict)
    return result

@app.post("/api/v1/products", response_model=schemas.ProductResponse)
def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Add a new product to the inventory.
    """
    # Verify category belongs to tenant if provided
    if product.category_id is not None and product.category_id != 0:
        category = db.query(models.Category).filter(
            models.Category.id == product.category_id,
            models.Category.tenant_id == current_user.tenant_id
        ).first()
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
    
    # Create the product linked to the current user's tenant
    new_product = models.Product(
        name=product.name,
        barcode=product.barcode,
        category_id=product.category_id,
        cost_price=product.cost_price,
        selling_price=product.selling_price,
        stock_quantity=product.stock_quantity,
        min_stock_level=product.min_stock_level,
        tenant_id=current_user.tenant_id
    )
    
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    
    # Add category name to response
    response_data = {
        **new_product.__dict__,
        "category_name": new_product.category.name if new_product.category else None
    }
    return response_data

@app.put("/api/v1/products/{product_id}", response_model=schemas.ProductResponse)
def update_product(
    product_id: int,
    product_update: schemas.ProductUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Update an existing product. Only updates provided fields.
    """
    # Find product and verify it belongs to the user's tenant
    product = db.query(models.Product).filter(
        models.Product.id == product_id,
        models.Product.tenant_id == current_user.tenant_id
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Verify category belongs to tenant if provided
    update_dict = product_update.dict(exclude_unset=True)
    if 'category_id' in update_dict and product_update.category_id is not None and product_update.category_id != 0:
        category = db.query(models.Category).filter(
            models.Category.id == product_update.category_id,
            models.Category.tenant_id == current_user.tenant_id
        ).first()
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
    
    # Update only provided fields
    update_data = product_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    
    db.commit()
    db.refresh(product)
    
    # Add category name to response
    response_data = {
        **product.__dict__,
        "category_name": product.category.name if product.category else None
    }
    return response_data

@app.delete("/api/v1/products/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Delete a product from the inventory.
    """
    # Find product and verify it belongs to the user's tenant
    product = db.query(models.Product).filter(
        models.Product.id == product_id,
        models.Product.tenant_id == current_user.tenant_id
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully"}

@app.get("/api/v1/products/by-barcode/{barcode}", response_model=schemas.ProductResponse)
def get_product_by_barcode(
    barcode: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get a product by barcode - useful for barcode scanner."""
    product = db.query(models.Product).filter(
        models.Product.barcode == barcode,
        models.Product.tenant_id == current_user.tenant_id
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product_dict = {
        "id": product.id,
        "name": product.name,
        "barcode": product.barcode,
        "category_id": product.category_id,
        "cost_price": product.cost_price,
        "selling_price": product.selling_price,
        "stock_quantity": product.stock_quantity,
        "min_stock_level": product.min_stock_level,
        "tenant_id": product.tenant_id,
        "category_name": product.category.name if product.category else None
    }
    return product_dict

# ==========================================
# CATEGORY ENDPOINTS
# ==========================================

@app.get("/api/v1/categories", response_model=List[schemas.CategoryResponse])
def get_categories(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get all categories for the current tenant."""
    return db.query(models.Category).filter(
        models.Category.tenant_id == current_user.tenant_id
    ).all()

@app.post("/api/v1/categories", response_model=schemas.CategoryResponse)
def create_category(
    category: schemas.CategoryCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Create a new category."""
    new_category = models.Category(
        name=category.name,
        description=category.description,
        tenant_id=current_user.tenant_id
    )
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    return new_category

@app.put("/api/v1/categories/{category_id}", response_model=schemas.CategoryResponse)
def update_category(
    category_id: int,
    category_update: schemas.CategoryCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Update a category."""
    category = db.query(models.Category).filter(
        models.Category.id == category_id,
        models.Category.tenant_id == current_user.tenant_id
    ).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    category.name = category_update.name
    category.description = category_update.description
    db.commit()
    db.refresh(category)
    return category

@app.delete("/api/v1/categories/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Delete a category."""
    category = db.query(models.Category).filter(
        models.Category.id == category_id,
        models.Category.tenant_id == current_user.tenant_id
    ).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if any products use this category
    products_count = db.query(models.Product).filter(
        models.Product.category_id == category_id
    ).count()
    
    if products_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete category. {products_count} product(s) are using it."
        )
    
    db.delete(category)
    db.commit()
    return {"message": "Category deleted successfully"}

# ==========================================
# CUSTOMER ENDPOINTS
# ==========================================

@app.get("/api/v1/customers", response_model=List[schemas.CustomerResponse])
def get_customers(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get all customers for the current tenant."""
    query = db.query(models.Customer).filter(
        models.Customer.tenant_id == current_user.tenant_id
    )
    
    if search:
        query = query.filter(
            (models.Customer.name.ilike(f"%{search}%")) |
            (models.Customer.phone.ilike(f"%{search}%")) |
            (models.Customer.email.ilike(f"%{search}%"))
        )
    
    return query.order_by(models.Customer.name).offset(skip).limit(limit).all()

@app.post("/api/v1/customers", response_model=schemas.CustomerResponse)
def create_customer(
    customer: schemas.CustomerCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Create a new customer."""
    new_customer = models.Customer(
        name=customer.name,
        email=customer.email,
        phone=customer.phone,
        address=customer.address,
        city=customer.city,
        state=customer.state,
        tenant_id=current_user.tenant_id
    )
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    return new_customer

@app.put("/api/v1/customers/{customer_id}", response_model=schemas.CustomerResponse)
def update_customer(
    customer_id: int,
    customer_update: schemas.CustomerUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Update a customer."""
    customer = db.query(models.Customer).filter(
        models.Customer.id == customer_id,
        models.Customer.tenant_id == current_user.tenant_id
    ).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    update_data = customer_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(customer, field, value)
    
    db.commit()
    db.refresh(customer)
    return customer

@app.delete("/api/v1/customers/{customer_id}")
def delete_customer(
    customer_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Delete a customer."""
    customer = db.query(models.Customer).filter(
        models.Customer.id == customer_id,
        models.Customer.tenant_id == current_user.tenant_id
    ).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    db.delete(customer)
    db.commit()
    return {"message": "Customer deleted successfully"}

@app.get("/api/v1/customers/{customer_id}", response_model=schemas.CustomerResponse)
def get_customer(
    customer_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get a specific customer."""
    customer = db.query(models.Customer).filter(
        models.Customer.id == customer_id,
        models.Customer.tenant_id == current_user.tenant_id
    ).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    return customer

# ==========================================
# TRANSACTION ENDPOINTS (POS) - NEW SECTION
# ==========================================

@app.post("/api/v1/transactions/create", response_model=schemas.TransactionResponse)
def create_transaction(
    payload: schemas.TransactionCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Process a Sale:
    1. Validate Customer (if provided)
    2. Calculate Subtotal
    3. Apply Discount (if provided)
    4. Deduct Stock
    5. Save Transaction
    6. Update Customer Stats
    """
    subtotal = 0.0
    transaction_items = []

    # 1. Validate Customer if provided
    customer = None
    if payload.customer_id:
        customer = db.query(models.Customer).filter(
            models.Customer.id == payload.customer_id,
            models.Customer.tenant_id == current_user.tenant_id
        ).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")

    # 2. Validate Items & Calculate Subtotal
    for item in payload.items:
        # Fetch fresh product data to ensure price/stock is correct
        # Also verify product belongs to the current user's tenant
        product_db = db.query(models.Product).filter(
            models.Product.id == item.product_id,
            models.Product.tenant_id == current_user.tenant_id
        ).first()
        
        if not product_db:
            raise HTTPException(status_code=404, detail=f"Product {item.product_name} not found")
        
        # Check if enough stock exists
        if product_db.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=400, 
                detail=f"Not enough stock for {product_db.name}. Available: {product_db.stock_quantity}"
            )

        # Deduct Stock
        product_db.stock_quantity -= item.quantity
        
        # Calculate Line Total
        line_total = product_db.selling_price * item.quantity
        subtotal += line_total
        
        # Prepare Item Record for Database
        transaction_items.append(models.TransactionItem(
            product_id=product_db.id,
            product_name=product_db.name,
            quantity=item.quantity,
            unit_price=product_db.selling_price,
            total_price=line_total
        ))

    # 3. Calculate Discount
    discount_amount = 0.0
    if payload.discount_type and payload.discount_value:
        if payload.discount_type == 'percentage':
            if payload.discount_value < 0 or payload.discount_value > 100:
                raise HTTPException(status_code=400, detail="Discount percentage must be between 0 and 100")
            discount_amount = subtotal * (payload.discount_value / 100)
        elif payload.discount_type == 'fixed':
            if payload.discount_value < 0:
                raise HTTPException(status_code=400, detail="Discount amount cannot be negative")
            discount_amount = min(payload.discount_value, subtotal)  # Can't discount more than subtotal
        else:
            raise HTTPException(status_code=400, detail="Invalid discount type. Use 'percentage' or 'fixed'")

    total_amount = subtotal - discount_amount

    # 4. Create Transaction Record
    new_txn = models.Transaction(
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
        customer_id=payload.customer_id,
        subtotal=subtotal,
        discount_amount=discount_amount,
        discount_type=payload.discount_type,
        discount_value=payload.discount_value,
        total_amount=total_amount,
        payment_method=payload.payment_method
    )
    db.add(new_txn)
    db.commit()
    db.refresh(new_txn)

    # 5. Save Items Linked to Transaction
    for txn_item in transaction_items:
        txn_item.transaction_id = new_txn.id
        db.add(txn_item)
    
    # 6. Update Customer Stats if customer exists
    if customer:
        customer.total_purchases += total_amount
        customer.last_purchase_date = datetime.now(timezone.utc)
        # Award loyalty points (1 point per dollar spent)
        customer.loyalty_points += int(total_amount)
        db.commit()

    db.commit()

    return {
        "id": new_txn.id, 
        "total_amount": total_amount, 
        "created_at": new_txn.created_at,
        "message": "Sale successful"
    }

@app.get("/api/v1/transactions", response_model=List[schemas.TransactionDetailResponse])
def get_transactions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Get transaction history for the current tenant.
    """
    transactions = db.query(models.Transaction).filter(
        models.Transaction.tenant_id == current_user.tenant_id
    ).order_by(models.Transaction.created_at.desc()).offset(skip).limit(limit).all()
    
    return transactions

@app.get("/api/v1/transactions/{transaction_id}", response_model=schemas.TransactionDetailResponse)
def get_transaction(
    transaction_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Get detailed information about a specific transaction.
    """
    transaction = db.query(models.Transaction).filter(
        models.Transaction.id == transaction_id,
        models.Transaction.tenant_id == current_user.tenant_id
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Add customer name to response
    response_data = {
        **transaction.__dict__,
        "customer_name": transaction.customer.name if transaction.customer else None
    }
    return response_data

# ==========================================
# ANALYTICS ENDPOINTS
# ==========================================

@app.get("/api/v1/analytics/dashboard", response_model=schemas.DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Get dashboard statistics: today's sales, transactions, low stock items, etc.
    """
    today = date.today()
    today_start = datetime.combine(today, datetime.min.time()).replace(tzinfo=timezone.utc)
    today_end = datetime.combine(today, datetime.max.time()).replace(tzinfo=timezone.utc)
    
    # Today's sales and transactions
    today_stats = db.query(
        func.sum(models.Transaction.total_amount).label('total_sales'),
        func.count(models.Transaction.id).label('transaction_count')
    ).filter(
        and_(
            models.Transaction.tenant_id == current_user.tenant_id,
            models.Transaction.created_at >= today_start,
            models.Transaction.created_at <= today_end
        )
    ).first()
    
    today_sales = float(today_stats.total_sales or 0)
    today_transactions = int(today_stats.transaction_count or 0)
    
    # Monthly stats (current month)
    month_start = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly_stats = db.query(
        func.sum(models.Transaction.total_amount).label('total_sales'),
        func.count(models.Transaction.id).label('transaction_count')
    ).filter(
        and_(
            models.Transaction.tenant_id == current_user.tenant_id,
            models.Transaction.created_at >= month_start
        )
    ).first()
    
    monthly_sales = float(monthly_stats.total_sales or 0)
    monthly_transactions = int(monthly_stats.transaction_count or 0)
    
    # Low stock items
    low_stock_count = db.query(models.Product).filter(
        and_(
            models.Product.tenant_id == current_user.tenant_id,
            models.Product.stock_quantity <= models.Product.min_stock_level
        )
    ).count()
    
    # Total products
    total_products = db.query(models.Product).filter(
        models.Product.tenant_id == current_user.tenant_id
    ).count()
    
    return {
        "today_sales": today_sales,
        "today_transactions": today_transactions,
        "low_stock_items": low_stock_count,
        "total_products": total_products,
        "monthly_sales": monthly_sales,
        "monthly_transactions": monthly_transactions
    }

@app.get("/api/v1/analytics/sales", response_model=List[schemas.SalesAnalytics])
def get_sales_analytics(
    days: int = 30,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Get daily sales analytics for the last N days.
    """
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    # Group transactions by date
    daily_sales = db.query(
        func.date(models.Transaction.created_at).label('date'),
        func.sum(models.Transaction.total_amount).label('total_sales'),
        func.count(models.Transaction.id).label('transaction_count')
    ).filter(
        and_(
            models.Transaction.tenant_id == current_user.tenant_id,
            models.Transaction.created_at >= start_date
        )
    ).group_by(func.date(models.Transaction.created_at)).order_by('date').all()
    
    result = []
    for row in daily_sales:
        result.append({
            "date": row.date.isoformat() if isinstance(row.date, date) else str(row.date),
            "total_sales": float(row.total_sales or 0),
            "transaction_count": int(row.transaction_count or 0)
        })
    
    return result

# ==========================================
# RECEIPT ENDPOINTS
# ==========================================

@app.get("/api/v1/transactions/{transaction_id}/receipt", response_model=schemas.ReceiptData)
def get_receipt(
    transaction_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Get receipt data for printing.
    """
    transaction = db.query(models.Transaction).filter(
        models.Transaction.id == transaction_id,
        models.Transaction.tenant_id == current_user.tenant_id
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    tenant = current_user.tenant
    
    return {
        "transaction_id": transaction.id,
        "store_name": tenant.business_name,
        "store_address": f"{tenant.address}, {tenant.city}, {tenant.state}",
        "store_phone": tenant.contact_phone,
        "transaction_date": transaction.created_at,
        "items": transaction.items,
        "subtotal": transaction.subtotal,
        "discount_amount": transaction.discount_amount,
        "total_amount": transaction.total_amount,
        "payment_method": transaction.payment_method,
        "customer_name": transaction.customer.name if transaction.customer else None,
        "cashier_name": f"{current_user.first_name} {current_user.last_name}"
    }