# import pandas as pd
# # from surprise import SVD, Dataset, Reader
# from joblib import load

# s2=pd.read_csv("models/ratings.csv")
# svd=load("models/svd_model.joblib")

# def svd_recommendations(user_id):
#     count=s2.iloc[s2['userId']==user_id].shape[0]
#     if count<10:
#         return []
#     ratings_by_user=s2.query(f"userId=={user_id}")
#     movie_seen=ratings_by_user['movieId']
#     unrated_movie_ids=s2.query(f"movieId not in {movie_seen.tolist()}")['movieId'].unique()
#     predictions=[(movie_id,svd.predict(user_id,movie_id).est) for movie_id in unrated_movie_ids]
#     predictions.sort(key=lambda x:x[1],reverse=True)
#     top_10_movie_ids=[pred[0] for pred in predictions[:10]]
#     return top_10_movie_ids

    
    
    
    