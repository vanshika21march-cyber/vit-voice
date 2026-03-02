"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import toast from "react-hot-toast";
import { onSnapshot } from "firebase/firestore";
import {
  addDoc,
  collection,
  query,
  where,
  doc,
  updateDoc,
  increment,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

import { getDocs } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

export default function GrowthPage() {
      const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [struggles, setStruggles] = useState<any[]>([]);
  const [alias, setAlias] = useState("");
  const [campus, setCampus] = useState("");
  const [userId, setUserId] = useState<string | null>(null);


  const handleSubmit = async () => {
  if (!title || !description || !category) {
    toast.error("Please fill all fields 😅");

    return;
  }

  try {
  const strugglesRef = collection(db, "growthStruggles");

  const q = query(
    strugglesRef,
    where("title", "==", title.trim())
  );

  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    // Struggle already exists → increase vote
    const existingDoc = snapshot.docs[0];
    const docRef = doc(db, "growthStruggles", existingDoc.id);

    await updateDoc(docRef, {
      votes: increment(1),
      upvotedBy: [...(existingDoc.data().upvotedBy || []), userId],
    });

    alert("Struggle already exists — vote added 🔥");
  } else {
    // Create new struggle
    await addDoc(strugglesRef, {
      title: title.trim(),
      description,
      category,
      createdAt: serverTimestamp(),
      votes: 1,
      upvotedBy: [userId],
    });

    alert("Struggle posted 🚀");
  }

  setTitle("");
  setDescription("");
  setCategory("");

}
 catch (error: any) {
    alert(error.message);
  }
};
useEffect(() => {
  const q = query(
    collection(db, "growthStruggles"),
    orderBy("votes", "desc")
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setStruggles(list);
  });

  return () => unsubscribe();
}, []);


const handleUpvote = async (id: string, currentVotes: number, upvotedBy: string[] = []) => {
 if (!userId) {
  toast.error("Please login first 😶‍🌫️");
  return;
}

  const voters = upvotedBy || [];

if (voters.includes(userId)) {
  return toast("You already voted this 😬", { icon: "⚠️" });
}



  try {
    const docRef = doc(db, "growthStruggles", id);

    await updateDoc(docRef, {
  votes: currentVotes + 1,
  upvotedBy: [...voters, userId],
});


  } catch (error: any) {
    alert(error.message);
  }
};




useEffect(() => {
  const unsub = onAuthStateChanged(auth, (user) => {
    if (user) setUserId(user.uid);
  });

  return () => unsub();
}, []);


  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      
      <h1 className="text-3xl font-bold mb-2">🎓 Growth Mode</h1>
      <p className="text-gray-400 mb-8">
        Internships, exams, skills, confidence — let’s grow together.
      </p>

      <div className="bg-zinc-900 p-6 rounded-xl mb-10">
        <h2 className="text-xl font-semibold mb-4">Post Your Struggle 😵‍💫</h2>

        <input
  type="text"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
  placeholder="Short title (e.g. Not getting internship calls)"
  className="w-full mb-4 px-4 py-2 rounded bg-zinc-800 text-white outline-none"
/>


        <textarea
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  placeholder="Explain what you are struggling with..."
  className="w-full mb-4 px-4 py-2 rounded bg-zinc-800 text-white outline-none h-28"
/>


        <select
  value={category}
  onChange={(e) => setCategory(e.target.value)}
  className="w-full mb-4 px-4 py-2 rounded bg-zinc-800 text-white outline-none"
>
  <option value="">Choose category</option>
  <option value="Internships">Internships</option>
  <option value="Exams">Exams</option>
  <option value="Skills">Skills</option>
  <option value="Career">Career confusion</option>
  <option value="Mental Health">Mental Health</option>
  <option value="Other">Other</option>
</select>


       <button
  onClick={handleSubmit}
  className="w-full bg-blue-600 hover:bg-blue-700 transition py-3 rounded-lg"
>
  Submit 🚀
</button>

      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">🔥 Trending Struggles</h2>

        {struggles.length === 0 && (
  <p className="text-gray-400">No struggles yet. Be the first to post 💪</p>
)}

{struggles.map((s: any) => (
  <div
    key={s.id}
    className="bg-zinc-900 p-4 rounded-xl mb-4 hover:bg-zinc-800 transition"
  >
    <p className="font-semibold text-lg">{s.title}</p>

    <p className="text-gray-400 text-sm">
      {s.category} • {s.campus}
    </p>

    <p className="text-gray-300 mt-2">{s.description}</p>

    <div className="flex items-center gap-3 mt-3">
      <button
        onClick={() => handleUpvote(s.id, s.votes, s.upvotedBy || [])}

        className="bg-blue-600 hover:bg-blue-700 px-4 py-1 rounded-full text-sm"
      >
        👍 Upvote ({s.votes})
      </button>

      <span className="text-blue-400 text-sm">
        {s.votes} students facing this
      </span>
    </div>
  </div>
))}

      </div>

    </main>
  );
}

