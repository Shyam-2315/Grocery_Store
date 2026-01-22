from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Float, event
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, timezone
import uuid

def generate_store_code():
    """Generate a unique store code"""
    return str(uuid.uuid4())[:8].upper()

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True, index=True)
    business_name = Column(String, nullable=False)
    # Store Code (Auto-generated if not provided)
    store_code = Column(String, unique=True, nullable=True)
    contact_phone = Column(String, nullable=False)
    address = Column(String, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    registration_number = Column(String, nullable=True) 
    
    # Subscription
    plan_id = Column(String, default="basic")
    subscription_status = Column(String, default="active")
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    users = relationship("User", back_populates="tenant")
    products = relationship("Product", back_populates="tenant")
    customers = relationship("Customer", back_populates="tenant")
    categories = relationship("Category", back_populates="tenant")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    role = Column(String, default="owner")
    is_active = Column(Boolean, default=True)
    terms_accepted = Column(Boolean, default=False)
    
    # Security Fields
    last_login = Column(DateTime, nullable=True)
    failed_login_attempts = Column(Integer, default=0)
    is_locked = Column(Boolean, default=False)
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    tenant = relationship("Tenant", back_populates="users")
    transactions = relationship("Transaction", back_populates="cashier")

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(String, nullable=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    tenant = relationship("Tenant", back_populates="categories")
    products = relationship("Product", back_populates="category")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    barcode = Column(String, index=True, nullable=True, unique=False)  # Allow duplicates for now
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    category = relationship("Category", back_populates="products")
    
    cost_price = Column(Float)  
    selling_price = Column(Float, nullable=False) 
    stock_quantity = Column(Integer, default=0)
    
    min_stock_level = Column(Integer, default=5) 
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    tenant = relationship("Tenant", back_populates="products")
   
# ... existing imports ...

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    email = Column(String, nullable=True, index=True)
    phone = Column(String, nullable=True, index=True)
    address = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    loyalty_points = Column(Integer, default=0)
    total_purchases = Column(Float, default=0.0)
    last_purchase_date = Column(DateTime, nullable=True)
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    tenant = relationship("Tenant", back_populates="customers")
    transactions = relationship("Transaction", back_populates="customer")
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    user_id = Column(Integer, ForeignKey("users.id")) # Cashier
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    
    subtotal = Column(Float, nullable=False)
    discount_amount = Column(Float, default=0.0)
    discount_type = Column(String, nullable=True) # 'percentage' or 'fixed'
    discount_value = Column(Float, nullable=True)
    total_amount = Column(Float, nullable=False)
    payment_method = Column(String, default="cash") # cash, card, upi
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    items = relationship("TransactionItem", back_populates="transaction")
    cashier = relationship("User", back_populates="transactions")
    customer = relationship("Customer", back_populates="transactions")

# Event listener to auto-generate store_code if None
@event.listens_for(Tenant, 'before_insert')
def receive_before_insert(mapper, connection, target):
    """Auto-generate store_code if not provided"""
    if target.store_code is None:
        target.store_code = generate_store_code()

class TransactionItem(Base):
    __tablename__ = "transaction_items"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    
    product_name = Column(String) # Snapshot of name at time of sale
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False) # Snapshot of price at time of sale
    total_price = Column(Float, nullable=False) # qty * unit_price
    
    transaction = relationship("Transaction", back_populates="items")    