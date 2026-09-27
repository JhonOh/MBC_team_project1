from pathlib import Path
import secrets

target = Path(__file__).resolve().parent / '.env'
if target.exists():
    print('.env already exists; nothing changed.')
else:
    with target.open('x', encoding='utf-8') as f:
        f.write('SECRET_KEY=' + secrets.token_hex(32) + '\nGEMINI_API_KEY=\nKAKAO_REST_API_KEY=\nGEMINI_MODEL=gemini-3.6-flash\n')
    print('Created local .env. Enter your own API keys there.')
