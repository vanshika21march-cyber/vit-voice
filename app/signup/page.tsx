"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function SignupPage() {
  const router = useRouter();

  const [alias, setAlias] = useState("");
  const [email, setEmail] = useState("");
  const [campus, setCampus] = useState("");

  const handleSignup = async () => {
    if (!email.endsWith("@vit.ac.in")) {
  alert("Please use your VIT email ID only");
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        "tempPassword123"
      );

      await setDoc(doc(db, "users", userCred.user.uid), {
        alias,
        email,
        campus,
        createdAt: new Date(),
      });

      alert("Account created! Please login now.");
      router.push("/login");
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="bg-zinc-900 p-8 rounded-xl w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-center">Create Account 🚀</h1>

        <input
          placeholder="Alias"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          className="w-full p-3 rounded bg-zinc-800"
        />

        <input
          placeholder="VIT Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 rounded bg-zinc-800"
        />

        <select
          value={campus}
          onChange={(e) => setCampus(e.target.value)}
          className="w-full p-3 rounded bg-zinc-800"
        >
          <option value="">Select Campus</option>
          <option value="VIT-AP">VIT-AP</option>
          <option value="VIT-Vellore">VIT-Vellore</option>
          <option value="VIT-Chennai">VIT-Chennai</option>
          <option value="VIT-Bhopal">VIT-Bhopal</option>
        </select>

        <button
          onClick={handleSignup}
          className="w-full bg-pink-600 hover:bg-pink-700 py-3 rounded-xl font-semibold"
        >
          Sign Up →
        </button>

        <p className="text-center text-sm text-gray-400">
          Already have an account?{" "}
          <span
            onClick={() => router.push("/login")}
            className="text-blue-400 cursor-pointer"
          >
            Login
          </span>
        </p>
      </div>
    </main>
  );
}
