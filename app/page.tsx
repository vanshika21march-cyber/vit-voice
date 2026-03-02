"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        e.currentTarget.style.background = `
          radial-gradient(
            450px circle at ${x}px ${y}px,
            rgba(139,92,246,0.25),
            rgba(59,130,246,0.15),
            black 70%
          )
        `;
      }}
      className="relative min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex flex-col items-center justify-center px-6 overflow-hidden transition-colors duration-300"
    >

      {/* ⭐ Floating Gradient Blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          animate={{ y: [0, 40, 0], x: [0, 20, 0] }}
          transition={{ duration: 12, repeat: Infinity }}
          className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-pink-500 opacity-20 blur-[120px]"
        />
        <motion.div
          animate={{ y: [0, -40, 0], x: [0, -20, 0] }}
          transition={{ duration: 14, repeat: Infinity }}
          className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-blue-500 opacity-20 blur-[120px]"
        />
      </div>

      {/* ⭐ Drifting Stars */}
      {mounted && (
        <div className="absolute inset-0 -z-10">
          {[...Array(25)].map((_, i) => {
            const left = Math.random() * 100;
            const duration = 15 + Math.random() * 15;
            const opacity = Math.random();

            return (
              <motion.div
                key={i}
                initial={{ y: -100, opacity }}
                animate={{ y: "110vh" }}
                transition={{
                  duration,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{ left: `${left}%` }}
              />
            );
          })}
        </div>
      )}
      {/* ✨ Twinkling Static Stars */}
{mounted && (
  <div className="absolute inset-0 -z-20">
    {[...Array(89)].map((_, i) => (
      <div
        key={i}
        className="absolute bg-white rounded-full animate-pulse"
        style={{
          width: `${Math.random() * 2 + 1}px`,
          height: `${Math.random() * 2 + 1}px`,
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          opacity: Math.random(),
          animationDuration: `${Math.random() * 3 + 2}s`,
        }}
      />
    ))}
  </div>
)}


      {/* 🌠 Shooting Star */}
      <motion.div
        initial={{ x: -200, y: 0, opacity: 0 }}
        animate={{
          x: "120vw",
          y: 300,
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 12,
          ease: "easeInOut",
        }}
        className="absolute w-28 h-[1px] bg-gradient-to-r from-white to-transparent"
      />

      {/* 🌟 Content */}
      <h1 className="text-4xl md:text-6xl font-bold text-center mb-4">
        Problem2Project | VIT
      </h1>

      <p className="text-center text-lg md:text-xl text-gray-300 mb-10 max-w-xl">
        Turn real student problems into real tech projects. Team up, build, and grow together.
      </p>

      <div className="flex flex-col md:flex-row gap-6 w-full max-w-md">

        <motion.button
  whileHover={{ scale: 1.08 }}
  whileTap={{ scale: 0.95 }}
  transition={{ duration: 0 }}
  onClick={() => router.push("/campus")}

  className="relative overflow-hidden px-8 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium hover:bg-white/20 hover:shadow-[0_0_80px_rgba(255,255,255,0.5)] transition-all duration-300"
>
  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 hover:opacity-100 transition duration-500" />
  🌍 Campus Life Mode
</motion.button>


        <motion.button
  whileHover={{ scale: 1.12 }}
  whileTap={{ scale: 0.95 }}
  transition={{ duration: 0}}
  className="relative overflow-hidden px-8 py-3 rounded-full 
  bg-gradient-to-r from-blue-500/20 to-purple-500/20 
  backdrop-blur-md border border-blue-400/30 
  text-white font-medium 
  hover:from-blue-500/30 hover:to-purple-500/30 
  hover:shadow-[0_0_80px_rgba(59,130,246,0.5)] 
  transition-all duration-300"
  onClick={() => router.push("/growth")}
>
  {/* ✨ Shine Layer */}
  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 hover:opacity-100 transition duration-500" />

  🚀 Growth Mode
</motion.button>


      </div>

      <p className="mt-10 text-sm text-gray-400 text-center">
        Built by VIT students, for VIT students 💙
      </p>

    </main>
  );
}
