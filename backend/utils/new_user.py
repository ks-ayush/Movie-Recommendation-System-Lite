import pandas as pd
from joblib import load
from sklearn.metrics.pairwise import linear_kernel


tf1 = load("models/tfidf_vectorizer.joblib")
tf1_matrix = load("models/tfidf_matrix.joblib")
merged_df = pd.read_pickle("models/merged_df.pkl")
indices = pd.read_pickle("models/title_indices.pkl")

def get_recommendations(title):
    title = title.lower().strip()
    title_matches = merged_df[merged_df['title_cleaned'].str.lower() == title]

    if title_matches.empty:
        return []

    idx = title_matches.index[0]
    sim_scores = linear_kernel(tf1_matrix[idx], tf1_matrix).flatten()
    sim_scores = sorted(list(enumerate(sim_scores)), key=lambda x: x[1], reverse=True)
    sim_scores = sim_scores[0:21]
    movie_indices = [i[0] for i in sim_scores if i[0] < len(merged_df)]

    return merged_df['title'].iloc[movie_indices].tolist()
