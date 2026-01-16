from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Float
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import uuid

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True, index=True)
    business_name = Column(String, nullable=False)
    # Store Code (Auto-generated if not provided)
    store_code = Column(String, unique=True, default=lambda: str(uuid.uuid4())[:8].upper())
    contact_phone = Column(String, nullable=False)
    address = Column(String, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    registration_number = Column(String, nullable=True) 
    
    # Subscription
    plan_id = Column(String, default="basic")
    subscription_status = Column(String, default="active")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    users = relationship("User", back_populates="tenant")
    products = relationship("Product", back_populates="tenant")

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

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    barcode = Column(String, index=True, nullable=True)
    category = Column(String, index=True)
    
    cost_price = Column(Float)  
    selling_price = Column(Float, nullable=False) 
    stock_quantity = Column(Integer, default=0)
    
    min_stock_level = Column(Integer, default=5) 
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    tenant = relationship("Tenant", back_populates="products")