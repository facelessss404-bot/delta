import json
import re

with open('slp_extracted.json', 'r', encoding='utf-8') as f:
    slots = json.load(f)

TIME_SLOT_MAP = {
    1: ('05:00', '05:30', '05:00 - 05:30'),
    2: ('05:30', '07:30', '05:30 - 07:30'),
    3: ('07:30', '08:00', '07:30 - 08:00'),
    4: ('08:00', '08:30', '08:00 - 08:30'),
    5: ('08:30', '09:00', '08:30 - 09:00'),
    6: ('09:00', '10:00', '09:00 - 10:00'),
    7: ('10:00', '11:30', '10:00 - 11:30'),
    8: ('11:30', '11:45', '11:30 - 11:45'),
    9: ('11:45', '13:00', '11:45 - 13:00'),
    10: ('13:00', '13:30', '13:00 - 13:30'),
    11: ('13:30', '14:30', '13:30 - 14:30'),
    12: ('14:30', '15:45', '14:30 - 15:45'),
    13: ('15:45', '16:00', '15:45 - 16:00'),
    14: ('16:00', '17:00', '16:00 - 17:00'),
    15: ('17:00', '18:00', '17:00 - 18:00'),
    16: ('18:00', '20:30', '18:00 - 20:30'),
    17: ('20:30', '21:00', '20:30 - 21:00'),
    18: ('21:00', '22:30', '21:00 - 22:30'),
    19: ('22:30', '23:00', '22:30 - 23:00')
}

def clean_time(order):
    return TIME_SLOT_MAP.get(order, ('00:00', '00:00', 'TBD'))

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
    if 'PHYSICAL' in val_upper: return ('Physical Training (PT)', 'Training Staff', 'physical')
    if 'STUDY' in val_upper: return ('Study Hours', 'Supervised Study', 'study')
    if 'CURRENT' in val_upper: return ('Current Affairs & GK', '', 'academic')
    if 'LEARNING' in val_upper: return ('Learning Videos / Defence Prep', '', 'academic')
    if 'SELF' in val_upper: return ('Self Preparation & Revision', '', 'study')
    
    instructor = ''
    activity = val.replace('\n', ' ')
    m = re.search(r'\((.*?)\)', activity)
    if m:
        instructor = m.group(1).strip()
        activity = re.sub(r'\(.*?\)', '', activity).strip()
    
    category = 'academic'
    return (activity, instructor, category)

cleaned_slots = []
for slot in slots:
    t1, t2, disp = clean_time(slot['slot_order'])
    act, inst, cat = parse_slot_text(slot['val'])
    cleaned_slots.append({
        'day': slot['day'],
        'slot_order': slot['slot_order'],
        'start_time': t1,
        'end_time': t2,
        'time_display': disp,
        'activity': act,
        'instructor': inst,
        'category': cat,
        'raw_text': slot['val'] or ''
    })

print(f'Processed {len(cleaned_slots)} SLP slots.')
for s in cleaned_slots[:19]:
    print(f"#{s['slot_order']} ({s['time_display']}): {s['activity']} | {s['instructor']} [{s['category']}]")

with open('slp_cleaned_slots.json', 'w', encoding='utf-8') as f:
    json.dump(cleaned_slots, f, indent=2)
