import json
import re

with open('extracted_schedule.json', 'r', encoding='utf-8') as f:
    raw = json.load(f)

def clean_time(s):
    s = s.replace('–', '-').replace(' ', '').replace('hrs', '').strip()
    if s == '500': return ('05:00', '05:30', '05:00')
    if s == '2230': return ('22:30', '23:00', '22:30')
    parts = s.split('-')
    if len(parts) == 2:
        def to_time(t):
            t = t.zfill(4)
            return f'{t[:2]}:{t[2:]}'
        t1, t2 = to_time(parts[0]), to_time(parts[1])
        return (t1, t2, f'{t1} - {t2}')
    return (s, s, s)

def parse_slot_text(val):
    val = (val or '').strip()
    if not val:
        return ('Free / Self-Study', '', 'study')
    val_upper = val.upper()
    if 'WAKE' in val_upper: return ('Wake Up', '', 'routine')
    if 'FRESH' in val_upper: return ('Fresh Up', '', 'routine')
    if 'FALL' in val_upper: return ('Fall In / Roll Call', '', 'routine')
    if 'BREAKFAST' in val_upper: return ('Breakfast', '', 'routine')
    if 'DINNER' in val_upper: return ('Dinner', '', 'routine')
    if 'LIGHT' in val_upper: return ('Lights Off', '', 'routine')
    if val_upper in ['B', 'R', 'E', 'A', 'K']: return ('Break / Refreshments', '', 'routine')
    if val_upper in ['L', 'U', 'N', 'C', 'H']: return ('Lunch Break', '', 'routine')
    if val_upper in ['G', 'A', 'M', 'E', 'S']: return ('Games (Indoor / Outdoor)', 'Devika / Rithika / Prabha / Abhi', 'games')
    if 'PHYSICAL' in val_upper or 'PHSICAL' in val_upper: return ('Physical Training (PT)', 'Training Staff', 'physical')
    if 'STUDY' in val_upper: return ('Study Hours', 'Supervised Study', 'study')
    if 'CURRENT' in val_upper or 'CUREENT' in val_upper: return ('Current Affairs & GK', '', 'academic')
    
    instructor = ''
    activity = val.replace('\n', ' ')
    m = re.search(r'\((.*?)\)', activity)
    if m:
        instructor = m.group(1).strip()
        activity = re.sub(r'\(.*?\)', '', activity).strip()
    activity = re.sub(r'\s+', ' ', activity).strip()
    return (activity, instructor, 'academic')

schedule_meta = {
    'Sheet1': {'key': 'grade_8_10', 'title': 'Grade 8th - 10th (JLP)', 'programme': 'Grade 8th-10th'},
    'Sheet2': {'key': 'grade_11_12', 'title': 'Grade 11th & 12th', 'programme': 'Grade 11th-12th'},
    'Sheet3': {'key': 'nda', 'title': 'NDA Foundation', 'programme': 'NDA Foundation'}
}

output_slots = []

for sheet_name, rows in raw.items():
    meta = schedule_meta.get(sheet_name, {'key': sheet_name.lower(), 'title': sheet_name, 'programme': sheet_name})
    header_row = None
    for r in rows:
        cells = r['cells']
        for k, v in cells.items():
            if 'DAY' in v.upper():
                header_row = r
                break
        if header_row:
            break
            
    cols = sorted(header_row['cells'].keys())
    day_col = [k for k in cols if 'DAY' in header_row['cells'][k].upper()][0]
    time_cols = [k for k in cols if k != day_col and header_row['cells'][k]]
    
    for r in rows:
        dval = r['cells'].get(day_col, '').strip()
        if dval.upper() in ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']:
            day_name = dval.capitalize()
            for idx, c in enumerate(time_cols):
                raw_cell = r['cells'].get(c, '')
                t1, t2, tdisp = clean_time(header_row['cells'][c])
                act, inst, cat = parse_slot_text(raw_cell)
                trackable = cat in ['academic', 'physical', 'study', 'games']
                
                output_slots.append({
                    'schedule_key': meta['key'],
                    'schedule_title': meta['title'],
                    'programme': meta['programme'],
                    'day_of_week': day_name,
                    'slot_order': idx + 1,
                    'start_time': t1,
                    'end_time': t2,
                    'time_display': tdisp,
                    'activity': act,
                    'instructor': inst,
                    'category': cat,
                    'raw_text': raw_cell,
                    'trackable': trackable
                })

with open('timetable_data.json', 'w', encoding='utf-8') as f:
    json.dump(output_slots, f, indent=2, ensure_ascii=False)

print(f'Generated timetable_data.json with {len(output_slots)} slots!')
