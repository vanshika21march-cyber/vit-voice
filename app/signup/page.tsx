"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import toast from "react-hot-toast";

export default function SignupPage() {
  const router = useRouter();
  const [alias, setAlias] = useState("");
  const [email, setEmail] = useState("");

  const handleSignup = async () => {
    if (!alias.trim()) {
      toast.error("Please choose an alias", { duration: 2500 });
      return;
    }
    if (!email.endsWith("@vitapstudent.ac.in")) {
      toast.error("Please use your VIT email ID", { duration: 2500 });
      return;
    }
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, "tempPassword123");
      await setDoc(doc(db, "users", userCred.user.uid), {
        alias,
        email,
        campus: "VIT AP",
        createdAt: new Date(),
      });
      toast.success("Account created! Please login now.", { duration: 2500 });
      router.push("/login");
    } catch (error: any) {
      toast.error("Account already exists or signup failed", { duration: 2500 });
    }
  };

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
      <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)" }} />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)" }} />

      {/* Glass card */}
      <div className="relative z-10 w-full max-w-md rounded-2xl p-8 border border-white/10"
        style={{
          background: "rgba(255, 255, 255, 0.04)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)"
        }}>

        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Create Account 🚀</h1>
          <p className="text-gray-400 text-sm">Join your VIT campus community anonymously.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block uppercase tracking-wider">Your Alias</label>
            <input
              placeholder="e.g. sleepyCoder"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className="w-full px-4 py-3 rounded-xl outline-none text-white placeholder-gray-500 border border-white/10 focus:border-pink-500/50 transition-colors"
              style={{ background: "rgba(255,255,255,0.06)" }}
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block uppercase tracking-wider">VIT Email ID</label>
            <input
              placeholder="yourname@vitapstudent.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl outline-none text-white placeholder-gray-500 border border-white/10 focus:border-pink-500/50 transition-colors"
              style={{ background: "rgba(255,255,255,0.06)" }}
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block uppercase tracking-wider">Campus</label>
            <select
              className="w-full px-4 py-3 rounded-xl text-gray-400 border border-white/10 appearance-none cursor-not-allowed"
              style={{ background: "rgba(255,255,255,0.06)" }}
              disabled>
              <option>VIT AP (Andhra Pradesh)</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleSignup}
          className="w-full mt-6 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #ec4899, #db2777)" }}>
          Sign Up →
        </button>

        <p className="text-center text-sm text-gray-400 mt-4">
          Already have an account?{" "}
          <span onClick={() => router.push("/login")}
            className="text-pink-400 cursor-pointer hover:text-pink-300 transition-colors">
            Login
          </span>
        </p>
      </div>
    </main>
  );
}
