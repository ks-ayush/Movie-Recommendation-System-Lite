"use client"
import React from 'react'
import { useState } from 'react'
import { useEffect } from 'react';
import { toast } from 'react-toastify';

const page = () => {

    const [title, setTitle] = useState("");
    const [movies, setMovies] = useState([]);
    const [error, setError] = useState("");
    const [rating, setRating] = useState({});
    const [islogin, setIslogin] = useState(false);
    const [movieId, setMovieId] = useState(null);

    useEffect(() => {
        const checkLoginStatus = async () => {
            try {
                const res = await fetch("http://localhost:5500/api/checklogin", {
                    method: "GET",
                    credentials: "include"
                });
                if (!res.ok) {
                    throw new Error("Failed to check login status");
                }
                const data = await res.json();
                setIslogin(data.isLoggedIn);
            } catch (err) {
                toast.error("Error checking login status");
            }
        }
        checkLoginStatus();
    }, []);

    const get_id = async (title) => {
        try {
            const res = await fetch("http://localhost:5500/api/movie_id", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title }),
            });

            if (!res.ok) {
                throw new Error("Failed to fetch movie ID");
            }
            const data = await res.json();
            setMovieId(data.movie_id);
            return data.movie_id;
        } catch (err) {
            toast.error("Error fetching movie ID");
            setMovieId(null);
            return null;
        }
    };


    const user_ratings = async (movieId, rating) => {
        if (!movieId) {
            toast.error("Invalid movie ID");
            return;
        }
        try {
            const res = await fetch("http://localhost:5500/api/add_rating", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ movieId, rating }),
                credentials: "include"
            });
            if (!res.ok) {
                throw new Error("Failed to submit rating");
            }
            toast.success("Rating lined up for submission");
        } catch (err) {
            toast.error("Rating submission failed");
        }
    };


    const handleRating = (movie, rating) => {
        if (!islogin) {
            toast.error("Please sign in to rate movies");
            return;
        }
        setRating(prev => ({ ...prev, [movie]: rating }));
        toast.success(`You rated ${movie} ${rating}⭐`);
    };

    const addtoratings = async (movieId, rating) => {
        if (!movieId) {
            toast.error("Invalid movie ID");
            return;
        }
        try {
            const res = await fetch("http://localhost:5500/api/addtoratings_csv", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ movieId, rating }),
                credentials: "include"
            });
            if (!res.ok) {
                throw new Error("Failed to submit rating");
            }
            toast.success("Rating submitted successfully");

        } catch (err) {
            toast.error("Error submitting rating");
        }

    };



    const clearRating = async (movieId, movie) => {
        if (!islogin) {
            toast.error("Please sign in to clear ratings");
            return;
        }
        if (!movieId) {
            toast.error("Invalid movie ID");
            return;
        }
        try {
            const res = await fetch("http://localhost:5500/api/clear_ratings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ movieId }),
                credentials: "include"
            });
            if (!res.ok) {
                throw new Error("Failed to remove rating");
            }
            toast.success("Rating removed successfully");
            setRating(prev => {
                const newRating = { ...prev };
                delete newRating[movie];
                return newRating;
            });
            toast.info(`Rating for ${movie} cleared`);
        } catch (err) {
            toast.error("Error removing rating");
        }

    };

    const renderStars = (movie) => {
        const currentRating = rating[movie] || 0;
        return (
            <div className="flex items-center gap-2">
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <span
                            key={star}
                            onClick={async () => {
                                handleRating(movie, star);
                                const id = await get_id(movie);
                                if (id) user_ratings(id, star);
                                if (id) addtoratings(id, star);
                            }}

                            className={`cursor-pointer text-xl ${star <= currentRating ? "text-yellow-400" : "text-gray-400"
                                }`}
                        >
                            ★
                        </span>
                    ))}
                </div>
                {
                    currentRating > 0 && (
                        <button
                            onClick={async () => {
                                const id = await get_id(movie);
                                if (id) clearRating(id, movie);
                            }}
                            className="ml-2 text-sm text-red-400 hover:text-red-600"
                        >
                            Clear
                        </button>
                    )
                }
            </div >
        );
    };




    const fetchRecommendations = async () => {
        setError("");
        setMovies([]);

        try {
            const res = await fetch("http://localhost:5500/api/recommend", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title }),
            });

            const text = await res.text();

            let data;
            try {
                data = JSON.parse(text);
            } catch (err) {
                throw new Error("Invalid JSON from server");
            }

            if (res.ok) {
                setMovies(data.recommendations || []);
            } else {
                setError(data.error || "Something went wrong");
            }
        } catch (err) {
            setError("❌ " + err.message);
        }
    };



    return (
        <main className="min-h-screen bg-[#05485C] text-white flex  justify-center">
            <div className='absolute top-28'>
                <h1 className='font-bold text-4xl'>Please enter title of the movie for similar movie recommendations</h1>
            </div>
            <section className='flex flex-col gap-8 py-32 mt-16'>
                {/* <h1 className='font-bold text-4xl'>Please enter title of the movie for similar movie recommendations</h1> */}

                <div className='flex justify-center py-1'>
                    <h2 className='mx-32 text-xl'>Please ensure its correctness (eg-inception,spider-man)</h2>
                </div>
                <div className='flex justify-center pt-3 '>
                    <input type="text" placeholder="enter title" value={title} onChange={(e) => setTitle(e.target.value)} className="input bg-[#073C5B] border-4 text-2xl" />
                </div>
                <div className='flex justify-center pt-2.5'>
                    <button onClick={fetchRecommendations} className="px-6 py-3 rounded-2xl backdrop-blur-lg bg-white/10 border border-white/20 text-white shadow-lg hover:bg-white/20 hover:shadow-xl hover:scale-105 transition-all duration-300">
                        Get Recommendations
                    </button>
                </div>
                <div className='flex justify-center text-2xl'>
                    {error && <p style={{ color: "red" }}>{error}</p>}
                </div>


                <ul className="flex flex-col gap-6 text-xl text-center">

                    {movies.length > 0 && (
                        <li className="font-bold text-2xl pb-1 underline">
                            Recommendations like {movies[0]}
                        </li>
                    )}


                    {/* {movies.slice(1).map((m, i) => (
                        
                        <li key={i} className="flex flex-col items-center">
                            <span>{m}</span>
                            {renderStars(m)}
                        </li>
                    ))} */}

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 px-8 pt-16 pb-20">
                        {movies.slice(1).map((m, i) => (
                            <div
                                key={i}
                                className="bg-white/10 backdrop-blur-md border border-white/30 rounded-xl shadow-lg p-4 flex flex-col items-center"
                            >
                                <h3 className="text-xl font-bold text-white mb-2">{m}</h3>
                                <p className="text-white">Rate:</p>
                                {renderStars(m)}
                            </div>
                        ))}
                    </div>
                </ul>

            </section>

        </main>

    )
}

export default page
