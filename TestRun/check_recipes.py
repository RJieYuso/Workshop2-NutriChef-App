
import os
import json
from supabase import create_client, Client

# Correct keys from config.js
SUPABASE_URL = 'https://icsoywmvqyqcqtlfefsx.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imljc295d212cXlxY3F0bGZlZnN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2OTgzNzIsImV4cCI6MjA4MTI3NDM3Mn0.dy33uJZ_f9iOe1QijUe4nRFKUSG5ugpTNZ8nCyN-M2Q'

print(f"Connecting to {SUPABASE_URL}...")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

try:
    print("Checking 'recipes' table...")
    response = supabase.table('recipes').select("*").limit(1).execute()
    print("Success! Table 'recipes' exists.")
    
    if response.data:
        print("Sample row:", json.dumps(response.data[0], indent=2))
        print("Keys found:", list(response.data[0].keys()))
    else:
        print("Table is empty but exists.")
        
except Exception as e:
    print(f"Error accessing 'recipes': {str(e)}")
