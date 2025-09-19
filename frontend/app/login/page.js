"use client"
import React from 'react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify';
const page = () => {
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [user, setUser] = useState(null);
    const [islogin, setIslogin] = useState(false);
    const router = useRouter();

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


    const handlesumbit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await fetch("http://localhost:5500/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
                credentials: "include"
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "Something went wrong");
            }
            toast.success("Login successful");
            setEmail('');
            setPassword('');
            setIslogin(true);
            // router.push('/existing_user');

        } catch (err) {
            setError(err.message || "An error occurred");
            toast.error(err.message || "An error occurred");
        }

    };

    const logout = async () => {
        try {
            const res = await fetch("http://localhost:5500/api/logout", {
                method: "POST",
                credentials: "include"
            });
            if (!res.ok) {
                throw new Error("Logout failed");
            }
            toast.success("Logout successful");
            // router.push('/login');
            setIslogin(false);
            setEmail('');
            setPassword('');
        } catch (err) {
            toast.error(err.message || "An error occurred during logout");
        }
    };

    if (islogin) {
        return (
            <main>
                <section className="min-h-screen bg-[#2b4247] flex items-center justify-center px-4">
                    <div className="w-full max-w-sm bg-white/10 backdrop-blur-md border border-white/30 rounded-xl shadow-lg p-6">
                        <h2 className="text-2xl font-bold text-center text-white mb-6">You are logged in !</h2>
                        <button
                            onClick={logout}
                            className="w-full bg-red-500 text-white font-semibold py-2 rounded-md hover:bg-red-600 transition duration-200"
                        >
                            Logout
                        </button>
                    </div>
                </section>
            </main>
        );
    }



    return (
        <main>
            <section className="min-h-screen bg-[#2b4247] flex items-center justify-center px-4">
                <div className="w-full max-w-sm bg-white/10 backdrop-blur-md border border-white/30 rounded-xl shadow-lg p-6">
                    <h2 className="text-2xl font-bold text-center text-white mb-6">Login</h2>

                    <form className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-white mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 border border-white/20 bg-white/20 text-white rounded-md placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                                placeholder="Enter your email"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white mb-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-white/20 bg-white/20 text-white rounded-md placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                                placeholder="Enter your password"
                            />
                        </div>

                        <button
                            type="submit"
                            onClick={handlesumbit}
                            className="w-full bg-white/20 text-white font-semibold py-2 rounded-md hover:bg-white/30 transition duration-200"
                        >
                            Login
                        </button>
                        <p className="text-sm text-white/70 text-center ">
                            Don't have an account? <a href="/signup" className="text-white hover:underline">Sign Up</a></p>
                    </form>
                </div>
            </section>

        </main>
    )
}

export default page
