"use client";
import toast from "react-hot-toast";
import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";


import {
  addDoc,
  collection,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  where,
  doc,
  getDoc,
  updateDoc,
  increment,
} from "firebase/firestore";






import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";

export default function CampusPage() {
    const [alias, setAlias] = useState("");
const [campus, setCampus] = useState("");
const [title, setTitle] = useState("");
const [description, setDescription] = useState("");
const [category, setCategory] = useState("");
const [problems, setProblems] = useState<any[]>([]);
const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) return;

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setAlias(data.alias);
        setCampus(data.campus);
      }
    });

    return () => unsub();
  }, []);

const handleUpvote = async (id: string, currentVotes: number, upvotedBy: string[] = []) => {
  if (!userId) {
  toast.error("Please login first 😅");
  return;
}

  if (upvotedBy.includes(userId)) {
  toast("You already voted this 😐", { icon: "⚠️" });
  return;
}


  try {
    const docRef = doc(db, "campusProblems", id);

    await updateDoc(docRef, {
  votes: increment(1),
  upvotedBy: [...upvotedBy, userId],
});

toast.success("Upvoted 🔥");


  } catch (error: any) {
    toast.error(error.message);
    const handleStartWorking = async (
  id: string,
  workingBy: string[] = []
) => {
  if (!userId) {
    toast.error("Please login first 😅");
    return;
  }

  if (workingBy.includes(userId)) {
    toast("You're already working on this 💻");
    return;
  }

  try {
    const docRef = doc(db, "campusProblems", id);

    await updateDoc(docRef, {
      workingBy: [...workingBy, userId],
    });

    toast.success("You're now working on this 🚀");
  } catch (err: any) {
    toast.error(err.message);
  }
};


  }
};



const handleSubmit = async () => {
  if (!title || !description || !category) {
    toast.error("Please fill all fields 😅");
    return;
  }

  try {
    const problemsRef = collection(db, "campusProblems");

const q = query(
  problemsRef,
  where("title", "==", title.trim()),
  where("campus", "==", campus),
  where("category", "==", category)
);


const snapshot = await getDocs(q);

if (!snapshot.empty) {
  // Problem already exists
  const existingDoc = snapshot.docs[0];
  const docRef = doc(db, "campusProblems", existingDoc.id);

  await updateDoc(docRef, {
    votes: increment(1),
    upvotedBy: [...(existingDoc.data().upvotedBy || []), userId],
  });

  toast.success("Problem already exists — vote added 🔥");
} else {
  // Create new problem
  await addDoc(problemsRef, {
    title: title.trim(),
    description,
    category,
    campus,
    alias,
    votes: 1,
    upvotedBy: [userId],
    workingBy: [],
    createdAt: serverTimestamp(),
  });

  toast.success("Problem posted 🚀");
}


    

    setTitle("");
    setDescription("");
    setCategory("");
  } catch (error: any) {
    toast.error(error.message);
  }
};



 useEffect(() => {
  const q = query(
    collection(db, "campusProblems"),
    orderBy("votes", "desc")
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setProblems(list);
  });

  return () => unsubscribe();
}, []);

useEffect(() => {
  const unsub = onAuthStateChanged(auth, (user) => {
    if (user) setUserId(user.uid);
  });

  return () => unsub();
}, []);

  return (
  <main className="min-h-screen bg-black text-white px-6 py-10">

    <h2 className="text-lg text-gray-400 mb-2">
      👋 Hi, <span className="text-white font-semibold">{alias}</span> ({campus})
    </h2>

    <h1 className="text-3xl font-bold mb-2">🌍 Campus Life Mode</h1>
    <p className="text-gray-400 mb-8">
      Hostel, food, transport, mental health — drop what’s bothering you.
    </p>

    {/* ---------- POST PROBLEM BOX ---------- */}
    <div className="bg-zinc-900 p-6 rounded-xl mb-10">

      <h2 className="text-xl font-semibold mb-4">Post a Problem 😤</h2>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Short title (e.g. Cab prices are too high)"
        className="w-full mb-4 px-4 py-2 rounded bg-zinc-800 outline-none"
      />

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Explain your problem in detail..."
        className="w-full mb-4 px-4 py-2 rounded bg-zinc-800 outline-none h-28"
      />

      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full mb-4 px-4 py-2 rounded bg-zinc-800 outline-none"
      >
        <option value="">Choose category</option>
        <option value="Hostel">Hostel</option>
        <option value="Food">Food</option>
        <option value="Transport">Transport</option>
        <option value="Mental Health">Mental Health</option>
        <option value="Safety">Safety</option>
        <option value="Other">Other</option>
      </select>

      <button
        onClick={handleSubmit}
        className="w-full bg-pink-600 hover:bg-pink-700 transition py-3 rounded-lg font-semibold"
      >
        Submit Problem 🚀
      </button>
    </div>

    {/* ---------- TRENDING PROBLEMS ---------- */}
    <h2 className="text-xl font-semibold mb-4">🔥 Trending Problems</h2>

    {problems.length === 0 && (
      <p className="text-gray-400">No problems yet. Be the first to post 🤍</p>
    )}

    {problems.map((p: any) => (
      <div
        key={p.id}
        className="bg-zinc-900 p-4 rounded-xl mb-4 hover:bg-zinc-800 transition"
      >
        <p className="font-semibold text-lg">{p.title}</p>

        <p className="text-gray-400 text-sm">
          {p.category} • {p.campus}
        </p>

        <p className="text-gray-300 mt-2">{p.description}</p>

        <button
          onClick={() => handleUpvote(p.id, p.votes, p.upvotedBy || [])}

          className="mt-3 text-sm bg-pink-600 hover:bg-pink-700 px-4 py-1 rounded-full transition"
        >
          👍 Upvote ({p.votes})
        </button>
        <button
  onClick={() => handleStartWorking(p.id, p.workingBy || [])}
  className="mt-2 text-sm bg-blue-600 hover:bg-blue-700 px-4 py-1 rounded-full transition"
>
  💻 Start Working
</button>

<p className="text-blue-400 text-xs mt-1">
  {p.workingBy?.length || 0} students working on this
</p>

        <p className="text-pink-400 text-xs mt-1">
          🔥 {p.votes} students reported this
        </p>
      </div>
    ))}

  </main>
);
}