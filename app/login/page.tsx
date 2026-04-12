"use client";
import { auth } from "@/lib/firebase";
import toast from "react-hot-toast";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  return (
    <main className="min-h-screen text-white flex items-center justify-center px-6 relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 50%, #0d0d1a 0%, #000000 100%)" }}>

      {/* Starry background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(80)].map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 1 + "px",
              height: Math.random() * 2 + 1 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              opacity: Math.random() * 0.7 + 0.1,
            }}
          />
        ))}
      </div>

      {/* Gradient blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)" }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)" }} />

      {/* Glass card */}
      <div className="relative z-10 w-full max-w-md rounded-2xl p-8 border border-white/10"
        style={{
          background: "rgba(255, 255, 255, 0.04)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)"
        }}>

        {/* Close button */}
        <button
          onClick={() => router.push("/")}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all">
          ✕
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Welcome to Problem2Project 🚀</h1>
          <p className="text-gray-400 text-sm">Stay anonymous, but prove you're a VIT student.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block uppercase tracking-wider">VIT Email ID</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yourname@vitapstudent.ac.in"
              className="w-full px-4 py-3 rounded-xl outline-none text-white placeholder-gray-500 border border-white/10 focus:border-pink-500/50 transition-colors"
              style={{ background: "rgba(255,255,255,0.06)" }}
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block uppercase tracking-wider">Campus</label>
            <select disabled
              className="w-full px-4 py-3 rounded-xl text-gray-400 border border-white/10 cursor-not-allowed appearance-none"
              style={{ background: "rgba(255,255,255,0.06)" }}>
              <option>VIT AP (Andhra Pradesh)</option>
            </select>
          </div>
        </div>

        <button
          onClick={async () => {
            if (!email.endsWith("@vitapstudent.ac.in")) {
              toast.error("Please use your VIT email ID", { duration: 2500 });
              return;
            }
            try {
              await signInWithEmailAndPassword(auth, email, "tempPassword123");
              toast.success("Welcome back! 🎉");
              router.push("/");
            } catch (error: any) {
              toast.error("Account not found. Please sign up first.", { duration: 2500 });
            }
          }}
          className="w-full mt-6 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #ec4899, #db2777)" }}>
          Continue →
        </button>

        <p className="text-center text-sm text-gray-400 mt-4">
          Don't have an account?{" "}
          <span onClick={() => router.push("/signup")}
            className="text-pink-400 cursor-pointer hover:text-pink-300 transition-colors">
            Sign Up
          </span>
        </p>
      </div>
    </main>
  );
}