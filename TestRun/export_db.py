import os
import json
from supabase import create_client, Client
from datetime import date, datetime

# Configuration (from nutrichef-global/src/config.js)
SUPABASE_URL = 'https://icsoywmvqyqcqtlfefsx.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imljc295d212cXlxY3F0bGZlZnN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2OTgzNzIsImV4cCI6MjA4MTI3NDM3Mn0.dy33uJZ_f9iOe1QijUe4nRFKUSG5ugpTNZ8nCyN-M2Q'

# Initialize Supabase Client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

OUTPUT_FILE = 'database_dump.sql'
SCHEMA_FILE = 'database_schema.sql'

def serialize_value(val):
    if val is None:
        return 'NULL'
    if isinstance(val, (int, float)):
        return str(val)
    if isinstance(val, (dict, list)):
        return "'" + json.dumps(val).replace("'", "''") + "'"
    if isinstance(val, bool):
        return 'TRUE' if val else 'FALSE'
    return "'" + str(val).replace("'", "''") + "'"

def export_table(table_name):
    print(f"DTO Fetching {table_name}...")
    try:
        response = supabase.table(table_name).select("*").execute()
        rows = response.data
        
        if not rows:
            return f"\n-- No data for {table_name}\n"

        # Get headers from first row
        headers = rows[0].keys()
        columns = ", ".join(headers)
        
        sql_statements = [f"\n-- Data for {table_name}"]
        
        for row in rows:
            values = [serialize_value(row[col]) for col in headers]
            values_str = ", ".join(values)
            sql_statements.append(f"INSERT INTO public.{table_name} ({columns}) VALUES ({values_str});")
            
        return "\n".join(sql_statements) + "\n"
    except Exception as e:
        print(f"Error fetching {table_name}: {e}")
        return f"\n-- Error fetching data for {table_name}: {e}\n"

def main():
    print("Starting Database Dump...")
    
    # 1. Read Schema
    if os.path.exists(SCHEMA_FILE):
        with open(SCHEMA_FILE, 'r', encoding='utf-8') as f:
            full_dump = f.read()
    else:
        full_dump = "-- Schema file not found, creating from scratch...\n"

    full_dump += "\n\n-- DUMP DATA START --\n"

    # 2. Export Tables
    # Updated table names based on API feedback
    tables = ['users', 'user_inventory', 'saved_meal_plans', 'recipes']
    
    for table in tables:
        full_dump += export_table(table)
        
    full_dump += "\n-- DUMP DATA END --\n"
    
    # 3. Write Info
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(full_dump)
        
    print(f"✅ Backup created successfully: {OUTPUT_FILE}")

if __name__ == '__main__':
    main()
