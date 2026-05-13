#!/usr/bin/env python3
"""
OptiLoad Environment Configuration Validator
Checks all environment variables are properly configured for deployment
"""

import os
import sys
from pathlib import Path

# ANSI color codes
GREEN = '\033[92m'
YELLOW = '\033[93m'
RED = '\033[91m'
BLUE = '\033[94m'
RESET = '\033[0m'
BOLD = '\033[1m'

def check_file(path, required=True):
    """Check if file exists"""
    exists = Path(path).exists()
    status = f"{GREEN}✓{RESET}" if exists else f"{RED}✗{RESET}"
    req = " (required)" if required else " (optional)"
    print(f"  {status} {Path(path).name}{req}")
    return exists

def check_env_var(var_name, required=True, is_production=False):
    """Check if environment variable is set"""
    value = os.getenv(var_name)
    has_value = bool(value and value.strip())
    
    if has_value:
        # Mask sensitive values
        if any(x in var_name for x in ['SECRET', 'PASSWORD', 'KEY', 'TOKEN', 'URL']):
            display = value[:20] + "..." if len(value) > 20 else value
        else:
            display = value
        status = f"{GREEN}✓{RESET}"
        note = f"({display})"
    else:
        status = f"{RED}✗{RESET}"
        note = "(not set)"
    
    req = " [REQUIRED]" if required else " [optional]"
    prod_only = " [PRODUCTION]" if is_production else ""
    
    print(f"  {status} {var_name}{req}{prod_only} {note}")
    return has_value

def main():
    print(f"\n{BOLD}{BLUE}OptiLoad Environment Configuration Validator{RESET}\n")
    
    # Determine environment
    env = os.getenv('OPTILOAD_ENVIRONMENT', 'local').lower()
    is_prod = env == 'production'
    
    print(f"Detected environment: {BOLD}{env}{RESET}\n")
    
    # Check backend configuration
    print(f"{BOLD}Backend Configuration:{RESET}")
    print(f"  Environment: {env}")
    
    backend_env_vars = {
        'OPTILOAD_ENVIRONMENT': True,
        'OPTILOAD_DATABASE_URL': True,
        'OPTILOAD_JWT_SECRET_KEY': True,
        'OPTILOAD_CORS_ALLOWED_ORIGINS': True,
        'OPTILOAD_ALLOW_PUBLIC_REGISTRATION': False,
        'OPTILOAD_RATE_LIMIT_BACKEND': False,
        'OPTILOAD_REDIS_URL': is_prod,  # Required in production
        'DEMO_MODE': False,
    }
    
    checks_passed = 0
    checks_failed = 0
    
    for var, required in backend_env_vars.items():
        is_prod_only = var == 'OPTILOAD_REDIS_URL' and is_prod
        if check_env_var(var, required=required, is_production=is_prod_only):
            checks_passed += 1
        else:
            checks_failed += 1
    
    # Check frontend configuration
    print(f"\n{BOLD}Frontend Configuration:{RESET}")
    
    frontend_env_file = Path('.env.local') if env == 'local' else Path('.env.production')
    if frontend_env_file.exists():
        with open(frontend_env_file) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    if '=' in line:
                        var, value = line.split('=', 1)
                        print(f"  {GREEN}✓{RESET} {var} = {value}")
                        checks_passed += 1
    else:
        print(f"  {RED}✗{RESET} {frontend_env_file} not found")
        checks_failed += 1
    
    # Check configuration files
    print(f"\n{BOLD}Configuration Files:{RESET}")
    
    config_files = {
        'backend/.env': True,
        'backend/.env.example': False,
        'backend/.env.production': False,
        'frontend/.env.example': False,
        'frontend/.env.local': env == 'local',
        'frontend/.env.production': env == 'production',
    }
    
    for file_path, required in config_files.items():
        if check_file(file_path, required=required):
            checks_passed += 1
        else:
            checks_failed += 1
    
    # Summary
    print(f"\n{BOLD}Summary:{RESET}")
    print(f"  {GREEN}Passed: {checks_passed}{RESET}")
    print(f"  {RED}Failed: {checks_failed}{RESET}")
    
    if is_prod:
        print(f"\n{BOLD}Production Checklist:{RESET}")
        prod_checks = [
            ('JWT Secret is not default', 
             os.getenv('OPTILOAD_JWT_SECRET_KEY', '') != 'dev-secret-key-change-in-production-32chars'),
            ('Database URL is set (Neon)',
             bool(os.getenv('OPTILOAD_DATABASE_URL'))),
            ('Redis URL is set',
             bool(os.getenv('OPTILOAD_REDIS_URL'))),
            ('Public registration is disabled',
             os.getenv('OPTILOAD_ALLOW_PUBLIC_REGISTRATION', '').lower() == 'false'),
            ('Demo mode is disabled',
             os.getenv('OPTILOAD_DEMO_MODE', '').lower() == 'false'),
        ]
        
        all_prod_ok = True
        for check_name, check_result in prod_checks:
            status = f"{GREEN}✓{RESET}" if check_result else f"{RED}✗{RESET}"
            print(f"  {status} {check_name}")
            if not check_result:
                all_prod_ok = False
        
        if all_prod_ok:
            print(f"\n{GREEN}{BOLD}All production checks passed!{RESET}")
        else:
            print(f"\n{RED}{BOLD}Some production checks failed!{RESET}")
            return 1
    
    if checks_failed == 0:
        print(f"\n{GREEN}{BOLD}Configuration is valid!{RESET}")
        return 0
    else:
        print(f"\n{RED}{BOLD}Configuration has errors!{RESET}")
        return 1

if __name__ == '__main__':
    sys.exit(main())
