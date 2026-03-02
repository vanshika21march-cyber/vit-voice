"use client";
import { auth } from "@/lib/firebase";
import toast from "react-hot-toast";


import { signInWithEmailAndPassword } from "firebase/auth";


import { useState } from "react";


import { useRouter } from "next/navigation";


export default function LoginPage() {
  const router = useRouter();

  const [alias, setAlias] = useState("");
  const [email, setEmail] = useState("");
  const [campus, setCampus] = useState("");

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="bg-zinc-900 p-8 rounded-2xl w-full max-w-md">

        <h1 className="text-2xl font-bold mb-2">Welcome to Problem2Project 🚀</h1>
        <p className="text-gray-400 mb-6">
          Stay anonymous, but prove you're a VIT student.
        </p>

        <input
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          placeholder="Choose an alias (e.g. sleepyCoder)"
          className="w-full mb-4 px-4 py-2 rounded bg-zinc-800 outline-none"
        />

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="VIT Email ID"
          className="w-full mb-4 px-4 py-2 rounded bg-zinc-800 outline-none"
        />

        <select
          value={campus}
          onChange={(e) => setCampus(e.target.value)}
          className="w-full mb-6 px-4 py-2 rounded bg-zinc-800 outline-none"
        >
          <option value="">Select Campus</option>
          <option>VIT-AP</option>
          <option>VIT Vellore</option>
          <option>VIT Chennai</option>
          <option>VIT Bhopal</option>
        </select>

        
<button
  onClick={async () => {
    // basic validation
    if (!email.endsWith("@vit.ac.in")) {
  toast.error("Please use your VIT email ID only");

      return;
    }

    try {
      // sign in existing user (we used tempPassword123 when creating users)
      await signInWithEmailAndPassword(auth, email, "tempPassword123");

toast.success("Login successful 🎉");
router.push("/");

    } catch (error: any) {
      toast.error(error.message || "Login failed 😢");


      
      
    }
  }}
  className="w-full bg-blue-600 hover:bg-blue-700 transition py-3 rounded-xl font-semibold mt-4"
>
  Continue →
</button>


      </div>
    </main>
  );
}
