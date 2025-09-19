import React from 'react'

const Footer = () => {
    return (
        <main>
            <footer className="w-full z-50 backdrop-blur-xl bg-white/10 border-b border-white/20 shadow-lg text-white py-6 px-8 mt-16 ">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/80">
                    <div>
                        <span className="font-semibold text-white">© 2025 ALLME</span> — All rights reserved
                    </div>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-white transition-colors">Proudly Made In India</a>
                    </div>
                </div>
            </footer>

        </main>
    )
}

export default Footer

