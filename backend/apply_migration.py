from app.core.database.session import engine
from sqlalchemy import text, inspect

with engine.begin() as conn:
    # Add optimization columns
    try:
        conn.execute(text("ALTER TABLE vehicles ADD COLUMN optimization_mode VARCHAR(32) NOT NULL DEFAULT 'stability_optimized'"))
        print('Added optimization_mode')
    except Exception as e:
        print(f'optimization_mode: {e}')
    
    try:
        conn.execute(text("ALTER TABLE vehicles ADD COLUMN space_weight FLOAT NOT NULL DEFAULT 0.5"))
        print('Added space_weight')
    except Exception as e:
        print(f'space_weight: {e}')
    
    try:
        conn.execute(text("ALTER TABLE vehicles ADD COLUMN stability_weight FLOAT NOT NULL DEFAULT 0.4"))
        print('Added stability_weight')
    except Exception as e:
        print(f'stability_weight: {e}')
    
    try:
        conn.execute(text("ALTER TABLE vehicles ADD COLUMN cost_weight FLOAT NOT NULL DEFAULT 0.1"))
        print('Added cost_weight')
    except Exception as e:
        print(f'cost_weight: {e}')

# Verify
inspector = inspect(engine)
veh_cols = sorted([col['name'] for col in inspector.get_columns('vehicles')])
print('\nVehicle columns:', veh_cols)
