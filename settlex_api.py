from flask import Flask, jsonify, request 
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app)

# --- THE SETTLEX RISK ENGINE ---
def calculate_risk_score(sender, amount):
    score = 0
    
    # Rule 1: High-value transaction check
    if amount > 10000:
        score += 50
        
    # Rule 2: Watchlist check (we convert to lowercase just in case the user typed weirdly)
    if sender.lower() == "unknownentity":
        score += 50
        
    # The Decision
    if score >= 50:
        return "Flagged"
    else:
        return "Cleared"

def setup_database():
    conn = sqlite3.connect('settlex_local.db')
    cursor = conn.cursor()

    cursor.execute('''CREATE TABLE IF NOT EXISTS transactions(id INTEGER PRIMARY KEY, sender TEXT, amount INTEGER, status TEXT)''')

    cursor.execute('''CREATE TABLE IF NOT EXISTS admins(id INTEGER PRIMARY KEY, username TEXT, password TEXT)''')

    cursor.execute("DELETE FROM admins")
    cursor.execute("INSERT INTO admins (username,password) VALUES ('admin', 'settlex2026')")

    cursor.execute("DELETE FROM transactions")
    cursor.execute("INSERT INTO transactions (sender, amount, status) VALUES ('ShoeStore', 1500, 'cleared')")
    cursor.execute("INSERT INTO transactions (sender, amount, status) VALUES ('UnknownEntity', 45000, 'Flagged')")
    cursor.execute("INSERT INTO transactions (sender, amount, status) VALUES ('TechCorm', 8000, 'cleared')")
    cursor.execute("INSERT INTO transactions (sender, amount, status) VALUES ('StillformLabs', 25000, 'cleared')")
    
    conn.commit()
    conn.close()

setup_database()


# --- ROUTE 1: GET (Feeds data to your HTML Dashboard) ---
@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    conn = sqlite3.connect('settlex_local.db')
    cursor = conn.cursor()

    cursor.execute("SELECT sender, amount, status FROM transactions")
    # 1. We name the variable 'rows' here...
    rows = cursor.fetchall() 
    
    api_data = []
    # 2. ...so the loop knows exactly what to look for!
    for row in rows:
        tx_dict = {
            "sender": row[0], 
            "amount": row[1], 
            "status": row[2]
        }
        api_data.append(tx_dict)

    conn.close()

    # 3. We send the packaged dictionaries to the internet
    return jsonify(api_data)


# --- ROUTE 2: POST (Receives new transactions from users) ---
@app.route('/api/add_transaction', methods=['POST'])
def add_transaction():
    incoming_data = request.get_json()

    new_sender = incoming_data["sender"]
    new_amount = incoming_data["amount"]

    new_status = calculate_risk_score(new_sender, new_amount)

    conn = sqlite3.connect('settlex_local.db')
    cursor = conn.cursor()
    cursor.execute("INSERT INTO transactions (sender, amount, status) VALUES (?, ?, ?)", (new_sender, new_amount, new_status))
    conn.commit()
    conn.close()

    return jsonify({"message": "Transaction processed via Risk Engine!"}), 201

# --- ROUTE 3: LOGIN (MUST GO ABOVE THE ENGINE STARTER!) ---
@app.route('/api/login', methods=['POST'])
def login():

    incoming_data = request.get_json()
    attempted_username = incoming_data["username"]
    attempted_password = incoming_data["password"] # Fixed the typo here!

    conn = sqlite3.connect('settlex_local.db')
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM admins WHERE username=? AND password=?", (attempted_username, attempted_password))
    
    # Fetch the data FIRST...
    admin_user = cursor.fetchone()
    
    # ...THEN close the database!
    conn.close() 

    if admin_user:
        return jsonify({
            "message": "login successful",
            "token": "SettleX-VIP-Access-Token" # Fixed "tocken" typo
        }), 200
    else:
        return jsonify({"error": "Invalid username or password"}), 401

        # --- ROUTE 4: REGISTER (New Users) ---
@app.route('/api/register', methods=['POST'])
def register():
    incoming_data = request.get_json()
    new_username = incoming_data["username"]
    new_password = incoming_data["password"]

    conn = sqlite3.connect('settlex_local.db')
    cursor = conn.cursor()

    # 1. Check if the username already exists
    cursor.execute("SELECT * FROM admins WHERE username=?", (new_username,))
    existing_user = cursor.fetchone()

    if existing_user:
        conn.close()
        return jsonify({"error": "Username already taken!"}), 400

    # 2. If it is unique, add them to the database!
    cursor.execute("INSERT INTO admins (username, password) VALUES (?, ?)", (new_username, new_password))
    conn.commit()
    conn.close()

    return jsonify({"message": "Account created successfully!"}), 201


# --- THE ENGINE STARTER ---
if __name__ == '__main__':
    app.run(port=5000)


    