import pandas as pd
from surprise import SVD, Dataset, Reader
from joblib import dump
import shutil

ratings = pd.read_csv("models/ratings.csv")

rating_model2 = ratings[["userId", "movieId", "rating"]]
reader = Reader(rating_scale=(1.00, 5.00))
data = Dataset.load_from_df(rating_model2, reader)
trainset = data.build_full_trainset()

algo = SVD()
print("Training the SVD model...")
algo.fit(trainset)
print("Training complete.")

temp_file = "models/svd_model_new.joblib"
final_file = "models/svd_model.joblib"

dump(algo, temp_file)
shutil.move(temp_file, "models/svd_model.joblib") 

print(f"Model saved as {final_file}")
