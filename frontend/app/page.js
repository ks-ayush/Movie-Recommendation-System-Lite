"use client";
import Image from "next/image";
import dynamic from "next/dynamic";
import Head from "next/head";
import Footer from "./components/Footer";
import Link from "next/link";

const Aurora = dynamic(() => import("./components/Aurora"), { ssr: false });


export default function Home() {
  return (
    <>
      <Head>
        <title>Aurora Demo</title>
      </Head>
      <main className="min-h-screen bg-black">
        <div className="relative w-full h-[100vh]">
          <Aurora
            amplitude={1.2}
            blend={0.45}
            colorStops={["#ff4d4d", "#3f51b5", "#00e676"]}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 text-white text-center px-6 gap-6">
            <h1 className="text-3xl font-bold">MOVIE RECOMMENDATION SYSTEM</h1>

            <section className="grid grid-cols-1  md:grid-cols-2 gap-16 max-w-4xl text-left text-base font-normal">
              <div>
                <h1 className="font-bold text-2xl mb-1">For New User</h1>
                <p className="mb-2 text-xl">
                  🎬 A movie recommendation system for new users. The system uses models to provide recommendations based on the movie entered by user.
                </p>
                <p className="mt-3.5">
                  <Link href={"/new_user"}><button className="px-6 py-3 rounded-2xl backdrop-blur-lg bg-white/10 border border-white/20 text-white shadow-lg hover:bg-white/20 hover:shadow-xl hover:scale-105 transition-all duration-300">
                    Get Started
                  </button></Link>
                </p>
              </div>

              <div>
                <h1 className="font-bold text-2xl mb-1">For Existing User</h1>
                <p className="mb-2 text-xl">
                  🎬  A movie recommendation system for existing user. The system uses collaborative filtering to recommend movies based on users ratings.
                </p>
                <p className="mt-3.5">
                  <Link href={"/existing_user"}><button className="px-6 py-3 rounded-2xl backdrop-blur-lg bg-white/10 border border-white/20 text-white shadow-lg hover:bg-white/20 hover:shadow-xl hover:scale-105 transition-all duration-300">
                    Get Started
                  </button></Link>
                </p>
              </div>
            </section>

          </div>
          <div>
            <Image
              src="/cast.svg"
              alt="Logo"
              width={200}
              height={200}
              className="absolute bottom-20 right-4 h-16 w-16 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] hover:scale-105 transition-transform"
            />
          </div>
          <div className="absolute bottom-0 left-0 w-full">
            <Footer />

          </div>
        </div>
      </main>
    </>
  );
}
