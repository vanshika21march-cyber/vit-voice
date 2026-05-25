"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Background3D from "@/components/Background3D";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({ totalActive: 0, totalSolved: 0, totalUsers: 0 });
  const [solvedProblems, setSolvedProblems] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);

    // Fetch live stats and solved problems
    const unsubProblems = onSnapshot(collection(db, "growthStruggles"), (snapshot) => {
      let active = 0;
      let solved = 0;
      const solvedList: any[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.status === "solved") {
          solved++;
          if (solvedList.length < 10) solvedList.push({ id: doc.id, ...data });
        } else {
          active++;
        }
      });

      setStats(prev => ({ ...prev, totalActive: active, totalSolved: solved }));
      setSolvedProblems(solvedList);
    });

    // Fetch user count (one-time fetch to save reads, or snapshot if preferred)
    getDocs(collection(db, "users")).then(snap => {
      setStats(prev => ({ ...prev, totalUsers: snap.size }));
    }).catch(console.error);

    return () => unsubProblems();
  }, []);

  return (
    <main
      className="relative isolate bg-white dark:bg-black text-gray-900 dark:text-white overflow-x-hidden transition-colors duration-500"
    >
      {/* Header Buttons */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-4 bg-white/50 dark:bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-gray-200 dark:border-white/10 shadow-sm">
        <button 
          onClick={() => {
            document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition hidden sm:block mr-2"
        >
          About
        </button>
        <button 
          onClick={() => router.push('/login')}
          className="text-sm font-medium px-4 py-2 bg-[#00d0e6]/10 text-[#00d0e6] hover:bg-[#00d0e6]/20 rounded-full transition"
        >
          Login
        </button>
        <button 
          onClick={() => router.push('/signup')}
          className="text-sm font-medium px-4 py-2 bg-pink-500/10 text-pink-600 dark:text-pink-400 hover:bg-pink-500/20 rounded-full transition"
        >
          Sign Up
        </button>
      </div>

      {/* Fixed Backgrounds */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* 💫 Shooting Stars Background */}
        <div className="absolute inset-0">
          {/* Far: Small, slow, dim, appears roughly every 85s */}
          <div className="shooting-star top-[15%] left-[-10%]" style={{ '--star-delay': '5s', '--star-duration': '85s', '--star-length': '50px', '--star-scale': '0.5', '--star-distance': '1000px', '--star-opacity': '0.3' } as any}></div>
          {/* Mid: Medium size/speed/brightness, appears roughly every 65s */}
          <div className="shooting-star top-[40%] left-[-5%]" style={{ '--star-delay': '25s', '--star-duration': '65s', '--star-length': '70px', '--star-scale': '0.8', '--star-distance': '1500px', '--star-opacity': '0.5' } as any}></div>
          {/* Near: Larger, fast, bright, appears roughly every 45s */}
          <div className="shooting-star top-[5%] left-[10%]" style={{ '--star-delay': '40s', '--star-duration': '45s', '--star-length': '90px', '--star-scale': '1.2', '--star-distance': '2000px', '--star-opacity': '0.8' } as any}></div>
        </div>
        {/* ✨ 3D Interactive Background */}
        {mounted && <Background3D />}
      </div>

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 z-10 w-full pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center w-full"
        >
        <div className="flex flex-col items-center mb-6">
          <h1 className="text-5xl md:text-7xl font-extrabold text-center tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-blue-500 leading-tight">
            Problem2Project
          </h1>
          <span className="text-sm md:text-base font-bold text-gray-400 dark:text-gray-500 tracking-[0.4em] uppercase mt-1 ml-1">
            VIT
          </span>
        </div>

        <p className="text-center text-lg md:text-xl text-gray-500 dark:text-gray-400 mb-12 max-w-2xl font-normal leading-relaxed">
          Turn real student problems into real tech projects. <br className="hidden md:block" /> Team up, build socially, and grow together.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl justify-center">

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/campus")}
            className="px-8 py-3.5 rounded-full bg-transparent border border-gray-300 dark:border-gray-700 text-black dark:text-white font-medium transition-all duration-300 hover:text-[#00d0e6] dark:hover:text-[#00d0e6] hover:border-[#00d0e6] dark:hover:border-[#00d0e6] hover:shadow-[0_0_25px_rgba(0,208,230,0.4)] w-full sm:w-auto min-w-[200px]"
          >
            Campus Life Mode
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/growth")}
            className="px-8 py-3.5 rounded-full bg-transparent border border-gray-300 dark:border-gray-700 text-black dark:text-white font-medium transition-all duration-300 hover:text-pink-500 dark:hover:text-pink-500 hover:border-pink-500 dark:hover:border-pink-500 hover:shadow-[0_0_25px_rgba(236,72,153,0.4)] w-full sm:w-auto min-w-[200px]"
          >
            Growth Mode
          </motion.button>

        </div>

        <p className="mt-14 text-xs font-normal text-gray-400 dark:text-gray-600 text-center uppercase tracking-widest hidden sm:block">
          Built by VIT students, for VIT students
        </p>
      </motion.div>

        {/* --- New Minimal Features --- */}

        {/* 1. Interface Peek (Frosted Glass at the very bottom) */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl h-32 md:h-48 z-0 overflow-hidden rounded-t-3xl border-t border-x border-gray-200 dark:border-white/10 bg-white/30 dark:bg-black/40 backdrop-blur-xl opacity-40 mix-blend-luminosity pointer-events-none transition-colors duration-500">
          <div className="absolute inset-x-0 top-0 h-8 border-b border-gray-200/50 dark:border-white/5 flex items-center px-4 gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-white/20"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-white/20"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-white/20"></div>
          </div>
          {/* Fading gradient to blend into the bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 dark:from-black dark:via-black/80 to-transparent"></div>
        </div>

        <div className="absolute bottom-6 left-0 right-0 z-20 flex flex-col items-center gap-4 pointer-events-none">
          {/* 2. Hall of Fame Ticker */}
          {solvedProblems.length > 0 && (
            <div className="w-full max-w-3xl overflow-hidden mask-image-linear-edges relative h-6 opacity-60">
              <motion.div
                animate={{ x: [0, -1000] }}
                transition={{ repeat: Infinity, ease: "linear", duration: 25 }}
                className="flex whitespace-nowrap gap-8 absolute left-0"
              >
                {[...solvedProblems, ...solvedProblems, ...solvedProblems].map((p, i) => (
                  <div key={`${p.id}-${i}`} className="text-[11px] font-medium text-gray-400 dark:text-gray-500 flex items-center gap-2 tracking-wide uppercase">
                    <span className="text-[#00d0e6]">🏆</span> {p.title.length > 30 ? p.title.substring(0, 30) + '...' : p.title} marked as solved
                  </div>
                ))}
              </motion.div>
            </div>
          )}

          {/* 3. Live Platform Pulse Stats */}
          <div className="flex items-center gap-4 md:gap-8 px-6 py-2 rounded-full bg-white/50 dark:bg-black/50 backdrop-blur-md border border-gray-200 dark:border-zinc-800 text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 tracking-widest uppercase shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {stats.totalUsers} Students
            </div>
            <div className="w-px h-3 bg-gray-300 dark:bg-zinc-700"></div>
            <div>{stats.totalActive} Active Problems</div>
            <div className="w-px h-3 bg-gray-300 dark:bg-zinc-700"></div>
            <div className="text-pink-500">{stats.totalSolved} Projects Built</div>
          </div>
        </div>
      </section>

      {/* 📖 About Section */}
      <section id="about" className="relative flex flex-col items-center justify-center min-h-screen px-6 py-24 z-10 bg-white/30 dark:bg-black/40 backdrop-blur-md border-t border-gray-200 dark:border-white/5">
        <div className="max-w-5xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400">
              What is Problem2Project?
            </h2>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              The ultimate social & academic operating system for VIT students. We bridge the gap between campus problems and tech solutions.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="p-8 rounded-3xl bg-white/60 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 group hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#00d0e6]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-[#00d0e6]/20">
                <span className="text-[#00d0e6] text-2xl">🚀</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Campus Life Mode</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Connect with the pulse of VIT. Access anonymous campus intelligence, stay updated with real-time placement alerts, and engage in our karma-based social economy. Network smarter, not harder.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="p-8 rounded-3xl bg-white/60 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 group hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-2xl bg-pink-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-pink-500/20">
                <span className="text-pink-500 text-2xl">💡</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Growth Mode</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Level up your academic journey. Turn your struggles into collaborative tech projects. Utilize AI-assisted study tools, generate smart schedules, and track your performance in real-time.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-12 p-8 rounded-3xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-[#00d0e6]/10 border border-white/20 dark:border-white/10 text-center backdrop-blur-sm"
          >
            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Built by Students, For Students</h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              We understand the VIT hustle because we're living it. Problem2Project is an open ecosystem designed to transform everyday campus friction into portfolio-worthy creations.
            </p>
            <button
              onClick={() => router.push('/signup')}
              className="mt-8 px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-black font-medium rounded-full hover:scale-105 transition-transform duration-300 shadow-md"
            >
              Join the Community
            </button>
          </motion.div>
        </div>
      </section>

    </main>
  );
}

