import psycopg2, json
conn = psycopg2.connect(host='localhost', port=5432, dbname='optiload', user='postgres', password='postgres')
cur = conn.cursor()
cur.execute('SELECT id, type, dimensions FROM vehicles')
rows = cur.fetchall()
for row in rows:
    dims = row[2] or {}
    v_len = dims.get('length', 0)
    if v_len > 100:
        new_dims = {
            'length': v_len / 100,
            'width': dims.get('width', 2.5) / 100,
            'height': dims.get('height', 2.6) / 100,
        }
        if 'max_weight' in dims:
            new_dims['max_weight'] = dims['max_weight']
        cur.execute("UPDATE vehicles SET dimensions = %s WHERE id = %s", (json.dumps(new_dims), row[0]))
        print(f'Fixed vehicle #{row[0]}: {dims} -> {new_dims}')
conn.commit()
print('All vehicles fixed.')
conn.close()
