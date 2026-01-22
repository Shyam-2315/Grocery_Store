"""
Database Migration Script
This script migrates the database schema to support:
1. category_id in products (instead of category string)
2. customer_id and discount fields in transactions
3. New customers and categories tables
"""
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker
import database

def migrate_database():
    """Run database migrations"""
    engine = database.engine
    inspector = inspect(engine)
    
    with engine.connect() as conn:
        # Start transaction
        trans = conn.begin()
        
        try:
            # 1. Create categories table if it doesn't exist
            if 'categories' not in inspector.get_table_names():
                print("Creating categories table...")
                conn.execute(text("""
                    CREATE TABLE categories (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR NOT NULL,
                        description VARCHAR,
                        tenant_id INTEGER NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (tenant_id) REFERENCES tenants(id)
                    );
                    CREATE INDEX idx_categories_tenant ON categories(tenant_id);
                    CREATE INDEX idx_categories_name ON categories(name);
                """))
                print("✓ Categories table created")
            else:
                print("✓ Categories table already exists")
            
            # 2. Create customers table if it doesn't exist
            if 'customers' not in inspector.get_table_names():
                print("Creating customers table...")
                conn.execute(text("""
                    CREATE TABLE customers (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR NOT NULL,
                        email VARCHAR,
                        phone VARCHAR,
                        address VARCHAR,
                        city VARCHAR,
                        state VARCHAR,
                        loyalty_points INTEGER DEFAULT 0,
                        total_purchases FLOAT DEFAULT 0.0,
                        last_purchase_date TIMESTAMP,
                        tenant_id INTEGER NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (tenant_id) REFERENCES tenants(id)
                    );
                    CREATE INDEX idx_customers_tenant ON customers(tenant_id);
                    CREATE INDEX idx_customers_name ON customers(name);
                    CREATE INDEX idx_customers_email ON customers(email);
                    CREATE INDEX idx_customers_phone ON customers(phone);
                """))
                print("✓ Customers table created")
            else:
                print("✓ Customers table already exists")
            
            # 3. Check if products table has category_id column
            products_columns = [col['name'] for col in inspector.get_columns('products')]
            
            if 'category_id' not in products_columns:
                print("Migrating products table...")
                
                # Add category_id column
                conn.execute(text("""
                    ALTER TABLE products 
                    ADD COLUMN category_id INTEGER;
                """))
                print("✓ Added category_id column to products")
                
                # Migrate existing category strings to categories table
                # Get unique categories from products
                result = conn.execute(text("""
                    SELECT DISTINCT category, tenant_id 
                    FROM products 
                    WHERE category IS NOT NULL AND category != ''
                """))
                
                category_mapping = {}  # {tenant_id: {category_name: category_id}}
                
                for row in result:
                    category_name = row[0]
                    tenant_id = row[1]
                    
                    if tenant_id not in category_mapping:
                        category_mapping[tenant_id] = {}
                    
                    # Check if category already exists
                    check = conn.execute(text("""
                        SELECT id FROM categories 
                        WHERE name = :name AND tenant_id = :tenant_id
                    """), {"name": category_name, "tenant_id": tenant_id})
                    
                    existing = check.fetchone()
                    
                    if existing:
                        category_id = existing[0]
                    else:
                        # Create new category
                        insert = conn.execute(text("""
                            INSERT INTO categories (name, tenant_id) 
                            VALUES (:name, :tenant_id) 
                            RETURNING id
                        """), {"name": category_name, "tenant_id": tenant_id})
                        category_id = insert.fetchone()[0]
                    
                    category_mapping[tenant_id][category_name] = category_id
                
                # Update products with category_id
                for tenant_id, categories in category_mapping.items():
                    for category_name, category_id in categories.items():
                        conn.execute(text("""
                            UPDATE products 
                            SET category_id = :category_id 
                            WHERE category = :category_name AND tenant_id = :tenant_id
                        """), {
                            "category_id": category_id,
                            "category_name": category_name,
                            "tenant_id": tenant_id
                        })
                
                print(f"✓ Migrated {sum(len(cats) for cats in category_mapping.values())} categories")
                
                # Add foreign key constraint
                conn.execute(text("""
                    ALTER TABLE products 
                    ADD CONSTRAINT fk_products_category 
                    FOREIGN KEY (category_id) REFERENCES categories(id);
                """))
                print("✓ Added foreign key constraint")
                
                # Optionally, keep old category column for backward compatibility
                # Or remove it: ALTER TABLE products DROP COLUMN category;
                print("✓ Products table migration complete")
            else:
                print("✓ Products table already has category_id column")
            
            # 4. Check and update transactions table
            if 'transactions' in inspector.get_table_names():
                trans_columns = [col['name'] for col in inspector.get_columns('transactions')]
                
                # Add customer_id if missing
                if 'customer_id' not in trans_columns:
                    print("Adding customer_id to transactions...")
                    conn.execute(text("""
                        ALTER TABLE transactions 
                        ADD COLUMN customer_id INTEGER;
                        ALTER TABLE transactions 
                        ADD CONSTRAINT fk_transactions_customer 
                        FOREIGN KEY (customer_id) REFERENCES customers(id);
                    """))
                    print("✓ Added customer_id to transactions")
                
                # Add discount fields if missing
                if 'subtotal' not in trans_columns:
                    print("Adding discount fields to transactions...")
                    conn.execute(text("""
                        ALTER TABLE transactions 
                        ADD COLUMN subtotal FLOAT NOT NULL DEFAULT 0;
                        ALTER TABLE transactions 
                        ADD COLUMN discount_amount FLOAT DEFAULT 0;
                        ALTER TABLE transactions 
                        ADD COLUMN discount_type VARCHAR;
                        ALTER TABLE transactions 
                        ADD COLUMN discount_value FLOAT;
                    """))
                    
                    # Update existing transactions: set subtotal = total_amount
                    conn.execute(text("""
                        UPDATE transactions 
                        SET subtotal = total_amount 
                        WHERE subtotal = 0;
                    """))
                    print("✓ Added discount fields to transactions")
            
            # Commit transaction
            trans.commit()
            print("\n✅ Database migration completed successfully!")
            return True
            
        except Exception as e:
            trans.rollback()
            # Check if error is because columns already exist
            error_str = str(e).lower()
            if 'already exists' in error_str or 'duplicate' in error_str:
                print(f"\n✓ Migration already completed (columns exist)")
                return True
            else:
                print(f"\n❌ Migration failed: {e}")
                raise

if __name__ == "__main__":
    print("Starting database migration...\n")
    migrate_database()
