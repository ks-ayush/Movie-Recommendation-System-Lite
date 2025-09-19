import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from joblib import dump

merged_df = pd.read_csv("models/merged_file.csv")
# ratings = pd.read_csv("models/ratings.csv")

tf1 = TfidfVectorizer(stop_words='english', max_features=5000)
tf1_matrix = tf1.fit_transform(merged_df['combined_features'])

dump(tf1, "models/tfidf_vectorizer.joblib")
dump(tf1_matrix, "models/tfidf_matrix.joblib")


merged_df.to_pickle("models/merged_df.pkl")
indices = pd.Series(merged_df.index, index=merged_df['title_cleaned']).drop_duplicates()
indices.to_pickle("models/title_indices.pkl")
# ratings.to_pickle("models/ratings.pkl")


print("TF-IDF objects saved successfully.")