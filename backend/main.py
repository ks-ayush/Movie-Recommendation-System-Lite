import os
from flask import Flask,request,jsonify,make_response
from flask_cors import CORS
from utils.new_user import get_recommendations
# from utils.existing_user import svd_recommendations
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
import pandas as pd
from joblib import load
# from sklearn.metrics.pairwise import linear_kernel
import numpy as np
import subprocess
from apscheduler.schedulers.background import BackgroundScheduler
import atexit
import pytz 
import threading


load_dotenv()

# app = Flask(__name__)
# CORS(app, supports_credentials=True ,origins=["http://localhost:3000"])

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=[
    "http://localhost:3000",
    "https://movie-recommendation-system-lite.vercel.app"
])

# DB_USER = os.getenv('DB_USER')
# DB_PASSWORD = os.getenv('DB_PASSWORD')
# DB_HOST = os.getenv('DB_HOST')
# DB_PORT = os.getenv('DB_PORT')
# DB_NAME = os.getenv('DB_NAME')

# app.config['SQLALCHEMY_DATABASE_URI'] = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
# app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

if os.environ.get("RENDER") == "true":
    persistent_folder = "/opt/render/project/persistent"
    os.makedirs(persistent_folder, exist_ok=True)
    persistent_db_path = os.path.join(persistent_folder, "database.db")
else:
    persistent_db_path = "database.db"  # local SQLite


app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{persistent_db_path}"

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# db = SQLAlchemy(app)

MAX_ID_OFFSET = 200950

# User Model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    mobile = db.Column(db.String(15), nullable=False)
    password = db.Column(db.String(260), nullable=False)

class UserRating(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    userId = db.Column(db.Integer, nullable=False) # The ID used for ML (e.g., 611, 612...)
    movieId = db.Column(db.Integer, nullable=False)
    rating = db.Column(db.Float, nullable=False) 

with app.app_context():
    db.create_all()

s2 = None
svd = None
all_movies = None
new_ratings_counter = 0

model_lock = threading.Lock()

# def get_data_and_model():
#     global s2, svd, all_movies
#     if s2 is None:
#         print("📂 Loading ratings.csv ...")
#         s2 = pd.read_csv("models/ratings.csv")
#         s2 = s2.dropna(subset=["movieId"])
#         s2['movieId'] = s2['movieId'].astype(int)
#         all_movies = s2['movieId'].unique()
#     if svd is None:
#         print("🤖 Loading SVD model ...")
#         svd = load("models/svd_model.joblib")
#     return s2, svd, all_movies

# def get_data_and_model():
#     global s2, svd, all_movies
#     if s2 is None:
#         print("📂 Loading ratings from SQLite ...")
#         ratings = UserRating.query.all()
#         s2 = pd.DataFrame([{"userId": r.userId, "movieId": r.movieId, "rating": r.rating} for r in ratings])
#         if not s2.empty:
#             s2 = s2.dropna(subset=["movieId"])
#             s2['movieId'] = s2['movieId'].astype(int)
#             all_movies = s2['movieId'].unique()
#         else:
#             s2 = pd.DataFrame(columns=["userId", "movieId", "rating"])
#             all_movies = []
#     if svd is None:
#         print("🤖 Loading SVD model ...")
#         if os.environ.get("RENDER") == "true":
#             model_path = "/opt/render/project/persistent/models/saved_svd_model.joblib"
#         else:
#             model_path = "models/saved_svd_model.joblib"

#         svd = load(model_path)

#     return s2, svd, all_movies

def get_data_and_model():
    global s2, svd, all_movies

    if s2 is None:
        print("Loading ratings from SQLite ...")
        ratings = UserRating.query.all()
        s2 = pd.DataFrame([{"userId": r.userId, "movieId": r.movieId, "rating": r.rating} for r in ratings])

        if not s2.empty:
            s2 = s2.dropna(subset=["movieId"])
            s2['movieId'] = s2['movieId'].astype(int)
            all_movies = s2['movieId'].unique()
        else:
            s2 = pd.DataFrame(columns=["userId", "movieId", "rating"])
            all_movies = []

    if svd is None:
        print("🤖 Loading SVD model ...")

        if os.environ.get("RENDER") == "true":
            persistent_model_folder = "/opt/render/project/persistent/models"
            os.makedirs(persistent_model_folder, exist_ok=True)
            persistent_model_path = os.path.join(persistent_model_folder, "saved_svd_model.joblib")

            if os.path.exists(persistent_model_path):
                model_path = persistent_model_path
            else:
                # first deploy: use model from repo
                model_path = "models/saved_svd_model.joblib"
        else:
            model_path = "models/saved_svd_model.joblib"

        svd = load(model_path)
        print(f"SVD model loaded from {model_path}")

    return s2, svd, all_movies




def svd_recommendations(user_id):
    with model_lock:
        s2, svd, all_movies = get_data_and_model()
        ratings_by_user = s2[s2['userId'] == user_id]
        if ratings_by_user.shape[0] < 2:
            return []
   
        movie_seen = set(ratings_by_user['movieId'])
        unrated_movie_ids = [int(m) for m in all_movies if pd.notna(m) and m not in movie_seen]

        predictions = [(mid, svd.predict(user_id, mid).est) for mid in unrated_movie_ids[:200]]
        predictions.sort(key=lambda x: x[1], reverse=True)
        top_movies = [int(pred[0]) for pred in predictions[:20]]

        #  join with movies.csv to get titles
        movies_df = pd.read_csv("models/merged_file.csv")

        details = [
            {
                "id": int(row["movieId"]),
                "title": row["title"],
                "rating": round(float(next(score for mid, score in predictions if mid == row["movieId"])), 2)
            }
            for _, row in movies_df[movies_df["movieId"].isin(top_movies)].iterrows()
        ]
        return details




@app.route("/api/add_rating", methods=['POST'])
def add_rating():
    user_id_cookie = request.cookies.get("user_id")
    if not user_id_cookie:
        return jsonify({"error": "Authentication required"}), 401
    
    data = request.get_json()
    movie_id = data.get("movieId")
    rating = data.get("rating")

    if not all([movie_id, rating]):
        return jsonify({"error": "Movie ID and rating are required"}), 400

    
    app_user_id = int(user_id_cookie)
    # user_Id = app_user_id + MAX_ID_OFFSET
    user_Id = app_user_id 

   
    existing_rating = UserRating.query.filter_by(userId=user_Id, movieId=movie_id).first()
    if existing_rating:
        
        existing_rating.rating = rating
    else:
        # Add new rating
        new_rating = UserRating(userId=user_Id, movieId=movie_id, rating=rating)
        db.session.add(new_rating)
    
    db.session.commit()

    global new_ratings_counter
    new_ratings_counter += 1

    if new_ratings_counter >= 2:
        print("Retraining model started...")
        subprocess.Popen(["python", "svd.py"])  
        new_ratings_counter = 0


    return jsonify({"message": "Rating saved"}), 201


@app.route("/api/recommend", methods=['POST'])
def recommend():
    data=request.get_json()
    title=data.get("title")
    if not title:
        return jsonify({"error": "Title is required"}), 400
    results=get_recommendations(title)
    if not results:
        return jsonify({"error": "No recommendations found"}), 404
    return jsonify({"recommendations": results})

@app.route("/api/signup", methods=['POST'])
def signup():
    data=request.get_json()
    name=data.get("name")
    email=data.get("email")
    mobile=data.get("mobile")
    raw_password=data.get("password")
    password = generate_password_hash(raw_password,method="pbkdf2:sha256")
    if not all([name, email, mobile, raw_password]):
        return jsonify({"error": "All fields are required"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 400
    new_user = User(name=name, email=email, mobile=mobile, password=password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User created successfully"}), 201

@app.route("/api/svd_recommend", methods=['GET'])
def svd_recommend():
    user_id_cookie = request.cookies.get("user_id")
    if not user_id_cookie:
        return jsonify({"error": "Authentication required"}), 401

    app_user_id = int(user_id_cookie)
    # user_Id = app_user_id + MAX_ID_OFFSET
    user_Id = app_user_id
    results = svd_recommendations(user_Id)

    if not results:
        return jsonify({"error": "No recommendations found or insufficient data. Please rate atleast 2 movies"}), 404

    return jsonify({"recommendations": results}), 200



@app.route("/api/login", methods=['POST'])
def login():
    data=request.get_json()
    email=data.get("email")
    raw_password=data.get("password")
    if not all([email, raw_password]):
        return jsonify({"error": "Email and password are required"}), 400
    user = User.query.filter_by(email=email).first()

    if not user or not check_password_hash(user.password, raw_password):
        return jsonify({"error": "Invalid email or password"}), 401

    resp = make_response(jsonify({
        "message": "Login successful",
        "user": {"name": user.name, "email": user.email}
    }))

    # # Store the user ID or email in the cookie (example only)
    # resp.set_cookie(
    #     "user_id",
    #     str(user.id),         # or user.email
    #     path="/", 
    #     httponly=True,        # prevents JavaScript access
    #     secure=True,         # set to True in production (HTTPS)
    #     samesite="None",    # helps prevent CSRF (set to 'Lax' or 'Strict' as needed)
    #     max_age=7 * 24 * 60 * 60  # 7 days in seconds
    # )

    is_production = os.environ.get("RENDER", "").lower() == "true"

    resp.set_cookie(
        "user_id",
        str(user.id),
        path="/",
        httponly=True,
        secure=is_production,                 
        samesite="Lax" if not is_production else "None",  
        max_age=7 * 24 * 60 * 60
    )


    return resp

@app.route("/api/user", methods=["GET"])
def get_user():
    user_id = request.cookies.get("user_id")
    if not user_id:
        return jsonify({"error": "User ID not found in cookies"}), 401

    try:
        user_id = int(user_id)  # Ensure it's an integer
    except ValueError:
        return jsonify({"error": "Invalid user ID in cookies"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "mobile": user.mobile
    }), 200

@app.route("/api/logout", methods=["POST"])
def logout():
    resp = make_response(jsonify({"message": "Logged out successfully"}))
    resp.set_cookie("user_id", "", expires=0)
    return resp

@app.route("/api/checklogin", methods=["GET"])
def check_login():
    user_id = request.cookies.get("user_id")
    if not user_id:
        return jsonify({"isLoggedIn": False}), 200

    try:
        user_id = int(user_id)
    except ValueError:
        return jsonify({"isLoggedIn": False}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"isLoggedIn": False}), 200

    return jsonify({"isLoggedIn": True, "user": {"name": user.name, "email": user.email}}), 200


@app.route("/api/movie_id", methods=["POST"])
def get_movie_id():
    data = request.get_json()
    title = data.get("title")

    if not title:
        return jsonify({"error": "No title provided"}), 400

    df = pd.read_csv("models/merged_file.csv")
    df['title'] = df['title'].str.strip().str.lower()
    title = title.strip().lower()

    if title not in df['title'].values:
        return jsonify({"error": "Title not found"}), 404

    movie_id = df.loc[df['title'] == title, 'movieId'].values[0]
    return jsonify({"movie_id": int(movie_id)}), 200

@app.route("/api/clear_ratings", methods=["POST"])
def clear_ratings():
    data=request.get_json()
    movieid=data.get("movieId")
    user_id_cookie = request.cookies.get("user_id")
    if not user_id_cookie:
        return jsonify({"error": "Authentication required"}), 401
    if not movieid:
        return jsonify({"error": "Movie ID is required"}), 400
    app_user_id = int(user_id_cookie)
    # user_Id = app_user_id + MAX_ID_OFFSET
    user_Id = app_user_id
    rating = UserRating.query.filter_by(userId=user_Id, movieId=movieid).first()
    if not rating:
        return jsonify({"error": "Rating not found"}), 404  
    db.session.delete(rating)
    db.session.commit()
    return jsonify({"message": "Rating cleared"}), 200



#---production----



# @app.route("/api/clear_ratings", methods=["POST"])
# def clear_ratings():
#     data = request.get_json()
#     movieid = data.get("movieId")
#     user_id_cookie = request.cookies.get("user_id")

#     if not user_id_cookie:
#         return jsonify({"error": "Authentication required"}), 401
#     if not movieid:
#         return jsonify({"error": "Movie ID is required"}), 400

#     app_user_id = int(user_id_cookie)
#     user_Id = app_user_id + MAX_ID_OFFSET

    
#     rating = UserRating.query.filter_by(userId=user_Id, movieId=movieid).first()
#     if not rating:
#         return jsonify({"error": "Rating not found"}), 404  

#     db.session.delete(rating)
#     db.session.commit()

    
#     try:
#         ratings = pd.read_csv("models/ratings.csv")

        
#         mask = ~((ratings["userId"] == user_Id) & (ratings["movieId"] == int(movieid)))
#         ratings = ratings[mask]

#         ratings.to_csv("models/ratings.csv", index=False)
#     except Exception as e:
#         return jsonify({"error": f"Deleted from DB but failed to update CSV: {str(e)}"}), 500

#     return jsonify({"message": "Rating cleared from DB and CSV"}), 200


# @app.route("/api/addtoratings_csv", methods=["POST"])
# def add_to_ratings_csv():
#     ratings= pd.read_csv("models/ratings.csv") 
#     data = request.get_json()
#     user_id_cookie = request.cookies.get("user_id")
#     if not user_id_cookie:
#         return jsonify({"error": "Authentication required"}), 401

#     movieId = data.get("movieId")
#     rating = data.get("rating")

#     if movieId is None or rating is None:
#         return jsonify({"error": "Movie ID and rating are required"}), 400

#     try:
#         app_user_id = int(user_id_cookie)
#         user_Id = app_user_id + MAX_ID_OFFSET
#         movieId = int(movieId)
#         rating = int(rating)
#     except ValueError:
#         return jsonify({"error": "Invalid data format"}), 400

#     new_entry = pd.DataFrame({
#         "userId": [user_Id],
#         "movieId": [movieId],
#         "rating": [rating]
#     })

    
#     mask = (ratings["userId"] == user_Id) & (ratings["movieId"] == movieId)

#     if mask.any():
        
#         ratings.loc[mask, "rating"] = rating
#         message = "Rating updated in CSV"
#     else:
        
#         new_entry = pd.DataFrame({
#             "userId": [user_Id],
#             "movieId": [movieId],
#             "rating": [rating]
#         })
#         ratings = pd.concat([ratings, new_entry], ignore_index=True)
#         message = "Rating added to CSV"

    
#     ratings.to_csv("models/ratings.csv", index=False)

#     return jsonify({"message": message}), 201



# india = pytz.timezone("Asia/Kolkata")

# def retrain_model():
#     global s2, svd, all_movies
#     with model_lock:   
#         try:
#             print("Retraining model started...")
#             process = subprocess.run(["python", "svd.py"], capture_output=True, text=True)

#             if process.returncode != 0:
#                 print("Retraining failed:", process.stderr)
#                 return

            
#             s2 = pd.read_csv("models/ratings.csv")
#             all_movies = s2['movieId'].unique()
#             svd = load("models/svd_model.joblib")

#             print("Model retrained and reloaded!")
#         except Exception as e:
#             print(f"Retraining error: {str(e)}")

# def retrain_model():
#     global s2, svd, all_movies
#     with model_lock:
#         try:
#             print("Retraining model started...")
#             process = subprocess.run(["python", "svd.py"], capture_output=True, text=True)

#             if process.returncode != 0:
#                 print("Retraining failed:", process.stderr)
#                 return

#             # Reload from SQLite
#             ratings = UserRating.query.all()
#             s2 = pd.DataFrame([{"userId": r.userId, "movieId": r.movieId, "rating": r.rating} for r in ratings])
#             if not s2.empty:
#                 all_movies = s2['movieId'].unique()
#             else:
#                 all_movies = []
#             svd = load("models/saved_svd_model.joblib")

#             print("Model retrained and reloaded!")
#         except Exception as e:
#             print(f"Retraining error: {str(e)}")


# scheduler = BackgroundScheduler(timezone=india)
# scheduler.add_job(func=retrain_model, trigger="cron", hour=0, minute=20)
# scheduler.start()


# atexit.register(lambda: scheduler.shutdown())

    


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5500)) 
    debug_mode = os.environ.get("DEBUG", "False").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
