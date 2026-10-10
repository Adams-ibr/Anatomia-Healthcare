#!/usr/bin/env python3
"""
Replace ALL backend API calls with Supabase direct calls
"""
import re

# For AdminCourses - replace courseApi calls
def fix_admin_courses():
    with open('src/pages/AdminCourses.tsx', 'r') as f:
        content = f.read()
    
    # Replace imports
    content = re.sub(
        r"import \{ courseApi.*?\} from '\.\./lib/api/auth'",
        "import { coursesApi } from '../lib/supabase'",
        content
    )
    
    # Replace courseApi with coursesApi throughout
    content = content.replace('courseApi.', 'coursesApi.')
    
    # Remove getStoredToken usage
    content = re.sub(r'const token = getStoredToken\(\)[^\n]*\n\s*if \(!token\) return[^\n]*\n', '', content)
    content = re.sub(r'getStoredToken, ', '', content)
    
    with open('src/pages/AdminCourses.tsx', 'w') as f:
        f.write(content)
    print("✓ Fixed AdminCourses.tsx")

# For AdminCategories
def fix_admin_categories():
    with open('src/pages/AdminCategories.tsx', 'r') as f:
        content = f.read()
    
    content = re.sub(
        r"import \{ categoryApi.*?\} from '\.\./lib/api/auth'",
        "import { categoriesApi } from '../lib/supabase'",
        content
    )
    
    content = content.replace('categoryApi.', 'categoriesApi.')
    content = re.sub(r'const token = getStoredToken\(\)[^\n]*\n\s*if \(!token\) return[^\n]*\n', '', content)
    content = re.sub(r'getStoredToken, ', '', content)
    
    with open('src/pages/AdminCategories.tsx', 'w') as f:
        f.write(content)
    print("✓ Fixed AdminCategories.tsx")

# For AdminInstructors
def fix_admin_instructors():
    with open('src/pages/AdminInstructors.tsx', 'r') as f:
        content = f.read()
    
    # Add membersApi import if not present
    if "from '../lib/supabase'" not in content:
        # Find last import from '../lib/...'
        pattern = r"(import .+ from ['\"]\.\.\/lib\/[^'\"]+['\"])"
        matches = list(re.finditer(pattern, content))
        if matches:
            last_import = matches[-1]
            insert_pos = last_import.end()
            new_import = "\nimport { membersApi } from '../lib/supabase'"
            content = content[:insert_pos] + new_import + content[insert_pos:]
    
    with open('src/pages/AdminInstructors.tsx', 'w') as f:
        f.write(content)
    print("✓ Fixed AdminInstructors.tsx")

try:
    fix_admin_courses()
    fix_admin_categories()
    fix_admin_instructors()
    print("\n✅ All API calls replaced!")
except Exception as e:
    print(f"✗ Error: {e}")
