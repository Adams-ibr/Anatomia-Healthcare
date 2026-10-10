#!/usr/bin/env python3
import re

# Map of files to their API imports
files_to_fix = {
    'src/pages/AdminPartners.tsx': ('partnersApi', 'partners'),
    'src/pages/AdminProducts.tsx': ('productsApi', 'products'),
    'src/pages/AdminArticles.tsx': ('articlesApi', 'articles'),
    'src/pages/AdminDepartments.tsx': ('departmentsApi', 'departments'),
    'src/pages/AdminFaq.tsx': ('faqApi', 'faqs'),
    'src/pages/AdminGallery.tsx': ('galleryApi', 'items'),
    'src/pages/AdminCareers.tsx': ('careersApi', 'jobs'),
}

for filepath, (api_name, state_name) in files_to_fix.items():
    try:
        with open(filepath, 'r') as f:
            content = f.read()
        
        # Check if already has supabase import
        if "from '../lib/supabase'" in content:
            print(f"✓ {filepath} already fixed")
            continue
        
        # Add import
        if api_name not in content:
            # Find last import from '../lib/...'
            pattern = r"(import .+ from ['\"]\.\.\/lib\/[^'\"]+['\"])"
            matches = list(re.finditer(pattern, content))
            if matches:
                last_import = matches[-1]
                insert_pos = last_import.end()
                new_import = f"\nimport {{ {api_name} }} from '../lib/supabase'"
                content = content[:insert_pos] + new_import + content[insert_pos:]
        
        with open(filepath, 'w') as f:
            f.write(content)
        
        print(f"✓ Added import to {filepath}")
    
    except FileNotFoundError:
        print(f"✗ File not found: {filepath}")
    except Exception as e:
        print(f"✗ Error: {filepath}: {e}")

print("\n✅ Imports added! Now run the useEffect replacement script.")
