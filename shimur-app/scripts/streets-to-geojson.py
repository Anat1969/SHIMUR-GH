# Converts the municipality streets shapefile (Israel TM Grid) to WGS84 GeoJSON for the map.
# Run: pip install pyshp pyproj && python scripts/streets-to-geojson.py ../data/gis/rehovot/rehevot public/gis/ashdod-streets.geojson
import json, math, sys, shapefile
from pyproj import Transformer
src, out = sys.argv[1], sys.argv[2]
r = shapefile.Reader(src, encoding='utf-8')
prj = open(src + '.prj').read()
t = Transformer.from_crs(prj, 'EPSG:4326', always_xy=True)
feats = []
pts_in = pts_out = 0
for sr in r.iterShapeRecords():
    rec = sr.record.as_dict()
    parts = list(sr.shape.parts) + [len(sr.shape.points)]
    lines = []
    for a, b in zip(parts[:-1], parts[1:]):
        seg = sr.shape.points[a:b]
        pts_in += len(seg)
        keep = [seg[0]]
        for p in seg[1:-1]:
            if math.dist(p, keep[-1]) >= 1.0: keep.append(p)  # drop points under 1 m apart (metres, ITM)
        if len(seg) > 1: keep.append(seg[-1])
        ll = [[round(x, 6), round(y, 6)] for x, y in (t.transform(px, py) for px, py in keep)]
        pts_out += len(ll)
        if len(ll) > 1: lines.append(ll)
    if not lines: continue
    props = {'name': (rec['שם_רח'] or '').strip(), 'quarter': (rec['רובע'] or '').strip(), 'tier': int(rec['מידרג'] or 0), 'code': rec['st_cod']}
    if rec['year_of_ex']: props['year'] = rec['year_of_ex']
    geom = {'type': 'LineString', 'coordinates': lines[0]} if len(lines) == 1 else {'type': 'MultiLineString', 'coordinates': lines}
    feats.append({'type': 'Feature', 'properties': props, 'geometry': geom})
fc = {'type': 'FeatureCollection', 'name': 'ashdod-streets', 'source': 'rehevot.shp (Israel TM Grid), עיריית אשדוד, הומר ל-WGS84 ב-03.11.2026', 'features': feats}
json.dump(fc, open(out, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(feats), 'features', pts_in, '->', pts_out, 'points')
