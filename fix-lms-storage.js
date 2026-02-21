const fs = require('fs');
let code = fs.readFileSync('server/lms-storage.ts', 'utf-8');

const toSnakeCaseFunc = `
// Helper to convert camelCase object keys to snake_case for Supabase
function toSnakeCase(obj: any): any {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj) || obj instanceof Date) return obj;
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => "_" + letter.toLowerCase());
    result[snakeKey] = value;
  }
  return result;
}
`;

if (!code.includes('function toSnakeCase')) {
  code = code.replace(/import \{ supabase \} from "\.\/db";/, 'import { supabase } from "./db";\n' + toSnakeCaseFunc);
}

// Replace .insert(varName)
code = code.replace(/\.insert\(([a-zA-Z0-9_]+)\)/g, '.insert(toSnakeCase($1))');

// Replace .update({ ...varName, updated_at: new Date() })
code = code.replace(/\.update\(\{\s*\.\.\.([a-zA-Z0-9_]+),\s*updated_at:\s*new Date\(\)\s*\}\)/g, '.update({ ...toSnakeCase($1), updated_at: new Date() })');

// E.g. .update({ ...topic })
code = code.replace(/\.update\(\{\s*\.\.\.([a-zA-Z0-9_]+)\s*\}\)/g, '.update(toSnakeCase($1))');

fs.writeFileSync('server/lms-storage.ts', code, 'utf8');
console.log('Fixed lms-storage.ts inserts and updates');
