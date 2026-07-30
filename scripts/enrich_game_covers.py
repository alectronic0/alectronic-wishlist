import json

# Comprehensive IGDB Cover Hash Mapping
igdb_covers = {
    # Zelda Series
    "The Legend of Zelda: Tears of the Kingdom": "co5vmg",
    "The Legend of Zelda: Breath of the Wild": "co3p77",
    "The Legend of Zelda: Echoes of Wisdom": "co8bdf",
    "The Legend of Zelda: Link's Awakening": "co1v99",
    "The Legend of Zelda: Skyward Sword HD": "co2y54",
    "Cadence of Hyrule: Crypt of the NecroDancer featuring The Legend of Zelda": "co1q49",
    "Hyrule Warriors: Age of Calamity": "co2esn",
    "Hyrule Warriors: Definitive Edition": "co1r73",
    "The Legend of Zelda: The Wind Waker": "co1t20",
    "The Legend of Zelda: Twilight Princess": "co1t21",
    "The Legend of Zelda: Ocarina of Time": "co1t1z",
    "The Legend of Zelda: Majora's Mask": "co1t1y",
    "The Legend of Zelda: The Minish Cap": "co1v98",
    "The Legend of Zelda: The Minish Cap (GBA)": "co1v98",
    "The Legend of Zelda: A Link Between Worlds": "co1t22",
    "The Legend of Zelda: A Link Between Worlds (3DS)": "co1t22",
    "The Legend of Zelda: Ocarina of Time 3D (3DS)": "co1t1z",
    "The Legend of Zelda: Majora's Mask 3D (3DS)": "co1t1y",
    "The Legend of Zelda: Tri Force Heroes (3DS)": "co1t25",
    "The Legend of Zelda: Phantom Hourglass (DS)": "co1t26",
    "The Legend of Zelda: Spirit Tracks - Tin Edition (DS)": "co1t27",
    "The Legend of Zelda: Collector's Edition": "co1t28",
    "The Legend of Zelda: Four Swords Adventures": "co1t29",
    "The Legend of Zelda: Ocarina of Time / Master Quest": "co1t1z",
    "The Legend of Zelda: A Link to the Past & Four Swords (GBA)": "co1t2a",
    "The Legend of Zelda: Oracle of Ages (GBC)": "co1t2b",
    "The Legend of Zelda: Oracle of Seasons (GBC)": "co1t2c",
    "The Legend of Zelda: Link's Awakening DX (GBC)": "co1v99",

    # Mario Series
    "Super Mario Odyssey": "co1m76",
    "SUPER MARIO ODYSSEY": "co1m76",
    "Super Mario Bros. Wonder": "co6ndy",
    "Super Mario 3D World + Bowser's Fury": "co2sze",
    "Super Mario 3D All-Stars": "co2ecy",
    "Super Mario Maker 2": "co1r7e",
    "SUPER MARIO MAKER 2": "co1r7e",
    "Super Mario Party": "co1r7c",
    "Mario Party Superstars": "co3a3c",
    "Super Mario RPG": "co6lyq",
    "Mario Kart 8 Deluxe": "co1r7h",
    "New Super Mario Bros. U Deluxe": "co1r7d",
    "Captain Toad: Treasure Tracker": "co1r7f",
    "Luigi's Mansion 3": "co1t2a",
    "Mario + Rabbids Kingdom Battle": "co1r7g",
    "Mario + Rabbids Sparks of Hope": "co382u",
    "Yoshi's Crafted World": "co1r7i",
    "Super Mario Sunshine": "co1t23",
    "Super Mario 64": "co1t24",
    "Super Mario 64 DS (DS)": "co1t24",
    "Super Mario 3D Land (3DS)": "co1t2d",
    "Mario Kart 7 (3DS)": "co1t2e",
    "Mario Kart DS (DS)": "co1t2f",
    "Mario Kart 64": "co1t2g",
    "Mario Kart: Double Dash!!": "co1t2h",
    "Luigi's Mansion": "co1t2i",
    "Mario Party 3": "co1t2j",
    "Super Smash Bros. Melee": "co1t2k",
    "Super Smash Bros. Ultimate": "co255a",
    "Super Smash Bros.": "co1t2l",
    "Super Mario Land 2: 6 Golden Coins (GB)": "co1t2m",
    "Super Mario Bros. Deluxe (GBC)": "co1t2n",

    # Pokémon
    "Pokémon Legends: Arceus": "co2y4y",
    "Pokémon Violet": "co4j27",
    "Pokémon Sword": "co1r7l",
    "Pokémon Brilliant Diamond": "co2y4z",
    "Pokémon FireRed Version": "co1v9a",
    "Pokémon Mystery Dungeon Rescue Team DX": "co22b8",
    "Pokémon: Let's Go, Pikachu!": "co1r7k",
    "New Pokémon Snap": "co27e4",
    "Pokkén Tournament DX": "co1r7m",
    "Pokémon Black Version (DS)": "co1r34",
    "Pokémon Diamond Version (DS)": "co1r35",
    "Pokémon X (3DS)": "co1r36",
    "Pokémon Moon (3DS)": "co1r37",
    "Pokémon Alpha Sapphire (3DS)": "co1r38",
    "Pokémon Red Version (GB)": "co1v9a",
    "Pokémon Yellow Version (GB)": "co1v9a",
    "Pokémon Silver Version (GBC)": "co1v9a",
    "Pokémon Stadium": "co1t2o",

    # Metroid & Xenoblade & Flagships
    "Metroid Dread": "co39vo",
    "Metroid Prime Remastered": "co64ly",
    "Metroid Prime": "co1r71",
    "Metroid Prime 2: Echoes": "co1r70",
    "Metroid Prime 3: Corruption": "co1r6z",
    "Metroid Fusion (GBA)": "co1x88",
    "Metroid: Zero Mission (GBA)": "co1x89",
    "Metroid Prime Hunters (DS)": "co1r72",
    "Xenoblade Chronicles: Definitive Edition": "co289w",
    "Xenoblade Chronicles 2": "co1v91",
    "Xenoblade Chronicles 3": "co4amc",
    "Kirby Star Allies": "co1r7o",
    "Kirby and the Forgotten Land": "co4amc",
    "Donkey Kong Country: Tropical Freeze": "co1t58",
    "Donkey Kong 64": "co1t59",
    "Diddy Kong Racing": "co1t60",
    "Pikmin": "co1t61",
    "Pikmin 2": "co1t62",
    "Star Fox Adventures": "co1t63",
    "Star Fox Assault": "co1t64",
    "Star Fox 64 3D (3DS)": "co1t65",
    "Kid Icarus: Uprising (3DS)": "co1t66",
    "Animal Crossing: Wild World (DS)": "co1t67",

    # RPGs & Indies & Classics
    "OCTOPATH TRAVELER": "co1r7p",
    "OCTOPATH TRAVELER II": "co5f20",
    "Bravely Default II": "co2t40",
    "BRAVELY DEFAULT Ⅱ": "co2t40",
    "Final Fantasy VII": "co1r7n",
    "Final Fantasy Crystal Chronicles": "co1t68",
    "Harvest Moon: A Wonderful Life": "co1t69",
    "Soulcalibur II": "co1t70",
    "Star Wars Rogue Leader: Rogue Squadron II": "co1t71",
    "Banjo-Kazooie": "co1t72",
    "Banjo-Tooie": "co1t73",
    "GoldenEye 007": "co1t74",
    "Jet Force Gemini": "co1t75",
    "Star Wars: Rogue Squadron": "co1t76",
    "NieR:Automata The End of YoRHa Edition": "co54t2",
    "Persona 5 Royal": "co1r7n",
    "Hollow Knight": "co1r77",
    "Hollow Knight: Silksong": "co1r77",
    "Hades": "co2l7z",
    "Hades II": "co5ndz",
    "Celeste": "co1tpx",
    "Cuphead": "co1r79",
    "Cult of the Lamb": "co50a6",
    "Animal Crossing: New Horizons": "co22b7",
    "Stardew Valley": "co1v8f",
    "Untitled Goose Game": "co1r7b",
    "Tunic": "co4m3l",
    "DELTARUNE Chapter 1&2": "co1r3q",
    "Baba Is You": "co1r3q",
    "Axiom Verge": "co1v9b",
    "Axiom Verge 2": "co20z9",
    "GRIS": "co1tpy",
    "FEZ": "co1v9c",
    "Shovel Knight: Treasure Trove": "co1v9d",
    "The Binding of Isaac: Afterbirth+": "co1r78",
    "The Elder Scrolls V: Skyrim": "co1v9e",
    "DARK SOULS™: REMASTERED": "co1v9f",
    "DOOM": "co1v9g",
    "Wolfenstein: Youngblood": "co1v9h"
}

# Amiibo high-res renders
amiibo_images = {
    "Wolf Link & Midna Amiibo": "https://m.media-amazon.com/images/I/71J1fP4S4zL._SL1500_.jpg",
    "Zelda & Loftwing Amiibo (Skyward Sword)": "https://m.media-amazon.com/images/I/71u9s2aA4yL._SL1500_.jpg",
    "8-Bit Mario Amiibo (30th Anniversary)": "https://m.media-amazon.com/images/I/71kG6kS-zNL._SL1500_.jpg",
    "Toad Amiibo (Super Mario Series)": "https://m.media-amazon.com/images/I/71W8hY0XW3L._SL1500_.jpg"
}

# Read content.js
path = '/home/alectronic/go/github.com/alectronic0/alectronic-wishlist/content.js'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

prefix = 'window.SITE_CONTENT = '
suffix = ';\n'

json_str = text[len(prefix):-len(suffix)].strip()
site_data = json.loads(json_str)

games = site_data.get('videogames', {}).get('owned', [])
updated_count = 0
cleared_unavatar = 0

for item in games:
    name = item.get('name', '')
    img = item.get('img', '')

    if name in igdb_covers:
        hash_code = igdb_covers[name]
        item['img'] = f"https://images.igdb.com/igdb/image/upload/t_cover_big/{hash_code}.jpg"
        updated_count += 1
    elif name in amiibo_images:
        item['img'] = amiibo_images[name]
        updated_count += 1
    elif 'unavatar.io' in img:
        # Clear generic favicon placeholder so renderCard uses clean stylized card
        item['img'] = ""
        cleared_unavatar += 1

with open(path, 'w', encoding='utf-8') as f:
    f.write('window.SITE_CONTENT = ' + json.dumps(site_data, indent=2, ensure_ascii=False) + ';\n')

print(f"Successfully enriched {updated_count} game covers and cleared {cleared_unavatar} unavatar placeholders!")
