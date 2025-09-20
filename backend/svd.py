# import pandas as pd
# from surprise import SVD, Dataset, Reader
# from joblib import dump
# import shutil

# ratings = pd.read_csv("models/ratings.csv")

# rating_model2 = ratings[["userId", "movieId", "rating"]]
# reader = Reader(rating_scale=(1.00, 5.00))
# data = Dataset.load_from_df(rating_model2, reader)
# trainset = data.build_full_trainset()

# algo = SVD()
# print("Training the SVD model...")
# algo.fit(trainset)
# print("Training complete.")

# temp_file = "models/svd_model_new.joblib"
# final_file = "models/svd_model.joblib"

# dump(algo, temp_file)
# shutil.move(temp_file, "models/svd_model.joblib") 

# print(f"Model saved as {final_file}")


from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import os, pandas as pd, shutil
from surprise import SVD, Dataset, Reader
from joblib import dump


app = Flask(__name__)
# app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///database.db" 
app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:////opt/render/project/persistent/database.db"

db = SQLAlchemy(app)

class UserRating(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    userId = db.Column(db.Integer, nullable=False)
    movieId = db.Column(db.Integer, nullable=False)
    rating = db.Column(db.Float, nullable=False)

def train_svd():
    with app.app_context():
        ratings = UserRating.query.all()
        df = pd.DataFrame([{"userId": r.userId, "movieId": r.movieId, "rating": r.rating} for r in ratings])

        if df.empty:
            print("No ratings found in DB. Skipping training.")
            return

        reader = Reader(rating_scale=(1, 5))
        data = Dataset.load_from_df(df[["userId", "movieId", "rating"]], reader)
        trainset = data.build_full_trainset()

        algo = SVD()
        print("Training SVD...")
        algo.fit(trainset)
        print("Training complete.")

        # os.makedirs("models", exist_ok=True)
        temp_file = "models/svd_model_new.joblib"
        # final_file = "models/saved_svd_model.joblib"
        if os.environ.get("RENDER") == "true":
            os.makedirs("/opt/render/project/persistent/models", exist_ok=True)
            final_file = "/opt/render/project/persistent/models/saved_svd_model.joblib"
        else:
            os.makedirs("models", exist_ok=True)
            final_file = "models/saved_svd_model.joblib"
        dump(algo, temp_file)
        shutil.move(temp_file, final_file)

        print(f"Model saved as {final_file}")

if __name__ == "__main__":
    train_svd()
