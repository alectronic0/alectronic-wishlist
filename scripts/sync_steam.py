#!/usr/bin/env python3
"""
Steam Library Sync Script for Alec's Wishlist
Fetches owned games and playtime from the Steam Web API and updates the local data.
"""
import os
import json
import requests

STEAM_API_KEY = os.environ.get("STEAM_API_KEY")
STEAM_ID = os.environ.get("STEAM_ID", "76561198000000000") # Replace or pass STEAM_ID

def fetch_steam_games():
    if not STEAM_API_KEY:
        print("Notice: STEAM_API_KEY environment variable not set. Skipping live Steam fetch.")
        return None

    url = f"http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key={STEAM_API_KEY}&steamid={STEAM_ID}&include_appinfo=1&format=json"
    try:
        res = requests.get(url, timeout=10)
        if res.ok:
            data = res.json()
            games = data.get("response", {}).get("games", [])
            print(f"Successfully fetched {len(games)} Steam games.")
            
            # Sort by playtime_forever descending
            games.sort(key=lambda g: g.get("playtime_forever", 0), reverse=True)
            
            formatted_games = []
            for g in games[:30]: # Top 30 played / owned games
                appid = g.get("appid")
                name = g.get("name")
                playtime_hours = round(g.get("playtime_forever", 0) / 60, 1)
                img = f"https://cdn.akamai.steamstatic.com/steam/apps/{appid}/header.jpg"
                formatted_games.append({
                    "name": name,
                    "console": "steam",
                    "badge": f"{playtime_hours} hrs played",
                    "img": img,
                    "appid": appid
                })
            return formatted_games
        else:
            print(f"Error fetching Steam games: HTTP {res.status_code}")
            return None
    except Exception as e:
        print(f"Failed to fetch Steam data: {e}")
        return None

def main():
    games = fetch_steam_games()
    if games:
        output_path = os.path.join(os.path.dirname(__file__), "..", "steam-data.json")
        with open(output_path, "w") as f:
            json.dump(games, f, indent=2)
        print(f"Saved {len(games)} Steam games to {output_path}")

if __name__ == "__main__":
    main()
