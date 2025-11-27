"""
Migration script to add role column to users table
"""
import sqlite3

def migrate():
    conn = sqlite3.connect('subcio.db')
    cursor = conn.cursor()
    
    # Check if role column exists
    cursor.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'role' not in columns:
        cursor.execute('ALTER TABLE users ADD COLUMN role TEXT DEFAULT "user"')
        conn.commit()
        print('✅ Role kolonu eklendi!')
    else:
        print('ℹ️ Role kolonu zaten mevcut')
    
    # List all users
    cursor.execute('SELECT id, email, role FROM users')
    rows = cursor.fetchall()
    print('\n📋 Mevcut Kullanıcılar:')
    if rows:
        for r in rows:
            print(f'  ID: {r[0]}, Email: {r[1]}, Role: {r[2]}')
    else:
        print('  Henüz kullanıcı yok')
    
    conn.close()

if __name__ == '__main__':
    migrate()
