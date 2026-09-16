with open('/Users/user/Documents/Anatomia-Healthcare/server/seed.ts', 'r') as f:
    content = f.read()

content = content.replace("}\n\nseedDatabase()", "} catch (error) { console.error(error); }\n}\n\nseedDatabase()")
with open('/Users/user/Documents/Anatomia-Healthcare/server/seed.ts', 'w') as f:
    f.write(content)
