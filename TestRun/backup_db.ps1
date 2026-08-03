# NutriChef Database Backup Script
# This script uses the locally installed Supabase CLI to dump your database.

# 1. Configuration
$ProjectRef = "icsoywmvqyqcqtlfefsx"
$Host = "aws-0-us-east-1.pooler.supabase.com" # Using the pooler host as requested/standard
$Port = "5432"
$User = "postgres"
$OutputFile = "database_dump.sql"

# 2. Get Password Securely
Write-Host "Please enter your Supabase Database Password:" -ForegroundColor Cyan
$Password = Read-Host -AsSecureString
$PasswordPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password))

# 3. Construct Connection String
# Encoded connection string to handle special characters in password
$ConnectionString = "postgresql://$($User):$($PasswordPlain)@$($Host):$($Port)/postgres"

# 4. Run Dump Command
Write-Host "Connecting to Supabase ($ProjectRef)..." -ForegroundColor Yellow
Write-Host "This might take a few seconds..."

try {
    # Check if we are in the right directory to find npx
    if (!(Test-Path "package.json") -and !(Test-Path "node_modules")) {
        Write-Warning "node_modules not found in current directory. Making sure supabase is installed..."
    }
    
    # Execute the dump command via npx
    # We use --db-url to connect directly
    $DumpCmd = "npx"
    $DumpArgs = @("supabase", "db", "dump", "--db-url", "$ConnectionString", "-f", "$OutputFile")
    
    & $DumpCmd $DumpArgs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Success! Backup saved to: $OutputFile" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Backup failed. Please check your password and internet connection." -ForegroundColor Red
    }
}
catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
