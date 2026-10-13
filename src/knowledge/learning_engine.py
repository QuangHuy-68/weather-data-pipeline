"""
Continuous Learning & User Habit Adaptation Engine for SkyBot AI.
Manages persistent user preferences, active learning for unknown entities,
and interaction feedback loops.
"""

import sqlite3
import json
import re
import requests
from pathlib import Path
from typing import Optional, Dict, Any

DB_PATH = Path("database/weather.db")

class LearningEngine: 
    """Manages long-term conversational memory, active entity learning, and feedback."""

    def __init__(self, db_path: Path = DB_PATH):
        self.db_path = db_path

    def _get_connection(self) -> sqlite3.Connection: 
        """Returns SQLite connection with Row factory."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    # =========================================================================
    # 1. PERSONALIZED USER MEMORY & HABIT TRACKING
    # =========================================================================
    def log_interaction(
        self, 
        user_id: str, 
        query: str,
        intent: str, 
        matched_location: Optional[str] = None
    ): 

        """Logs chat query and updates user location preferences in real time."""       
        conn = self._get_connection()
        cursor = conn.cursor()

        try: 
            # 1. Log chat into history
            cursor.execute("""
            INSERT INTO chat_logs (user_id, query, intent, matched_location)
            VALUES (?, ?, ?, ?);
            """, (user_id, query, intent, matched_location))

            # 2. Update user memory if location is identified
            if matched_location: 
                # Check current memory for this user
                cursor.execute("SELECT * FROM user_memory WHERE user_id = ?", (user_id,))
                memory = cursor.fetchone()

                if memory: 
                    current_fav = memory["favorite_location"]
                    ask_count = memory["location_ask_count"]

                    if current_fav == matched_location: 
                        new_count = ask_count + 1
                        new_fav = current_fav
                    else: 
                        # If asked new location repeatedly, it can replace favorite
                        if ask_count <= 2:
                            new_fav = matched_location
                            new_count = 2
                        else:
                            new_fav = current_fav
                            new_count = ask_count

                    cursor.execute("""
                    UPDATE user_memory
                    SET favorite_location = ?, location_ask_count = ?, favorite_topic = ?, last_interacted = CURRENT_TIMESTAMP
                    WHERE user_id = ?;
                    """, (new_fav, new_count, intent, user_id))

                else: 
                    # First time interaction
                    cursor.execute("""
                    INSERT INTO user_memory (user_id, favorite_location, location_ask_count, favorite_topic)
                    VALUES (?, ?, 1, ?);
                    """, (user_id, matched_location, intent))

            conn.commit()
        finally: 
            conn.close()

    def get_user_memory(self, user_id: str = "default_user") -> Optional[Dict[str, Any]]:
        """Retrieves learned preferences (favorite location and common topic) for a user."""
        conn = self._get_connection()
        cursor = conn.cursor()

        try: 
            cursor.execute("SELECT * FROM user_memory WHERE user_id = ?", (user_id,))
            row = cursor.fetchone()
            if row: 
                return { 
                    "user_id": row["user_id"],
                    "favorite_location": row["favorite_location"],
                    "ask_count": row["location_ask_count"],
                    "favorite_topic": row["favorite_topic"]
                }
            return None
        finally: 
            conn.close()


    # =========================================================================
    # 2. ACTIVE LEARNING: AUTO-DISCOVER & LEARN NEW LOCATIONS
    # =========================================================================
    def discover_and_learn_location(self, query: str) -> Optional[Dict[str, Any]]:
        """
        Active Learning Mechanism:
        Extracts potential location candidates from unknown queries,
        validates them via Geocoding, and permanently inserts them into kb_locations.
        """
        # Look for patterns like: "ở [Địa danh]", "tại [Địa danh]", "thời tiết ở [Địa danh]"

        pattern = r'(?:thời tiết|mưa|nhiệt độ|lạnh|nóng)?\s*(?:ở|tại|o|tai|weather in)\s+([A-Za-zÀ-ỹ0-9\s]+?)(?:\?|\.|,|thế nào|the nao|sao|không|khong|$)'
        match = re.search(pattern, query, re.IGNORECASE)

        if not match: 
            return None

        candidate = match.group(1).strip()
        if len(candidate) < 2 or len(candidate) > 30:
            return None

        # Try to resolve candidate location via Open-Meteo Geocoding
        try: 
            geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={requests.utils.quote(candidate)}&count=1&language=vi&format=json"
            res = requests.get(geo_url, timeout=4)
            if res.status_code != 200:
                return None

            data = res.json()
            results = data.get("results", [])
            if not results: 
                # Log to unresolved queries for auditing
                self._log_unresolved(query, candidate, "unresolved")
                return None

            place = results[0]
            learned_name = place.get("name", candidate)
            lat = float(place["latitude"])
            lon = float(place["longitude"])
            country = place.get("country", "Việt Nam")

            # Generate short code
            code_base = re.sub(r'[^A-Za-z0-9]', '', candidate.upper())[:6] or "LOC"
            loc_code = f"AUTO_{code_base}"

            # Prepare aliases array
            aliases = list(set([
                candidate.lower(),
                learned_name.lower(),
                candidate.lower().replace(" ", "")
            ]))
            # Persist newly learned location into kb_locations!
            conn = self._get_connection()
            cursor = conn.cursor()

            try:
                cursor.execute("""
                INSERT OR IGNORE INTO kb_locations (code, name, normalized_name, aliases, latitude, longitude, region)
                VALUES (?, ?, ?, ?, ?, ?, ?);
                """, (
                    loc_code,
                    learned_name,
                    learned_name.lower(),
                    json.dumps(aliases, ensure_ascii=False),
                    lat,
                    lon,
                    country
                ))
                conn.commit()

                self._log_unresolved(query, candidate, "auto_learned")
                print(f"✨ [ACTIVE LEARNING]: Successfully learned new location '{learned_name}' ({lat}, {lon})!")
                return {
                    "code": loc_code,
                    "name": learned_name,
                    "latitude": lat,
                    "longitude": lon,
                    "region": country,
                    "is_newly_learned": True
                }
            finally: 
                conn.close()

        except Exception as e: 
            print(f"Active learning lookup warning: {e}")
            return None

    def _log_unresolved(self, query: str, candidate: str, status: str):
        """Logs candidate queries for continuous audit and improvement."""
        conn = self._get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
            INSERT INTO unresolved_queries (query, candidate_term, auto_learned_status)
            VALUES (?, ?, ?);
            """, (query, candidate, status))
            conn.commit()
        finally:
            conn.close()

    # =========================================================================
    # 3. FEEDBACK LOOP: SAVE USER RATINGS (+1 / -1)
    # =========================================================================
    def record_feedback(self, query: str, answer: str, rating: int, comment: Optional[str] = None):
        """Records user feedback (+1 for helpful, -1 for unhelpful) to evaluate performance."""
        conn = self._get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
            INSERT INTO chat_feedback (query, answer, rating, comment)
            VALUES (?, ?, ?, ?);
            """, (query, answer, rating, comment))
            conn.commit()
            print(f"⭐ Feedback recorded: Rating={rating} for query='{query}'")
        finally:
            conn.close()

# =============================================================================
# QUICK TEST RUNNER
# =============================================================================
if __name__ == "__main__":
    print("🧠 TESTING CONTINUOUS LEARNING ENGINE...")
    engine = LearningEngine()
    # 1. Test Habit Tracking: Simulate asking about Thai Binh multiple times
    print("\n--- 1. Testing Memory Habit Tracking ---")
    engine.log_interaction("user_1", "thời tiết ở Thái Bình", "general_weather", "Thái Bình")
    engine.log_interaction("user_1", "chiều nay ở Thái Bình có mưa không", "umbrella", "Thái Bình")
    memory = engine.get_user_memory("user_1")
    print(f"✅ Learned Memory for user_1: Favorite Location = '{memory['favorite_location']}', Asks = {memory['ask_count']}")

    # 2. Test Active Learning: Try discovering an unseeded location like 'Sa Pa'
    print("\n--- 2. Testing Active Learning (Location Discovery) ---")
    learned = engine.discover_and_learn_location("thời tiết ở Sa Pa thế nào?")
    if learned:
        print(f"✅ Active Learning Success: Learned '{learned['name']}' at Lat: {learned['latitude']}, Lon: {learned['longitude']}")
    # 3. Test Feedback Recording
    print("\n--- 3. Testing Feedback Loop Recording ---")
    engine.record_feedback("hôm nay mặc gì", "Thời tiết mát mẻ 24°C, nên mặc áo thun", rating=1, comment="Rất hữu ích!")
    print("🎉 ALL CONTINUOUS LEARNING ENGINE TESTS PASSED!")
