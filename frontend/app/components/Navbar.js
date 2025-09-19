import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

const Navbar = () => {
    return (
        <nav className="fixed top-0 left-0 w-full z-50 backdrop-blur-xl bg-white/10 border-b border-white/20 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img
                        src="/cast.svg"
                        alt="Logo"
                        className="h-10 w-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] hover:scale-105 transition-transform"
                    />
                    <span className="text-white text-2xl font-semibold tracking-wide drop-shadow-lg">ALLME</span>
                </div>
                <ul className="flex gap-6 text-white/80 font-medium">
                    <Link href={"/"} ><li className="hover:text-white transition">Home</li></Link>
                    <Link href={"/login"}><li className="hover:text-white transition">Login</li></Link>
                    <Link href={"/signup"}><li className="hover:text-white transition">Sign Up</li></Link>
                </ul>
            </div>
        </nav>
    )
}

export default Navbar
