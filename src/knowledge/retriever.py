"""
Knowledge Retriever & Information Extraction Engine for SkyBot AI.
Performs semantic entity extraction, alias matching, intent classification,
and lifestyle rule evaluation against the SQLite Knowledge Base.
"""

import sqlite3
import json 
import re
import unicodedata
from pathlib import Path
from typing import Optional, Dict, Any, List

DB_PATH = Path("database/weather.db")

def normalize_text(text: str) -> str: 
    """Lowercases text and strips leading/trailing whitespaces."""
    return text.strip().lower()

def remove_accents(input_str: str) -> str: 
    """Removes Vietnamese diacritics/accents for resilient fuzzy matching."""
    nfkd = unicodedata.normalize('NFKD', input_str)
    return ''.join([c for c in nfkd if not unicodedata.combining(c)]).lower().replace('đ', 'd').replace('Đ', 'd')

class KnowledgeRetriever: 
    """In-memory accelerated knowledge retriever and intent classifier."""

    def __init__(self, db_path: Path = DB_PATH): 
        self.db_path = db_path
        self.locations_cache: List[Dict[str, Any]] = []
        self.rules_cache: List[Dict[str, Any]] = []
        self.faqs_cache: List[Dict[str, Any]] = []
        self._load_knowledge_cache()

    def _load_knowledge_cache(self):
        """Loads knowledge base tables into memory for sub-millisecond lookups."""
        if not self.db_path.exists(): 
            return

        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        try: 
            # 1. Cache Locations
            cursor.execute("SELECT * FROM kb_locations")
            for row in cursor.fetchall(): 
                aliases = json.loads(row["aliases"]) if row["aliases"] else []
                self.locations_cache.append({
                    "id": row["id"],
                    "code": row["code"],
                    "name": row["name"],
                    "normalized_name": row["normalized_name"],
                    "aliases": [normalize_text(a) for a in aliases],
                    "latitude": row["latitude"],
                    "longitude": row["longitude"],
                    "region": row["region"]
                })

            # 2. Cache Rules
            cursor.execute("SELECT * FROM kb_weather_rules")
            for row in cursor.fetchall(): 
                self.rules_cache.append({
                    "rule_key": row["rule_key"],
                    "category": row["category"],
                    "trigger_condition": row["trigger_condition"],
                    "advice_vi": row["advice_vi"],
                    "advice_en": row["advice_en"]
                })

            # 3. Cache FAQs
            cursor.execute("SELECT * FROM kb_faqs")
            for row in cursor.fetchall():
                keywords = json.loads(row["keywords"]) if row["keywords"] else []
                self.faqs_cache.append({
                    "topic": row["topic"],
                    "keywords": [normalize_text(k) for k in keywords],
                    "answer_vi": row["answer_vi"],
                    "answer_en": row["answer_en"]
                })

        finally: 
            conn.close()

    def extract_location(self, query: str) -> Optional[Dict[str, Any]]:
        """
        Extracts geographical entity from query by scanning full names,
        aliases, abbreviations, and common misspellings.
        Longer matches are prioritized to prevent greedy substring collisions.
        """
        clean_q = normalize_text(query)
        unaccented_q = remove_accents(clean_q)

        candidate_matches = []

        for loc in self.locations_cache:
            # Check full formal name
            loc_name_clean = normalize_text(loc["name"])
            if re.search(r'\b' + re.escape(loc_name_clean) + r'\b', clean_q, re.IGNORECASE):
                candidate_matches.append((len(loc_name_clean), loc))
                continue

            # Check aliases (sorted by length descending in candidate score)
            for alias in loc["aliases"]: 
                # Check with accents
                if re.search(r'(?:^|\s|[.,?!])' + re.escape(alias) + r'(?:$|\s|[.,?!])', clean_q, re.IGNORECASE):
                    candidate_matches.append((len(alias), loc))
                    break

                # Check without accents
                alias_unaccented = remove_accents(alias)

                if re.search(r'(?:^|\s|[.,?!])' + re.escape(alias_unaccented) + r'(?:$|\s|[.,?!])', unaccented_q, re.IGNORECASE):
                    candidate_matches.append((len(alias_unaccented), loc))
                    break

        if candidate_matches: 
            # Pick candidate with longest matched keyword
            candidate_matches.sort(key=lambda x: x[0], reverse=True)
            return candidate_matches[0][1]

        return None

    def detect_intent(self, query: str) -> str: 
        """Classifies the primary meteorological or lifestyle intent of the user."""
        q = normalize_text(query)
        q_unaccent = remove_accents(q)

        def has_standalone_word(text: str, target: str) -> bool:
            """Checks if a keyword appears as a standalone word/phrase (avoids 'ô' matching 'hôm nay')."""
            return bool(re.search(r'(?:^|\s|[.,?!])' + re.escape(target) + r'(?:$|\s|[.,?!])', text, re.IGNORECASE))

        # 1. FAQ & Chit-Chat concepts (Chào hỏi, cảm ơn, khái niệm)
        for faq in self.faqs_cache:
            for kw in faq["keywords"]:

                # Nếu từ khóa ngắn (<= 3 ký tự như 'hi', 'bye', 'alo'), bắt buộc phải là từ độc lập
                if len(kw) <= 3: 
                    if has_standalone_word(q, kw) or has_standalone_word(q_unaccent, remove_accents(kw)):
                        return f"faq:{faq['topic']}"

                else: 
                    if kw in q or remove_accents(kw) in q_unaccent:
                        return f"faq:{faq['topic']}"

        # 2. Laundry Intent
        if any(w in q for w in ["phơi đồ", "phơi quần áo", "giặt đồ", "giặt quần áo", "phoi do", "giat do"]) or \
            any(w in q_unaccent for w in ["laundry", "dry clothes"]):
            return "laundry"
        
        # 3. Outdoor Workout Intent
        if any(w in q for w in ["chạy bộ", "tập thể dục", "thể thao", "đạp xe", "chay bo", "the duc"]) or \
            any(w in q_unaccent for w in ["workout", "running", "jogging", "exercise"]):
            return "workout"

        # 4. Clothing / Outfit Intent
        if any(w in q for w in ["mặc gì", "trang phục", "quần áo", "áo khoác", "mac gi", "mac do", "nên mặc"]) or \
            any(w in q_unaccent for w in ["wear", "outfit", "clothes", "jacket"]):
            return "clothing"
        

        # 5. Car Wash Intent
        if any(w in q for w in ["rửa xe", "rua xe"]) or \
            any(w in q_unaccent for w in ["wash car", "car wash"]):
            return "car_wash"

        # 6. Air Quality Intent
        if any(w in q for w in ["không khí", "bụi mịn", "ô nhiễm", "khong khi", "bui min", "o nhiem"]) or \
            any(w in q_unaccent for w in ["aqi", "air quality", "pm2.5", "pollution"]):
            return "air_quality"

        # 7. Umbrella / Rain Intent (Kiểm tra từ 'ô', 'dù' đứng độc lập)
        if any(w in q for w in ["áo mưa", "mang ô", "mang dù", "có mưa không", "co mua khong", "mưa không", "mua ko"]) or \
            has_standalone_word(q, "ô") or has_standalone_word(q, "dù") or \
            any(w in q_unaccent for w in ["umbrella", "rain", "raincoat"]):
            return "umbrella"

        return "general_weather"

    def match_faq(self, topic_key: str, lang: str = "vi") -> Optional[str]:
        """Returns the explanatory answer for a matched FAQ topic."""
        for faq in self.faqs_cache: 
            if faq["topic"] == topic_key:
                return faq["answer_vi"] if lang == "vi" else faq["answer_en"]
        return None
    


    def evaluate_rule(
        self,
        category: str,
        temperature: float = 28.0,
        max_rain_prob: float = 0.0,
        current_rain: float = 0.0,
        humidity: float = 70.0,
        aqi: int = 50,
        lang: str = "vi"   
    ) -> str: 

        """Evaluates lifestyle and advisory rules based on live metrics."""
        is_raining = current_rain > 0 

        if category == "umbrella": 
            if is_raining: 
                rule = next((r for r in self.rules_cache if r["rule_key"] == "umbrella_raining"), None)

            elif max_rain_prob >= 50: 
                rule = next((r for r in self.rules_cache if r["rule_key"] == "umbrella_high_chance"), None)

            else: 
                rule = next((r for r in self.rules_cache if r["rule_key"] == "umbrella_low_chance"), None)

            if rule: 
                template = rule["advice_vi"] if lang == "vi" else rule["advice_en"]
                return template.replace("{val}", str(round(max_rain_prob)))

        elif category == "clothing": 
            if temperature >= 33: 
                rule = next((r for r in self.rules_cache if r["rule_key"] == "clothing_hot"), None)

            elif temperature >= 25 :
                rule = next((r for r in self.rules_cache if r["rule_key"] == "clothing_warm"), None)

            elif temperature >= 19:
                rule = next((r for r in self.rules_cache if r["rule_key"] == "clothing_cool"), None)

            else: 
                rule = next((r for r in self.rules_cache if r["rule_key"] == "clothing_cold"), None)

            if rule: 
                template = rule["advice_vi"] if lang == "vi" else rule["advice_en"]
                return template.replace("{val}", f"{temperature:.1f}")

        elif category == "workout": 
            if is_raining: 
                rule = next((r for r in self.rules_cache if r["rule_key"] == "workout_rain"), None)

            elif aqi > 100:
                rule = next((r for r in self.rules_cache if r["rule_key"] == "workout_bad_aqi"), None)

            else:
                rule = next((r for r in self.rules_cache if r["rule_key"] == "workout_ideal"), None)

            if rule:
                template = rule["advice_vi"] if lang == "vi" else rule["advice_en"]
                return template.replace("{val}", str(aqi)).replace("{temp}", f"{temperature:.1f}").replace("{aqi}", str(aqi))

        elif category == "laundry":
            if max_rain_prob >= 40 or humidity >= 85:
                rule = next((r for r in self.rules_cache if r["rule_key"] == "laundry_bad"), None)
                val = f"{round(max_rain_prob)}% mưa, {round(humidity)}% ẩm"
            else:
                rule = next((r for r in self.rules_cache if r["rule_key"] == "laundry_good"), None)
                val = f"{round(humidity)}"
            if rule:
                template = rule["advice_vi"] if lang == "vi" else rule["advice_en"]
                return template.replace("{val}", str(val))

        elif category == "car_wash":
            if max_rain_prob >= 40:
                rule = next((r for r in self.rules_cache if r["rule_key"] == "car_wash_bad"), None)
            else:
                rule = next((r for r in self.rules_cache if r["rule_key"] == "car_wash_good"), None)
            if rule:
                template = rule["advice_vi"] if lang == "vi" else rule["advice_en"]
                return template.replace("{val}", str(round(max_rain_prob)))

        return ""

# =====================================================================
# QUICK TEST RUNNER
# =====================================================================
if __name__ == "__main__":
    print("🧪 TESTING KNOWLEDGE RETRIEVER ENGINE...")
    retriever = KnowledgeRetriever()
    test_queries = [
        "thời tiết ở Thái Bìn như thế nào?",
        "hôm nay ở SG nên mặc đồ gì ra đường?",
        "chiều nay ở HN có nên phơi quần áo không?",
        "mô hình ml dự báo nhiệt độ như thế nào?"
    ]
    print("-" * 65)
    for q in test_queries:
        loc = retriever.extract_location(q)
        intent = retriever.detect_intent(q)
        loc_name = f"{loc['name']} ({loc['latitude']}, {loc['longitude']})" if loc else "Current Location (Default)"
        print(f"❓ Câu hỏi : \"{q}\"")
        print(f"📍 Thực thể: {loc_name}")
        print(f"🎯 Ý định  : {intent}")
        print("-" * 65)