import json
import re

transcript_path = '/home/alectronic/.gemini/antigravity-cli/brain/5e774a82-db7d-435c-a8a8-be9e8e8099d3/.system_generated/logs/transcript_full.jsonl'

with open(transcript_path, 'r', encoding='utf-8') as f:
    lines = [json.loads(line) for line in f]

user_input = [l for l in lines if l.get('type') == 'USER_INPUT'][-1]['content']

items = []
blocks = user_input.split('<li id="item_')

for b in blocks[1:]:
    # ASIN
    asin_m = re.search(r'ASIN:([A-Z0-9]{10})', b) or re.search(r'asin&quot;:&quot;([A-Z0-9]{10})&quot;', b) or re.search(r'/dp/([A-Z0-9]{10})', b)
    if not asin_m:
        continue
    asin = asin_m.group(1)

    # Title
    t_m = re.search(r'title="([^"]+)"', b) or re.search(r'alt="([^"]+)"', b)
    if not t_m:
        continue
    raw_title = t_m.group(1).replace('&amp;', '&').replace('&quot;', '"').replace('&nbsp;', ' ').strip()
    if not raw_title or 'Quick view' in raw_title or 'More options' in raw_title:
        continue

    # Price
    p_m = re.search(r'<span class="a-offscreen">(£[\d\.]+)</span>', b) or re.search(r'&quot;price&quot;:&quot;([\d\.]+)&quot;', b)
    price = p_m.group(1) if p_m else "Wishlist"
    if price != "Wishlist" and not price.startswith("£"):
        price = f"£{price}"

    # Image
    img_m = re.search(r'src="(https://m\.media-amazon\.com/images/I/[^"]+?\._SS\d+_\.jpg)"', b) or re.search(r'src="(https://m\.media-amazon\.com/images/I/[^"]+?\.jpg)"', b) or re.search(r'&quot;image&quot;:&quot;(https://m\.media-amazon\.com/images/I/[^"]+?\.jpg)&quot;', b)
    img_url = img_m.group(1) if img_m else "https://m.media-amazon.com/images/I/51fT4QpXfNL._SS135_.jpg"

    items.append({
        "asin": asin,
        "raw_title": raw_title,
        "price": price,
        "img": img_url
    })

print(f"Total parsed: {len(items)}\n")
for item in items:
    print(f"ASIN: {item['asin']} | Price: {item['price']}")
    print(f"Title: {item['raw_title']}")
    print(f"Image: {item['img']}\n")

with open('/tmp/parsed_amazon_items.json', 'w') as f:
    json.dump(items, f, indent=2)
