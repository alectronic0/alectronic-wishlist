import json

# Read parsed Amazon items
with open('/tmp/parsed_amazon_items.json', 'r') as f:
    amazon_items = json.load(f)

# Amazon items mapping to BGG IDs
bgg_mapping = {
    "B0C6QQM8X6": {"name": "Horrified: Greek Monsters", "bggId": "394208"},
    "B0F2GVHLV2": {"name": "Horrified: Dungeons & Dragons", "bggId": "431057"},
    "B085KYB3R4": {"name": "No Thanks!", "bggId": "12942"},
    "B09MC7CWLV": {"name": "Mystic Vale: Essential Edition", "bggId": "194655"},
    "B07BMKV6MT": {"name": "Mattel UNO: The Legend of Zelda", "bggId": "254923"},
    "B077BCRZ6F": {"name": "Dark Souls: The Card Game", "bggId": "238676"},
    "B01GSYA4K2": {"name": "Terraforming Mars", "bggId": "167791"},
    "B07PHHBWM9": {"name": "Love Letter", "bggId": "277085"},
    "B07SRMXRZB": {"name": "Jaipur (2nd Edition)", "bggId": "54043"},
    "B01HT9DERU": {"name": "Codenames: Pictures", "bggId": "198773"},
    "B00GDI4HX4": {"name": "Coup", "bggId": "131357"},
    "B07HB88VXG": {"name": "Camel Up (2nd Edition)", "bggId": "260605"},
    "B07JZTBV9C": {"name": "Taco vs Burrito", "bggId": "258169"},
    "B07WC2Z9HF": {"name": "On a Scale of One to T-Rex", "bggId": "285438"},
}

amazon_by_asin = {item['asin']: item for item in amazon_items}

# Build merged wishlist array
merged_wishlist = [
    {
        "name": "Catan",
        "bggId": "13",
        "price": "Want To Buy",
        "url": "https://boardgamegeek.com/boardgame/13/catan",
        "img": "https://m.media-amazon.com/images/I/51-P4gC5EwL._SS135_.jpg"
    },
    {
        "name": "Citadels",
        "bggId": "478",
        "price": "Want To Buy",
        "url": "https://boardgamegeek.com/boardgame/478/citadels",
        "img": "https://m.media-amazon.com/images/I/51r5Y+f-1kL._SS135_.jpg"
    },
    {
        "name": "Dominion",
        "bggId": "36218",
        "price": "Want To Buy",
        "url": "https://boardgamegeek.com/boardgame/36218/dominion",
        "img": "https://m.media-amazon.com/images/I/51n8N806BML._SS135_.jpg"
    },
    {
        "name": "Terraforming Mars: Prelude",
        "bggId": "247030",
        "price": "Want To Buy",
        "url": "https://boardgamegeek.com/boardgameexpansion/247030/terraforming-mars-prelude",
        "img": "https://m.media-amazon.com/images/I/51fT4QpXfNL._SS135_.jpg"
    },
    {
        "name": "USAopoly The Legend of Zelda Chess Set",
        "price": "Amazon Wishlist",
        "url": "https://www.amazon.co.uk/hz/wishlist/ls/13S66685VZMFC?ref_=wl_share",
        "img": "https://m.media-amazon.com/images/I/51KyoaHn6HL._SS135_.jpg"
    }
]

for asin, info in bgg_mapping.items():
    amz = amazon_by_asin.get(asin, {})
    price = amz.get("price", "Amazon Wishlist")
    url = amz.get("url", f"https://www.amazon.co.uk/dp/{asin}")
    img = amz.get("img", "https://m.media-amazon.com/images/I/51fT4QpXfNL._SS135_.jpg")

    item_obj = {
        "name": info["name"],
        "bggId": info["bggId"],
        "asin": asin,
        "price": price,
        "url": url,
        "img": img
    }
    merged_wishlist.append(item_obj)

print(f"Total merged wishlist items: {len(merged_wishlist)}")
with open('/tmp/merged_boardgames_wishlist.json', 'w') as f:
    json.dump(merged_wishlist, f, indent=2)
