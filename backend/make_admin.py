"""
Script to make a user admin
"""
import sqlite3
import sys

def make_admin(email_or_id):
    conn = sqlite3.connect('subcio.db')
    cursor = conn.cursor()
    
    # Try to find by email or id
    if email_or_id.isdigit():
        cursor.execute('UPDATE users SET role = "super_admin" WHERE id = ?', (int(email_or_id),))
    else:
        cursor.execute('UPDATE users SET role = "super_admin" WHERE email = ?', (email_or_id,))
    
    if cursor.rowcount > 0:
        conn.commit()
        print(f'✅ Kullanıcı super_admin yapıldı!')
    else:
        print(f'❌ Kullanıcı bulunamadı: {email_or_id}')
    
    # Show updated users
    cursor.execute('SELECT id, email, role FROM users')
    rows = cursor.fetchall()
    print('\n📋 Güncel Kullanıcılar:')
    for r in rows:
        role_emoji = '👑' if r[2] == 'super_admin' else '👤'
        print(f'  {role_emoji} ID: {r[0]}, Email: {r[1]}, Role: {r[2]}')
    
    conn.close()

if __name__ == '__main__':
    if len(sys.argv) > 1:
        make_admin(sys.argv[1])
    else:
        # Default: make first user admin
        make_admin('1')
