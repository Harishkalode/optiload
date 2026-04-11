import psycopg2, json
conn = psycopg2.connect(host='localhost', port=5432, dbname='optiload', user='postgres', password='postgres')
cur = conn.cursor()
cur.execute('SELECT id, type, dimensions FROM vehicles')
rows = cur.fetchall()
for row in rows:
    dims = row[2] or {}
    v_len = dims.get('length', 0)
    print(f'Vehicle #{row[0]}: type={row[1]}, length={v_len}', end='')
    if v_len > 100:
        print(f' -> NEEDS FIX (cm: {v_len/100}m)')
    elif v_len < 1:
        print(f' -> NEEDS FIX (too small!)')
    else:
        print(' -> OK')
conn.close()
