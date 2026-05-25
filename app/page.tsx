"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Background3D from "@/components/Background3D";
import { ThemeToggle } from "@/components/ThemeToggle";

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
      className="relative isolate min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white flex flex-col items-center justify-center px-6 overflow-hidden transition-colors duration-500"
    >
      {/* Header Buttons */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-4">
        <button 
          onClick={() => router.push('/login')}
          className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition"
        >
          Login
        </button>
        <button 
          onClick={() => router.push('/signup')}
          className="text-sm font-medium px-4 py-2 bg-pink-500/10 text-pink-600 dark:text-pink-400 hover:bg-pink-500/20 rounded-full transition"
        >
          Sign Up
        </button>
        <div className="w-px h-4 bg-gray-300 dark:bg-gray-700"></div>
        <ThemeToggle />
      </div>

      <></>

      {/* ✨ 3D Interactive Background */}
      {mounted && <Background3D />}

      {/* 🌟 Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center z-10"
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

    </main>
  );
}

