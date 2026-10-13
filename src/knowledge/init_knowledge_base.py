"""
Knowledge Base Initialization Module for SkyBot AI.
Creates and populates structured meteorological knowledge, location entities,
and lifestyle advisory guidelines into SQLite database.
"""

import sqlite3
import json
from pathlib import Path

DB_PATH = Path("database/weather.db")

def create_knowledge_tables(conn: sqlite3.Connection): 
    """Create structured knowledge base tables."""
    cursor = conn.cursor()

    # 1. Geographic & Location Entity Knowledge Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS kb_locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE,
        name TEXT NOT NULL,
        normalized_name TEXT NOT NULL,
        aliases TEXT NOT NULL,  -- JSON Array of common abbreviations, misspellings, slang
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        region TEXT
    );
    """)

    # 2. Weather Decision & Lifestyle Guidelines Table (Brand Hub Rules)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS kb_weather_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rule_key TEXT UNIQUE,
        category TEXT NOT NULL, -- umbrella, clothing, workout, laundry, car_wash, uv, aqi
        trigger_condition TEXT NOT NULL,
        advice_vi TEXT NOT NULL, 
        advice_en TEXT NOT NULL
        );
    """)

    # 3. Meteorological FAQ & Concept Knowledge Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS kb_faqs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        topic TEXT UNIQUE,
        keywords TEXT NOT NULL, --JSON Array of trigger keywords
        answer_vi TEXT NOT NULL, 
        answer_en TEXT NOT NULL
    );
    """)

    # 4. User Long-term Memory & Habit Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_memory (
        user_id TEXT PRIMARY KEY,
        favorite_location TEXT,
        location_ask_count INTEGER DEFAULT 0, 
        favorite_topic TEXT,
        last_interacted TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 5. Full Chat Interaction Logs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT DEFAULT 'default_user',
        query TEXT NOT NULL,
        intent TEXT,
        matched_location TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 6. Unresolved Queries for Active Learning (Kho tự học từ mới)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS unresolved_queries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        query TEXT NOT NULL,
        candidate_term TEXT,
        auto_learned_status TEXT DEFAULT 'pending', --pending, learned, ignored
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 7. User Feedback Loop Table (Học từ đánh giá 👍 / 👎)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        query TEXT NOT NULL,
        answer TEXT NOT NULL,
        rating INTEGER NOT NULL,  -- +1 (thumbs up), -1 (thumbs down)
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    conn.commit()
    print("✅ Knowledge Base schema created successfully.")

def seed_locations(conn: sqlite3.connect): 
    """Seed Vietnam provinces and major global cities with aliases and coordinates."""
    cursor = conn.cursor()

    locations_data = [
        # --- VIETNAM KEY PROVINCES & CITIES ---
        (
            "HN", "Hà Nội", "ha noi",
            json.dumps(["hà nội", "ha noi", "hanoi", "hn", "thủ đô", "thu do", "hà lội", "ha loi"], ensure_ascii=False),
            21.0285, 105.8542, "Bắc Bộ"
        ),

        (
            "HCM", "Hồ Chí Minh", "ho chi minh",
            json.dumps(["hồ chí minh", "ho chi minh", "hcm", "tphcm", "tp hcm", "sài gòn", "sai gon", "sg"], ensure_ascii=False),
            10.8231, 106.6297, "Nam Bộ"
        ),

        (
            "DN", "Đà Nẵng", "da nang",
            json.dumps(["đà nẵng", "da nang", "danang", "dn", "đà nẽng", "da neng"], ensure_ascii=False),
            16.0544, 108.2022, "Trung Bộ"
        ),

        (
            "TB", "Thái Bình", "thai binh",
            json.dumps(["thái bình", "thai binh", "thaibinh", "tb", "thái bìn", "thai bin"], ensure_ascii=False),
            20.4464, 106.3366, "Đồng bằng sông Hồng"
        ),

        (
            "HP", "Hải Phòng", "hai phong",
            json.dumps(["hải phòng", "hai phong", "haiphong", "hp", "thành phố hoa phượng đỏ"], ensure_ascii=False),
            20.8449, 106.6881, "Đồng bằng sông Hồng"
        ),

        (
            "CT", "Cần Thơ", "can tho",
            json.dumps(["cần thơ", "can tho", "cantho", "ct", "tây đô", "tay do"], ensure_ascii=False),
            10.0452, 105.7469, "Đồng bằng sông Cửu Long"
        ),

        (
            "QN", "Quảng Ninh", "quang ninh",
            json.dumps(["quảng ninh", "quang ninh", "hạ long", "ha long", "bãi cháy", "cẩm phả"], ensure_ascii=False),
            20.9500, 107.0833, "Đông Bắc Bộ"
        ), 

        (
            "HUE", "Huế", "hue",
            json.dumps(["huế", "hue", "thừa thiên huế", "thua thien hue", "cố đô"], ensure_ascii=False),
            16.4637, 107.5909, "Bắc Trung Bộ"
        ),

        (
            "NT", "Nha Trang", "nha trang",
            json.dumps(["nha trang", "nhatrang", "khánh hòa", "khanh hoa"], ensure_ascii=False),
            12.2388, 109.1967, "Nam Trung Bộ"
        ),

        (
             "DL", "Đà Lạt", "da lat",
            json.dumps(["đà lạt", "da lat", "dalat", "lâm đồng", "lam dong", "thành phố ngàn hoa"], ensure_ascii=False),
            11.9404, 108.4583, "Tây Nguyên"
        ),

        (
           "VT", "Vũng Tàu", "vung tau",
            json.dumps(["vũng tàu", "vung tau", "bà rịa vũng tàu", "vt"], ensure_ascii=False),
            10.3460, 107.0843, "Đông Nam Bộ"
        ),

        (
            "ND", "Nam Định", "nam dinh",
            json.dumps(["nam định", "nam dinh", "namdinh", "nd"], ensure_ascii=False),
            20.4200, 106.1683, "Đồng bằng sông Hồng"
        ),

        (
            "NA", "Nghệ An", "nghe an",
            json.dumps(["nghệ an", "nghe an", "vinh", "tp vinh"], ensure_ascii=False),
            18.6734, 105.6813, "Bắc Trung Bộ"
        ),

        (
            "TH", "Thanh Hóa", "thanh hoa",
            json.dumps(["thanh hóa", "thanh hoa", "sầm sơn", "sam son"], ensure_ascii=False),
            19.8075, 105.7764, "Bắc Trung Bộ"
        ),

        # --- MAJOR INTERNATIONAL CITIES ---
        (
            "TYO", "Tokyo", "tokyo",
            json.dumps(["tokyo", "đông kinh", "nhật bản", "japan"], ensure_ascii=False),
            35.6762, 139.6503, "Nhật Bản"
        ),
        (
            "SEL", "Seoul", "seoul",
            json.dumps(["seoul", "hàn quốc", "korea"], ensure_ascii=False),
            37.5665, 126.9780, "Hàn Quốc"
        ),
        (
            "BKK", "Bangkok", "bangkok",
            json.dumps(["bangkok", "thái lan", "thailand"], ensure_ascii=False),
            13.7563, 100.5018, "Thái Lan"
        ),
        (
            "SIN", "Singapore", "singapore",
            json.dumps(["singapore", "sing", "đảo quốc sư tử"], ensure_ascii=False),
            1.3521, 103.8198, "Singapore"
        ),
        (
            "LON", "London", "london",
            json.dumps(["london", "luân đôn", "nước anh", "uk"], ensure_ascii=False),
            51.5074, -0.1278, "Vương Quốc Anh"
        ),
        (
            "NYC", "New York", "new york",
            json.dumps(["new york", "nyc", "mỹ", "usa"], ensure_ascii=False),
            40.7128, -74.0060, "Hoa Kỳ"
        ),
        (
            "PAR", "Paris", "paris",
            json.dumps(["paris", "kinh đô ánh sáng", "nước pháp", "france"], ensure_ascii=False),
            48.8566, 2.3522, "Pháp"
        ),
    ]

    cursor.executemany("""
    INSERT OR REPLACE INTO kb_locations (code, name, normalized_name, aliases, latitude, longitude, region)
    VALUES (?, ?, ?, ?, ?, ?, ?);
    """, locations_data)

    conn.commit()
    print(f"✅ Populated {len(locations_data)} locations into kb_locations.")

def seed_weather_rules(conn: sqlite3.Connection):
    """Seed lifestyle guidelines and weather decision rules."""
    cursor = conn.cursor()

    rules_data = [
        # --- UMBRELLA / RAIN RULES ---
        (
            "umbrella_raining", "umbrella", "current_rain > 0",
            "Hiện tại trời đang có mưa thực tế! Bạn chắc chắn phải mang theo ô (dù) hoặc áo mưa khi ra ngoài.",
            "It is currently raining! You will definitely need an umbrella or raincoat before heading out."
        ), 

        (
            "umbrella_high_chance", "umbrella", "max_rain_prob >= 50",
            "Xác suất mưa hôm nay khá cao ({val}%). Bạn nên chủ động để sẵn áo mưa hoặc ô trong cốp xe.",
            "High chance of rain today ({val}%). It is strongly advised to carry an umbrella or raincoat."
        ),

        (
            "umbrella_low_chance", "umbrella", "max_rain_prob < 50",
            "Khả năng mưa hôm nay rất thấp (chỉ khoảng {val}%). Bạn có thể yên tâm di chuyển mà không lo bị ướt.",
            "Low chance of rain today ({val}%). You likely won't need an umbrella today."
        ),

        # --- CLOTHING RULES ---
        (
            "clothing_hot", "clothing", "temperature >= 33",
            "Nhiệt độ ngoài trời rất cao ({val}°C). Hãy mặc trang phục mỏng nhẹ, thoáng khí, chất liệu cotton sáng màu, đội mũ nón và bôi kem chống nắng.",
            "Very hot weather ({val}°C). Wear lightweight, breathable cotton clothing, sunglasses, and apply sun protection."
        ),
        (
            "clothing_warm", "clothing", "temperature >= 25 and temperature < 33",
            "Thời tiết ấm áp và dễ chịu ({val}°C). Trang phục thường ngày áo thun ngắn tay, quần thoáng mát là lý tưởng nhất.",
            "Pleasant warm conditions ({val}°C). Standard short sleeves and comfortable casual wear are ideal."
        ),
        (
            "clothing_cool", "clothing", "temperature >= 19 and temperature < 25",
            "Thời tiết se lạnh ({val}°C). Bạn nên mặc áo dài tay, khoác nhẹ áo gió hoặc áo cardigan khi ra đường.",
            "Mild cool conditions ({val}°C). A light jacket, hoodie, or long sleeves will keep you comfortable."
        ),
        (
            "clothing_cold", "clothing", "temperature < 19",
            "Thời tiết khá lạnh ({val}°C). Cần mặc áo khoác dày, giữ ấm cổ và tay để bảo vệ sức khỏe.",
            "Chilly weather ({val}°C). Wear a warm jacket and layer up to protect your health."
        ),
        # --- OUTDOOR WORKOUT RULES ---
        (
            "workout_rain", "workout", "is_raining == True",
            "Đang có mưa, đường trơn trượt không an toàn cho các buổi chạy hoặc đạp xe ngoài trời. Bạn nên tập gym hoặc cardio trong nhà.",
            "Outdoor running is not recommended right now due to rain. An indoor gym session is much safer."
        ),
        (
            "workout_bad_aqi", "workout", "aqi > 100",
            "Chất lượng không khí đang ở mức nhạy cảm (AQI: {val}). Tránh tập các bài tập gắng sức ngoài trời; ưu tiên tập luyện trong phòng kín có máy lọc không khí.",
            "Air quality is compromised (AQI: {val}). Avoid strenuous outdoor cardio; opt for indoor exercises."
        ),
        (
            "workout_ideal", "workout", "is_raining == False and aqi <= 100 and temperature <= 32",
            "Điều kiện tuyệt vời cho thể dục ngoài trời! Nhiệt độ {temp}°C mát mẻ và không khí trong lành (AQI: {aqi}). Chúc bạn có buổi tập hiệu quả!",
            "Perfect conditions for outdoor workouts! Cool temperature at {temp}°C and clean air (AQI: {aqi})."
        ),
        # --- LAUNDRY RULES ---
        (
            "laundry_bad", "laundry", "max_rain_prob >= 40 or humidity >= 85",
            "Không nên phơi quần áo ngoài trời hôm nay vì nguy cơ mưa hoặc độ ẩm cao ({val}%), quần áo sẽ lâu khô và dễ bị ẩm mốc.",
            "Not a good day to dry clothes outdoors due to high humidity ({val}%) or potential rain."
        ),
        (
            "laundry_good", "laundry", "max_rain_prob < 40 and humidity < 85",
            "Thời tiết rất thuận lợi để giặt và phơi đồ! Trời râm mát hoặc nắng ráo, độ ẩm {val}% giúp quần áo khô nhanh và thơm tho.",
            "Great day for outdoor laundry! Low rain chance and optimal humidity ({val}%) will dry clothes quickly."
        ),
        # --- CAR WASH RULES ---
        (
            "car_wash_bad", "car_wash", "max_rain_prob >= 40",
            "Chưa nên rửa xe hôm nay! Dự báo có khả năng mưa trong 12 giờ tới ({val}%), xe sẽ nhanh chóng bị bám bẩn lại.",
            "Better postpone washing your car today. Potential rain within 12 hours ({val}%) will make it dirty again."
        ),
        (
            "car_wash_good", "car_wash", "max_rain_prob < 40",
            "Thời điểm lý tưởng để rửa xe! Trời khô ráo, nguy cơ mưa thấp ({val}%), xe rửa xong sẽ giữ được sạch sẽ nhiều ngày tới.",
            "Ideal time to wash your car! Low chance of precipitation ({val}%) will keep your vehicle clean."
        )
    ] 

    cursor.executemany("""
    INSERT OR REPLACE INTO kb_weather_rules (rule_key, category, trigger_condition, advice_vi, advice_en)
    VALUES (?, ?, ?, ?, ?);
    """, rules_data)  

    conn.commit()
    print(f"✅ Populated {len(rules_data)} advisory rules into kb_weather_rules.")  

def seed_faqs(conn: sqlite3.Connection):
    """Seed meteorological concepts, AI model information, and educational Q&A."""
    cursor = conn.cursor()

    faqs_data = [
        # --- 1. CHÀO HỎI (GREETING) ---
        (
            "greeting", 
            json.dumps(["xin chào", "chào bạn", "chào skybot", "hello", "hi", "hey", "alo", "chao"], ensure_ascii=False),
            "Xin chào bạn! Tôi là SkyBot - Trợ lý Khí tượng & Phong cách sống AI của bạn. Hôm nay tôi có thể giúp gì cho bạn (xem thời tiết, chọn trang phục, mang ô hay phơi đồ)?",
            "Hello! I am SkyBot - your AI Weather & Lifestyle Assistant. How can I assist you with your day today?"
        ),

         # --- 2. CẢM ƠN (GRATITUDE) ---
        (
            "gratitude",
            json.dumps(["cảm ơn", "cam on", "thank you", "thanks", "cảm ơn bạn", "cảm ơn skybot", "tks"], ensure_ascii=False),
            "Rất vui được hỗ trợ bạn! Chúc bạn một ngày thật năng lượng và thời tiết luôn thuận lợi nhé! 😊",
            "You are very welcome! Wishing you a great day with lovely weather! 😊"
        ),

        # --- 3. TẠM BIỆT (FAREWELL) ---
        (
            "farewell",
            json.dumps(["tạm biệt", "tam biet", "bye", "goodbye", "hẹn gặp lại", "bai bai"], ensure_ascii=False),
            "Tạm biệt bạn nhé! Hãy nhớ ghé SkyBot trước khi ra ngoài để luôn chủ động trước mọi thay đổi thời tiết! 👋",
            "Goodbye! Remember to check SkyBot before heading out to stay ahead of the weather! 👋"
        ),

        # --- 4. GIỚI THIỆU BẢN THÂN (BOT IDENTITY) ---
        (
            "bot_identity",
            json.dumps(["bạn là ai", "ban la ai", "who are you", "skybot là ai", "giới thiệu về bạn"], ensure_ascii=False),
            "Tôi là SkyBot, trợ lý thời tiết AI được tích hợp mô hình Machine Learning Random Forest và Kho tri thức phong cách sống. Tôi có thể dự báo nhiệt độ, tư vấn mang ô, chọn trang phục, phơi đồ, rửa xe và kiểm tra chất lượng không khí cho mọi tỉnh thành!",
            "I am SkyBot, an AI weather assistant powered by Random Forest Machine Learning and an intelligent lifestyle Knowledge Base."
        ),

        # --- 5. CÁC FAQ KHÍ TƯỢNG ĐÃ CÓ ---

        (
            "aqi_concept",
            json.dumps(["aqi là gì", "chỉ số aqi", "bụi mịn pm2.5", "chất lượng không khí"], ensure_ascii=False),
            "AQI (Air Quality Index) là thước đo chất lượng không khí từ 0 đến 500. Dưới 50 là tốt, 51-100 là trung bình, trên 100 là nhóm nhạy cảm cần hạn chế ra ngoài, và trên 150 là mức có hại cho sức khỏe mọi người.",
            "AQI (Air Quality Index) measures air pollution from 0 to 500. 0-50 is Good, 51-100 Moderate, and above 100 is Unhealthy for sensitive groups."
        ),
        (
            "humidity_impact",
            json.dumps(["độ ẩm là gì", "độ ẩm cao", "độ ẩm thấp", "độ ẩm ảnh hưởng gì"], ensure_ascii=False),
            "Độ ẩm lý tưởng cho sức khỏe con người là từ 40% đến 70%. Khi độ ẩm > 85%, mồ hôi khó bốc hơi làm cơ thể cảm thấy oi bức, ngột ngạt và dễ phát sinh nấm mốc.",
            "Optimal human comfort humidity is 40% to 70%. Levels above 85% impede sweat evaporation, causing sluggishness and heat discomfort."
        ),
        (
            "ml_model_info",
            json.dumps(["mô hình ml", "random forest", "dự báo nhiệt độ như thế nào", "mô hình ai"], ensure_ascii=False),
            "SkyBot sử dụng mô hình Random Forest (200 cây quyết định, độ sâu 6) được huấn luyện trên chuỗi thời gian lịch sử khí tượng, kết hợp biến đổi hàm Sin/Cos 24h và quán tính nhiệt để dự báo nhiệt độ với độ chính xác R² đạt 90.3%.",
            "SkyBot utilizes an ensemble Random Forest model (200 trees, depth 6) trained on historical meteorological time-series, with cyclic 24h Sin/Cos encoding, achieving 90.3% R² precision."
        )
    ]  

    cursor.executemany("""
    INSERT OR REPLACE INTO kb_faqs (topic, keywords, answer_vi, answer_en)
    VALUES (?, ?, ?, ?);
    """, faqs_data)   

    conn.commit()
    print(f"✅ Populated {len(faqs_data)} FAQs into kb_faqs.")

def main(): 
    """Main execution function."""
    print("=" * 60)
    print("🧠 INITIALIZING SKYBOT WEATHER KNOWLEDGE BASE...")
    print("=" * 60)

    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)

    try: 
        create_knowledge_tables(conn)
        seed_locations(conn)
        seed_weather_rules(conn)
        seed_faqs(conn)

        print("=" * 60)
        print("🎉 KNOWLEDGE BASE IS FULLY INITIALIZED AND READY!")
        print("=" * 60)

    finally: 
        conn.close()

if __name__ == "__main__":
    main()