"use client"
import React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify';

const page = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const router = useRouter(); 

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const res = await fetch("http://localhost:5500/api/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, mobile, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || data.message || "Something went wrong");
            }

            toast.success("✅ " + data.message);
            setName('');
            setEmail('');
            setMobile('');
            setPassword('');

            router.push('/login'); 

        } catch (err) {
            setError(err.message || "An error occurred");
            toast.error("❌ " + err.message);
        }
    };
    return (
        <main>
            <section className="min-h-screen bg-[#2b4247] flex items-center justify-center px-4">
                <div className="w-full max-w-sm bg-white/10 backdrop-blur-md border border-white/30 rounded-xl shadow-lg p-6">
                    <h2 className="text-2xl font-bold text-center text-white mb-6">Sign Up</h2>

                    <form className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-white mb-1">Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2 border border-white/20 bg-white/20 text-white rounded-md placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                                placeholder="Enter your Name"
                            />
                        </div>
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
                            <label className="block text-sm font-medium text-white mb-1">Mobile Number</label>
                            <input
                                type="tel"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                                className="w-full px-4 py-2 border border-white/20 bg-white/20 text-white rounded-md placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                                placeholder="Enter your mobile number"
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
                            onClick={handleSubmit}
                            className="w-full bg-white/20 text-white font-semibold py-2 rounded-md hover:bg-white/30 transition duration-200"
                        >
                            Sign Up
                        </button>
                    </form>
                </div>
            </section>
        </main>
    )
}

export default page
