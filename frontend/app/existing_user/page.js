"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import { useState } from 'react';
import { useEffect } from 'react';
import { toast } from 'react-toastify';

const page = () => {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [rating, setRating] = useState([]);
    


    useEffect(() => {
        const checkUser = async () => {
            try {
                const res = await fetch("http://localhost:5500/api/user", {
                    method: "GET",
                    credentials: "include",
                });

                if (!res.ok) {
                    router.push("/login");
                    return;
                }

                const data = await res.json();
                setUser(data);
            } catch (error) {
                router.push("/login");
            }
        };

        checkUser();
    }, [router]);

    if (!user) {
        return <p className="text-white text-center mt-10">Loading...</p>;
    }

    

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
            toast.success("Rating lined for submission");
        } catch (err) {
            toast.error("Error submitting rating");
        }
    };

    const handleRating = (movie, rating) => {
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

    const renderStars = (movie,id) => {
        const currentRating = rating[movie] || 0;
        return (
            <div className="flex items-center gap-2">
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <span
                            key={star}
                            onClick={async () => {
                                handleRating(movie, star);
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
            </div >
        );
    };



    const svd = async () => {
        setLoading(true);
        try {
            const res = await fetch("http://localhost:5500/api/svd_recommend", {
                method: "GET",
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || data.message || "Something went wrong");
            }
            setMovies(data.recommendations);
            toast.success("Movies Fetched Successfully");
        } catch (err) {
            toast.error("❌ " + err.message);

        }
        finally {
            setLoading(false);
        }

    };




    return (
        <main className='min-h-screen bg-[#4a968c]'>
            <section className='flex flex-col items-center gap-8 py-24'>
                <h1 className='font-bold text-4xl'>Hello {user.name}</h1>
                <h2 className='font-serif text-2xl'>Movies Recommendation Based On Your Previous Ratings </h2>
                <h2 className='font-serif text-xl'>New model will train at 2:30(IST). Please try later if getting problem</h2>
                <h2 className='font-serif text-xl'>For testing use:- Email:user@gmail.com, Password:12345678</h2>
                

            </section>
            <section className='flex items-center justify-center '>
                <button
                    onClick={svd}
                    disabled={loading}
                    className={`px-6 py-3 rounded-2xl backdrop-blur-lg border text-white shadow-lg transition-all duration-300
                        ${loading
                            ? "bg-gray-500 cursor-not-allowed border-gray-400"
                            : "bg-white/10 border-white/20 hover:bg-white/20 hover:shadow-xl hover:scale-105"
                        }`}
                >
                    {loading
                        ? "Please wait... "
                        : "Get Recommendations"}

                </button>


            </section>
            <section>
                {movies.length > 0 && (
                    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 px-8 pt-16 pb-20'>
                        {movies.map((movie) => (
                            <div key={movie.id} className="bg-white/10 backdrop-blur-md border border-white/30 rounded-xl shadow-lg p-4">
    
                                <h3 className="text-xl font-bold text-white mb-2">{movie.title}</h3>
                                <p className="text-white">Predicted Rating: {movie.rating}</p>
                                <p className='text-white'>Rate:</p>
                                {renderStars(movie.title,movie.id)}

                            </div>
                        ))}
                    </div>
                )}
            </section>

        </main>
    )
}

export default page
