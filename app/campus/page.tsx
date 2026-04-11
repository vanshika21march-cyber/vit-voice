"use client";
import toast from "react-hot-toast";
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
  deleteDoc,
  increment,
  onSnapshot,
  limit
} from "firebase/firestore";
import { useEffect, useState, useRef } from "react";
import { auth, db, storage } from "@/lib/firebase";
import { ref, uploadBytes, uploadString, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Search, Bell, Settings, Plus, X, MessageCircle, Zap, ThumbsUp, Users, AlertCircle, ArrowRight, Phone, Video, MoreVertical, Send, Paperclip, Maximize2, Minimize2, LogOut, CalendarIcon, CalendarPlus, Sparkles, Reply, Trash2, ChevronDown } from "lucide-react";

const CATEGORIES = [
  { name: "All Problems", icon: "🔥", count: 0 },
  { name: "Hall of Fame", icon: "🏆", count: 0 },
  { name: "Hostel", icon: "⛺", count: 0 },
  { name: "Food", icon: "🍕", count: 0 },
  { name: "Transport", icon: "🚌", count: 0 },
  { name: "Mental Health", icon: "🧠", count: 15 },
  { name: "Academics", icon: "📚", count: 23 },
  { name: "Sports", icon: "⚽", count: 7 },
  { name: "Tech Issues", icon: "💻", count: 9 },
  { name: "Events", icon: "🎨", count: 11 },
];

export default function CampusPage() {
  const router = useRouter();
  const [alias, setAlias] = useState("");
  const [campus, setCampus] = useState("VIT AP");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("All Problems");
  const [problems, setProblems] = useState<any[]>([]);
  const [campusUsers, setCampusUsers] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All Problems");
  const [newPostCategory, setNewPostCategory] = useState("Other");

  const [isSolutionModalOpen, setIsSolutionModalOpen] = useState(false);
  const [problemToSolve, setProblemToSolve] = useState<{id: string, alias: string} | null>(null);
  const [solutionText, setSolutionText] = useState("");

  // Chat State
  const [activeChat, setActiveChat] = useState<any>(null); // the problem object
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [replyingTo, setReplyingTo] = useState<{id: string, text: string, sender: string} | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Unread Messages State
  const [readCounts, setReadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const saved = localStorage.getItem("campusReadCounts");
    if (saved) {
      try { setReadCounts(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (activeChat) {
      const latestChatInfo = problems.find(p => p.id === activeChat.id);
      const latestCount = latestChatInfo?.messageCount || activeChat.messageCount || 0;
      
      setReadCounts(prev => {
        const next = { ...prev, [activeChat.id]: latestCount };
        localStorage.setItem("campusReadCounts", JSON.stringify(next));
        return next;
      });
    }
  }, [chatMessages, activeChat, problems]);
  const [newMessage, setNewMessage] = useState("");
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [isCalling, setIsCalling] = useState<string | false>(false);
  const [meetLinkInput, setMeetLinkInput] = useState("");
  const currentChatData = problems.find(p => p.id === activeChat?.id) || activeChat;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<{
    file: File | null;
    progress: number;
    url: string | null;
    type: string;
    name: string;
  } | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Meetup State
  const [isMeetupModalOpen, setIsMeetupModalOpen] = useState(false);
  const [meetupDate, setMeetupDate] = useState("");
  const [meetupTime, setMeetupTime] = useState("");
  const [meetupLocation, setMeetupLocation] = useState("");
  const [meetups, setMeetups] = useState<any[]>([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // AI Summarizer State
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [chatSummary, setChatSummary] = useState<string | null>(null);
  
  const [isDashboardSummarizing, setIsDashboardSummarizing] = useState(false);
  const [dashboardSummary, setDashboardSummary] = useState<string | null>(null);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Settings State
  const [pushEnabled, setPushEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [anonEnabled, setAnonEnabled] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setUserId(null);
        return;
      }
      setUserId(user.uid);

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setAlias(data.alias);
        setCampus(data.campus || "VIT AP");
      }
    });

    return () => unsub();
  }, []);

  // Fetch Problems
  useEffect(() => {
    if (!campus) return;
    const q = query(
      collection(db, "campusProblems"),
      where("campus", "==", campus),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as any[];
        // Sort client-side to prevent needing a composite index
        list.sort((a, b) => (b.votes || 0) - (a.votes || 0));
        setProblems(list);
      },
      (error: any) => {
        console.error("Error fetching campus problems:", error);
        if (error.code === "permission-denied") {
          toast.error("Please login to see the problems! 😅");
        }
      }
    );

    return () => unsubscribe();
  }, [campus]);

  // Fetch Campus Users for "Online Students" list
  useEffect(() => {
    if (!campus) return;
    const q = query(
      collection(db, "users"),
      where("campus", "==", campus),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCampusUsers(list);
      },
      (error: any) => {
        console.error("Error fetching campus users:", error);
      }
    );

    return () => unsubscribe();
  }, [campus]);

  // Fetch Active Chat Messages
  useEffect(() => {
    if (!activeChat) return;

    const q = query(
      collection(db, "campusProblems", activeChat.id, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setChatMessages(msgs);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      },
      (error: any) => {
        console.error("Error fetching messages:", error);
      }
    );

    return () => unsubscribe();
  }, [activeChat]);

  // Fetch Meetups
  useEffect(() => {
    if (!campus) return;
    const q = query(
      collection(db, "meetups"),
      where("campus", "==", campus)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as any[];

        // Sort client-side to avoid composite index requirement
        list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setMeetups(list);
      },
      (error: any) => {
        console.error("Error fetching meetups:", error);
      }
    );

    return () => unsubscribe();
  }, [campus]);

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
    }
  };

  const handleStartWorking = async (
    problem: any
  ) => {
    if (!userId) {
      toast.error("Please login first 😅");
      return;
    }

    const workingBy = problem.workingBy || [];

    if (workingBy.includes(userId)) {
      // Already actively working => open chat
      setActiveChat(problem);
      return;
    }

    // Join the group
    try {
      const docRef = doc(db, "campusProblems", problem.id);

      await updateDoc(docRef, {
        workingBy: [...workingBy, userId],
      });

      toast.success("Joined Group! 🚀");
      // Auto open chat after joining
      setActiveChat({ ...problem, workingBy: [...workingBy, userId] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleOpenSolutionModal = (id: string, problemAlias: string) => {
    if (!userId) return;
    if (alias !== problemAlias) {
      toast.error("Only the creator can mark this as solved!");
      return;
    }
    setProblemToSolve({ id, alias: problemAlias });
    setIsSolutionModalOpen(true);
  };

  const handleMarkAsSolved = async () => {
    if (!problemToSolve) return;
    if (!solutionText.trim()) {
      toast.error("You must explicitly provide a solution to add it to Hall of Fame!");
      return;
    }

    try {
      const docRef = doc(db, "campusProblems", problemToSolve.id);
      await updateDoc(docRef, {
        status: "solved",
        solution: solutionText.trim(),
        solvedAt: serverTimestamp(),
      });
      toast.success("Problem marked as solved! Added to Hall of Fame 🏆");
      setIsSolutionModalOpen(false);
      setSolutionText("");
      setProblemToSolve(null);
    } catch (err: any) {
      toast.error("Failed to mark as solved: " + err.message);
    }
  };

  const handleScheduleMeetup = async () => {
    if (!activeChat || !userId) return;
    if (!meetupDate) { toast.error("Please specify a Date for the meetup!"); return; }
    if (!meetupTime) { toast.error("Please specify a Time for the meetup!"); return; }
    if (!meetupLocation.trim()) { toast.error("Please specify a Location!"); return; }

    try {
      await addDoc(collection(db, "meetups"), {
        problemId: activeChat.id,
        problemTitle: activeChat.title,
        campus: activeChat.campus || campus,
        creatorId: userId,
        creatorAlias: alias,
        date: meetupDate,
        time: meetupTime,
        location: meetupLocation,
        createdAt: serverTimestamp(),
      });
      toast.success("Meetup Scheduled! 📅");
      setIsMeetupModalOpen(false);
      setMeetupDate("");
      setMeetupTime("");
      setMeetupLocation("");
    } catch (err: any) {
      toast.error("Failed to schedule meetup: " + err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (err: any) {
      toast.error("Logout failed: " + err.message);
    }
  };

  const handleSummarizeChat = async () => {
    if (!activeChat || chatMessages.length === 0) {
      toast.error("No messages to summarize yet!");
      return;
    }

    setIsSummarizing(true);
    setChatSummary(null);

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: activeChat.title,
          messages: chatMessages.slice(-50), // Send last 50 messages to save tokens
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate summary');
      }

      setChatSummary(data.summary);
      toast.success("Summary generated!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleDashboardSummary = async () => {
    if (activeGroups.length === 0) {
      toast.error("You don't have any active groups to summarize!");
      return;
    }

    setIsDashboardSummarizing(true);
    setDashboardSummary(null);

    try {
      const groupsData = [];
      
      // Fetch latest 50 messages for each active group
      for (const group of activeGroups) {
        const q = query(collection(db, "campusProblems", group.id, "messages"), orderBy("createdAt", "desc"), limit(50));
        const snapshot = await getDocs(q);
        const msgs = snapshot.docs.map(doc => doc.data()).reverse();
        
        if (msgs.length > 0) {
          groupsData.push({
            title: group.title,
            messages: msgs.map(m => ({ senderName: m.senderName, text: m.text }))
          });
        }
      }

      if (groupsData.length === 0) {
        toast.error("No recent messages found in your active groups.");
        setIsDashboardSummarizing(false);
        return;
      }

      const response = await fetch('/api/summarize_dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groups: groupsData }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate dashboard summary');
      }

      setDashboardSummary(data.summary);
      toast.success("Dashboard Catch-up Ready!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsDashboardSummarizing(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!userId || !activeChat) return;

    try {
      const docRef = doc(db, "campusProblems", activeChat.id);

      const newWorkingBy = activeChat.workingBy.filter((id: string) => id !== userId);

      await updateDoc(docRef, {
        workingBy: newWorkingBy,
      });

      toast.success("Left group chat 👋");
      setActiveChat(null);
      setIsChatExpanded(false);
      setIsCalling(false);
    } catch (err: any) {
      toast.error("Failed to leave group: " + err.message);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Please provide a problem title! 😅");
      return;
    }
    if (!description.trim()) {
      toast.error("Please explain your problem in the description! 😅");
      return;
    }

    if (!campus) {
      toast.error("Wait for campus to load 😅");
      return;
    }

    setIsAnalyzing(true);
    let duplicateOfId = null;

    try {
      const existingProblemsData = problems.slice(0, 50).map(p => ({ id: p.id, title: p.title, description: p.description }));
      
      const response = await fetch("/api/deduplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description, existingProblems: existingProblemsData })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.duplicateId && data.duplicateId !== "NO_MATCH") {
          duplicateOfId = data.duplicateId;
        }
      }
    } catch (e) {
      console.error("AI deduplication failed", e);
    }
    
    setIsAnalyzing(false);

    if (duplicateOfId) {
      toast.success("Problem already exists! Auto-upvoted it for you ❤️");
      const existingP = problems.find(p => p.id === duplicateOfId);
      if (existingP) {
        handleUpvote(existingP.id, existingP.votes, existingP.upvotedBy || []);
      }
      setIsModalOpen(false);
      setTitle("");
      setDescription("");
      setNewPostCategory("Other");
      return;
    }

    try {
      const problemsRef = collection(db, "campusProblems");

      // Verify exact name duplicate locally just in case
      const q = query(
        problemsRef,
        where("title", "==", title.trim()),
        where("campus", "==", campus)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        toast.error("Exact title already exists! Please search for it.");
        return;
      }

      await addDoc(problemsRef, {
        title: title.trim(),
        description,
        category: newPostCategory,
        campus,
        alias,
        votes: 1,
        status: "open",
        upvotedBy: [userId],
        workingBy: [],
        createdAt: serverTimestamp(),
        messageCount: 0,
      });

      toast.success(`Posted in ${newPostCategory} ✨`);

      setTitle("");
      setDescription("");
      setNewPostCategory("Other");
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSaveMeetLink = async () => {
    if (!meetLinkInput.trim() || !activeChat) return;
    try {
      const docRef = doc(db, "campusProblems", activeChat.id);
      await updateDoc(docRef, { meetLink: meetLinkInput.trim() });
      setMeetLinkInput("");
    } catch (e) {
      toast.error("Failed to share Meet link");
    }
  };

  const handleEndMeet = async () => {
    if (!activeChat) return;
    try {
      const docRef = doc(db, "campusProblems", activeChat.id);
      await updateDoc(docRef, { meetLink: "" });
    } catch (e) {
      toast.error("Failed to end Meet");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChat || !userId) return;
    const messageText = newMessage.trim();
    if (!messageText && !pendingAttachment?.url) return;

    const currentReplyTo = replyingTo ? { ...replyingTo } : null;
    const currentAttachment = pendingAttachment ? { ...pendingAttachment } : null;

    setNewMessage("");
    setReplyingTo(null);
    setPendingAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    try {
      const msgData: any = {
        text:
          messageText ||
          (currentAttachment?.type.startsWith("image/")
            ? "📷 Image"
            : `📎 ${currentAttachment?.name}`),
        senderId: userId,
        senderName: alias,
        createdAt: serverTimestamp(),
        replyTo: currentReplyTo,
      };

      if (currentAttachment?.url) {
        msgData.fileUrl = currentAttachment.url;
        msgData.fileType = currentAttachment.type;
        msgData.fileName = currentAttachment.name;
      }

      await addDoc(collection(db, "campusProblems", activeChat.id, "messages"), msgData);
      await updateDoc(doc(db, "campusProblems", activeChat.id), {
        messageCount: increment(1),
      });
    } catch (error: any) {
      console.error("Send error:", error);
      toast.error("Failed to send message");
      setNewMessage(messageText);
      if (currentReplyTo) setReplyingTo(currentReplyTo);
      if (currentAttachment) setPendingAttachment(currentAttachment);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!activeChat) return;
    if (!confirm("Are you sure you want to delete this message?")) return;
    
    try {
      await deleteDoc(doc(db, "campusProblems", activeChat.id, "messages", messageId));
      
      // Optionally decrement parent counter, but not strictly needed 
      // if we just want it removed from the UI.
    } catch (e) {
      toast.error("Failed to delete message");
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChat || !userId) return;

    // Reset input immediately so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (file.size > 25 * 1024 * 1024) {
      toast.error("File too large! Max 25MB.", { id: "upload-campus" });
      return;
    }

    setReplyingTo(null);
    setPendingAttachment({ file, progress: 0, url: null, type: file.type, name: file.name });
    setIsUploading(true);
    toast.dismiss();

    try {
      let fileToUpload: Blob | File = file;

      if (file.type.startsWith("image/")) {
        toast.loading("Compressing image...", { id: "upload-campus" });
        const dataUrl = await compressImage(file);
        const res = await fetch(dataUrl);
        fileToUpload = await res.blob();
      }

      toast.loading("Uploading...", { id: "upload-campus" });

      const storageRef = ref(storage, `chat_uploads/${Date.now()}_${file.name}`);
      
      // Simulate progress for UX since uploadBytes doesn't support native progress events
      // and uploadBytesResumable gets blocked by strict campus firewalls (PUT requests)
      let simulatedProgress = 0;
      const progressInterval = setInterval(() => {
        simulatedProgress += (90 - simulatedProgress) * 0.1; // Smoothly approach 90%
        setPendingAttachment((prev) => (prev ? { ...prev, progress: simulatedProgress } : null));
      }, 500);

      // Simple POST upload that bypasses strict firewalls
      await uploadBytes(storageRef, fileToUpload);
      
      clearInterval(progressInterval);
      setPendingAttachment((prev) => (prev ? { ...prev, progress: 100 } : null));
      
      const downloadURL = await getDownloadURL(storageRef);
      setPendingAttachment((prev) =>
        prev ? { ...prev, url: downloadURL } : null
      );
      
      setIsUploading(false);
      toast.dismiss("upload-campus");

    } catch (err) {
      console.error("Processing error:", err); // 👈 ADD THIS too
      toast.error("Processing failed", { id: "upload-campus" });
      setPendingAttachment(null);
      setIsUploading(false);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "Just now";
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredProblems = selectedCategory === "All Problems"
    ? problems.filter(p => p.status !== "solved")
    : selectedCategory === "Hall of Fame"
      ? problems.filter(p => p.status === "solved")
      : problems.filter(p => p.category === selectedCategory && p.status !== "solved");

  const rawActiveGroups = problems.filter(p => p.workingBy && p.workingBy.includes(userId) && p.status !== "solved");

  // Deduplicate active groups by lowercased and trimmed title so legacy duplicates don't spam the right sidebar
  const activeGroups = Array.from(new Map(rawActiveGroups.map(item => [(item.title || "").trim().toLowerCase(), item])).values());
  // Display other users from the same campus, fallback to empty array if none
  const onlineStudentsList = campusUsers.filter(u => u.id !== userId).slice(0, 10);

  // Function to nicely determine avatars from workingBy array using campusUsers
  const getAvatarInitials = (ids: string[]) => {
    return ids.slice(0, 5).map(id => {
      const user = campusUsers.find(u => u.id === id);
      return user ? user.alias.charAt(0).toUpperCase() : "U";
    });
  };

  return (
    <div className="h-screen overflow-hidden bg-[#060606] text-gray-200 font-sans flex flex-col relative w-full">
      {/* Top Header */}
      <header className="h-[72px] bg-[#0a0a0a] border-b border-zinc-900 flex items-center justify-between px-6 sticky top-0 z-10 shrink-0">
        <div className="flex flex-col">
          <h1 className="text-[22px] font-bold text-white tracking-tight leading-tight">Campus Life Mode</h1>
          <span className="text-xs text-gray-400">Collaborate & solve problems together</span>
        </div>

        <div className="flex-1 max-w-xl mx-8 hidden md:block relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search problems, projects, or students..."
            className="w-full bg-[#111] text-sm text-gray-200 rounded-full pl-10 pr-4 py-2.5 border border-zinc-800 focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-zinc-600"
          />
        </div>

        <div className="flex items-center gap-6">
          <button className="relative text-gray-400 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-pink-500 rounded-full border border-[#0a0a0a]"></span>
          </button>
          <button onClick={() => setIsSettingsOpen(true)} className="text-gray-400 hover:text-white transition-colors">
            <Settings className="w-5 h-5" />
          </button>

          <div onClick={() => setIsProfileOpen(true)} className="flex items-center gap-3 border-l border-zinc-800 pl-6 cursor-pointer hover:opacity-80 transition">
            <div className="w-9 h-9 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold text-sm">
              {alias ? alias.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="flex flex-col hidden sm:flex">
              <span className="text-sm font-semibold text-white leading-tight">Hi, {alias || "Guest"}</span>
              <span className="text-[10px] text-gray-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-72px)] relative">

        {/* Left Sidebar */}
        <aside className="w-[260px] bg-[#0a0a0a] border-r border-zinc-900 flex flex-col overflow-y-auto shrink-0 z-0">
          <div className="p-5">
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full bg-[#f01c7d] hover:bg-[#d81970] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-pink-900/10 text-sm"
            >
              <Plus className="w-4 h-4" />
              Post a Problem
            </button>
          </div>

          <div className="px-3 pb-6 flex-1">
            <h3 className="text-[10px] font-bold text-gray-500 tracking-wider mb-3 px-3">CATEGORIES</h3>
            <div className="flex flex-col gap-1">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.name;
                const count = cat.name === "All Problems"
                  ? problems.filter(p => p.status !== "solved").length
                  : cat.name === "Hall of Fame"
                    ? problems.filter(p => p.status === "solved").length
                    : problems.filter(p => p.category === cat.name && p.status !== "solved").length;

                return (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${isActive
                      ? "border border-cyan-500/30 bg-cyan-500/5 text-white"
                      : "border border-transparent text-gray-300 hover:bg-zinc-900"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{cat.icon}</span>
                      <span className={`text-sm font-medium ${isActive ? 'text-white' : 'group-hover:text-white'}`}>
                        {cat.name}
                      </span>
                    </div>
                    {(count > 0 || cat.name === "All Problems") && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-zinc-800 text-gray-400'
                        }`}>
                        {count || cat.count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </aside>

        {/* Central Feed */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 relative bg-[#060606] z-0">
          <div className="max-w-[700px] mx-auto space-y-6 pb-20">

            {/* AI Dashboard Catch-up */}
            {activeGroups.length > 0 && selectedCategory === "All Problems" && (
              <div className="bg-[#111111] border border-[#00d0e6]/20 rounded-2xl overflow-hidden relative shadow-lg shadow-[#00d0e6]/5">
                {/* Header Action */}
                <div className="p-4 flex items-center justify-between border-b border-zinc-900 bg-gradient-to-r from-[#111] to-[#1a1a24]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#00d0e6]/10 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-[#00d0e6]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Daily Catch-up</h3>
                      <p className="text-[11px] text-gray-400">AI Summary of all your active groups</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleDashboardSummary}
                    disabled={isDashboardSummarizing}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition border border-zinc-700"
                  >
                    {isDashboardSummarizing ? "Summarizing..." : "Generate TL;DR"}
                  </button>
                </div>

                {/* Content */}
                {dashboardSummary && (
                  <div className="p-5 font-medium relative">
                    <button 
                      onClick={() => setDashboardSummary(null)}
                      className="absolute top-4 right-4 p-1 rounded-md text-gray-500 hover:text-white bg-zinc-900 hover:bg-zinc-800 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    
                    <div className="prose prose-invert prose-sm max-w-none text-gray-300
                      prose-headings:text-white prose-headings:font-bold prose-headings:mb-2 prose-headings:mt-4 prose-headings:text-sm prose-headings:border-b prose-headings:border-zinc-800 prose-headings:pb-1
                      prose-p:leading-relaxed prose-p:mb-4 prose-p:text-[13px]
                      prose-ul:my-2 prose-li:my-0.5 custom-ai-scrollbar"
                      dangerouslySetInnerHTML={{ __html: dashboardSummary.replace(/\n/g, '<br />').replace(/### (.*?)(<br \/>|$)/g, '<h3>$1</h3>') }}
                    />
                  </div>
                )}
              </div>
            )}

            {filteredProblems.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
                {selectedCategory === "Hall of Fame" ? (
                  <>
                    <p className="text-gray-400 mb-4 text-sm max-w-sm mx-auto">The Hall of Fame is empty. Problems automatically appear here when a group marks them as Solved by building a project!</p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-400 mb-4">No problems found in "{selectedCategory}".</p>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="text-[#f01c7d] font-medium hover:text-pink-400 transition"
                    >
                      Be the first to post a problem 🤍
                    </button>
                  </>
                )}
              </div>
            ) : (
              filteredProblems.map((p: any, index: number) => {
                // All cards get the cyan top border
                const topBorderColor = 'border-t-[#00d0e6]';
                const workingBy = p.workingBy || [];
                const isWorking = workingBy.includes(userId);

                const initialsArray = getAvatarInitials(workingBy);

                return (
                  <div
                    key={p.id}
                    className={`bg-[#111111] border-t-[3px] ${topBorderColor} border border-x-zinc-800 border-b-zinc-800 rounded-xl p-5 hover:border-[#00d0e6] shadow-sm hover:shadow-[#00d0e6]/10 transition-all`}
                  >
                    {/* Tags */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-bold text-pink-400 bg-pink-500/10 px-2 py-1 rounded w-fit uppercase tracking-wide">
                        In Progress
                      </span>
                      {['urgent', p.category.toLowerCase().replace(/ /g, ""), 'campus'].slice(0, 3).map(tag => (
                        <span key={tag} className="text-[11px] font-medium text-[#00d0e6] bg-[#00d0e6]/10 px-2 py-1 rounded w-fit">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-bold text-white mb-2 leading-snug">
                      {p.title}
                    </h3>

                    <p className="text-[#a1a1aa] text-sm mb-5 leading-relaxed">
                      {p.description}
                    </p>

                    {p.status === "solved" && p.solution && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-5">
                        <div className="text-[11px] font-bold text-green-400 mb-1.5 uppercase tracking-wider">Solution / Fix:</div>
                        <div className="text-[13px] text-green-50 leading-relaxed font-medium whitespace-pre-wrap">
                          {p.solution.split(/(https?:\/\/[^\s]+)/g).map((part: string, i: number) => 
                            part.match(/https?:\/\//) ? (
                              <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-[#00d0e6] hover:underline underline-offset-4 break-words">
                                {part}
                              </a>
                            ) : (
                              part
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Stats Icons */}
                    <div className="flex flex-wrap items-center gap-5 text-xs text-[#a1a1aa] mb-5 font-medium">
                      <div className="flex items-center gap-1.5">
                        <ThumbsUp className="w-3.5 h-3.5" /> <span className="text-white">{p.votes}</span> upvotes
                      </div>
                      <div className="flex items-center gap-1.5 text-pink-400">
                        <Users className="w-3.5 h-3.5" /> <span>{workingBy.length}</span> working
                      </div>
                    </div>

                    {/* Collaborative Bar */}
                    {workingBy.length > 0 && (
                      <div className="bg-[#1a1a1a] border border-zinc-800/80 rounded-lg p-2.5 flex items-center gap-3 mb-5 cursor-pointer hover:border-zinc-700 transition" onClick={() => setActiveChat(p)}>
                        <div className="flex -space-x-1.5 pl-1">
                          {initialsArray.map((initial, i) => (
                            <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-[#1a1a1a] shadow-sm transform hover:scale-110 transition shrink-0 ${['bg-[#f01c7d]', 'bg-[#b81895]', 'bg-[#00d0e6]', 'bg-[#ff6b00]', 'bg-[#10b981]'][i % 5]}`}>
                              {initial}
                            </div>
                          ))}
                          {workingBy.length > 5 && (
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-zinc-700 border-2 border-[#1a1a1a] shrink-0">
                              +{workingBy.length - 5}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-[#a1a1aa] flex-1">
                          Students are collaborating on this. <span className="text-[#00d0e6] font-medium ml-1">Click to View Chat</span>
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t border-zinc-800/80 pt-4">
                      <div className="text-xs text-[#a1a1aa]">
                        Posted by <span className="text-[#00d0e6]">{p.alias || "Anonymous"}</span> • {p.createdAt?.toDate ? 'Recently' : '6h ago'}
                      </div>

                      <div className="flex items-center gap-3">
                        {p.status !== "solved" ? (
                          <>
                            {p.alias === alias && (
                              <button
                                onClick={() => handleOpenSolutionModal(p.id, p.alias)}
                                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-green-500/20 text-green-500 hover:bg-green-500/10 transition text-xs font-bold"
                              >
                                ✅ Mark Solved
                              </button>
                            )}
                            <button
                              onClick={() => handleUpvote(p.id, p.votes, p.upvotedBy || [])}
                              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-pink-500/20 text-[#f01c7d] hover:bg-pink-500/10 transition text-xs font-bold bg-white"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" /> Upvote
                            </button>

                            <button
                              onClick={() => handleStartWorking(p)}
                              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full transition text-xs font-bold relative ${isWorking ? 'bg-[#1a1a1a] text-[#00d0e6] border border-[#00d0e6]/30' : 'bg-[#00d0e6] hover:bg-cyan-400 text-black'}`}
                            >
                              {isWorking ? (
                                <>
                                  <MessageCircle className="w-3.5 h-3.5" /> Open Chat
                                  {(() => {
                                    const unreadCount = (p.messageCount || 0) - (readCounts[p.id] || 0);
                                    if (unreadCount > 0 && activeChat?.id !== p.id) {
                                      return (
                                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] w-5 h-5 font-bold rounded-full flex items-center justify-center shadow-lg shadow-red-500/20">
                                          {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                      );
                                    }
                                    return null;
                                  })()}
                                </>
                              ) : (
                                <>
                                  <Users className="w-3.5 h-3.5" /> Join Group <ArrowRight className="w-3.5 h-3.5" />
                                </>
                              )}
                            </button>
                          </>
                        ) : (
                          <span className="text-xs font-bold text-green-500 flex items-center gap-1.5 bg-green-500/10 px-3 py-1.5 rounded-full">
                            🏆 Solved by {p.alias}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </main>

        {/* Right Sidebar (Chats & Online) */}
        <aside className="w-[300px] bg-[#0a0a0a] border-l border-zinc-900 p-5 overflow-y-auto hidden lg:block shrink-0 z-0 relative">

          {/* Calendar Button */}
          <div className="mb-6">
            <button
              onClick={() => setIsCalendarOpen(true)}
              className="w-full bg-[#111111] hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all flex-col"
            >
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-purple-500" />
                Upcoming Meetups
              </div>
              <span className="text-[10px] text-gray-500 font-normal">{meetups.length} scheduled</span>
            </button>
          </div>

          {/* Active Group Chats - Real Data */}
          <div className="mb-8">
            <div className="flex flex-col mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 tracking-wide">
                <MessageCircle className="w-4 h-4 text-[#00d0e6]" /> Active Group Chats
              </h3>
              <span className="text-[10px] text-gray-500 mt-1 pl-6">Click to join conversations</span>
            </div>

            <div className="space-y-3">
              {activeGroups.length === 0 ? (
                <div className="text-xs text-gray-500 italic pl-2">You haven't joined any groups yet.</div>
              ) : (
                activeGroups.map(chat => (
                  <div key={chat.id} onClick={() => setActiveChat(chat)} className={`bg-[#111111] border ${activeChat?.id === chat.id ? 'border-[#00d0e6] shadow-[0_0_15px_rgba(0,208,230,0.1)]' : 'border-zinc-800/60 hover:border-zinc-700'} rounded-xl p-3 transition cursor-pointer`}>
                    <div className="flex justify-between items-start mb-1.5">
                      <h4 className="text-[13px] font-bold text-gray-200 leading-tight pr-4">{chat.title}</h4>
                    </div>
                    <p className="text-[11px] text-gray-400 mb-2 truncate">{chat.description}</p>
                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3 text-gray-400" /> {chat.workingBy?.length || 0} active</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Online Students - Real Data */}
          <div>
            <div className="flex flex-col mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 tracking-wide">
                <Zap className="w-4 h-4 text-[#f01c7d]" /> Online Students
              </h3>
              <span className="text-[10px] text-gray-500 mt-1 pl-6">From {campus || "your campus"}</span>
            </div>

            <div className="space-y-3">
              {onlineStudentsList.length === 0 ? (
                <div className="text-xs text-gray-500 italic pl-2">No other students found yet.</div>
              ) : (
                onlineStudentsList.map(student => (
                  <div key={student.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#111] transition-colors cursor-pointer border border-transparent hover:border-zinc-800/60">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-[11px] font-bold text-gray-300 border border-zinc-600 shadow-sm shrink-0">
                        {student.alias ? student.alias.substring(0, 2).toUpperCase() : "ST"}
                      </div>
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#0a0a0a] rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-gray-200 truncate leading-tight">{student.alias}</p>
                      <p className="text-[10px] text-gray-500 truncate mt-0.5">Active</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Live Chat Panel (Overlay / Slide in / Expandable) */}
        {activeChat && (
          <div className={`absolute top-0 right-0 h-full pb-safe ${isChatExpanded ? 'w-full lg:w-[calc(100%-260px)]' : 'w-full sm:w-[400px] lg:w-[450px]'} bg-[#0a0a0a] border-l border-zinc-900 shadow-2xl flex flex-col z-20 transition-all duration-300 transform`}>
            {/* Chat Header */}
            <div className="h-[72px] border-b border-zinc-900 flex items-center px-4 shrink-0 bg-[#0a0a0a]">
              <div className="w-10 h-10 rounded-full bg-[#111] flex items-center justify-center text-gray-400 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <h3 className="font-bold text-white text-sm truncate">{activeChat.title}</h3>
                <p className="text-[10px] text-green-500 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  {activeChat.workingBy?.length || 1} members active
                </p>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-3 text-gray-400 shrink-0">
                <Phone onClick={() => setIsCalling('audio')} className="w-4 h-4 hover:text-white cursor-pointer transition hidden sm:block" />
                <Video onClick={() => setIsCalling('video')} className="w-4 h-4 hover:text-white cursor-pointer transition hidden sm:block" />

                <button
                  onClick={handleSummarizeChat}
                  disabled={isSummarizing || chatMessages.length === 0}
                  className="p-1.5 hover:bg-amber-500/10 hover:text-amber-400 rounded-md transition disabled:opacity-50"
                  title="✨ AI Summarize Chat"
                >
                  <Sparkles className={`w-4 h-4 ${isSummarizing ? 'animate-pulse text-amber-500' : ''}`} />
                </button>

                <button
                  onClick={() => setIsMeetupModalOpen(true)}
                  className="p-1.5 hover:bg-purple-500/10 hover:text-purple-400 rounded-md transition"
                  title="Schedule Physical Meetup"
                >
                  <CalendarPlus className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsChatExpanded(!isChatExpanded)}
                  className="p-1.5 hover:bg-zinc-800 hover:text-white rounded-md transition"
                  title={isChatExpanded ? "Collapse Chat" : "Expand Chat"}
                >
                  {isChatExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                <button
                  onClick={handleLeaveGroup}
                  className="p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded-md transition"
                  title="Leave Group"
                >
                  <LogOut className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setActiveChat(null);
                    setIsChatExpanded(false);
                    setIsCalling(false);
                  }}
                  className="p-1.5 hover:bg-zinc-800 hover:text-white rounded-md transition ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Pinned Notice */}
            <div className="bg-[#00d0e6]/10 border-b border-[#00d0e6]/20 px-4 py-2.5 flex items-start gap-2 shrink-0">
              <span className="text-[#00d0e6] text-xs pt-0.5">📌</span>
              <p className="text-xs text-[#00d0e6] font-medium leading-relaxed">
                Stay respectful in the chat. Focus on finding solutions for "{activeChat.title}".
              </p>
            </div>

            {/* Messages or Call Area */}
            <div 
              className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 bg-[#060606] min-h-0 relative scroll-smooth"
              onScroll={(e) => {
                const target = e.target as HTMLDivElement;
                if (target.scrollHeight - target.scrollTop - target.clientHeight > 150) {
                  setShowScrollBottom(true);
                } else {
                  setShowScrollBottom(false);
                }
              }}
            >
              {isCalling ? (
                <div className="absolute inset-0 z-10 bg-[#060606]/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 pb-20">
                  <div className="w-full max-w-sm bg-[#111] border border-zinc-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center relative">
                    <button 
                      onClick={() => setIsCalling(false)}
                      className="absolute top-3 right-3 p-1.5 text-gray-500 hover:text-white bg-zinc-900 rounded-full transition"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mb-4 inner-glow">
                      <Video className="w-8 h-8" />
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2">Google Meet Call</h3>
                    
                    {currentChatData?.meetLink ? (
                      <>
                        <p className="text-sm text-green-400 font-medium mb-6 animate-pulse">● An active Google Meet is running!</p>
                        <button 
                          onClick={() => window.open(currentChatData.meetLink, '_blank')}
                          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition shadow-lg shadow-blue-900/20 mb-3 flex items-center justify-center gap-2"
                        >
                          <Video className="w-4 h-4" /> Join Meeting
                        </button>
                        <button 
                          onClick={handleEndMeet}
                          className="text-xs text-red-500 hover:text-red-400 py-2 transition"
                        >
                          End Call (Clear Link for Everyone)
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-gray-400 mb-6 px-2">Generate a Google Meet link and paste it below to invite your group.</p>
                        <button 
                          onClick={() => window.open('https://meet.google.com/new', '_blank')}
                          className="w-full py-2.5 bg-[#f01c7d] hover:bg-[#d81970] text-white rounded-xl font-bold transition shadow-lg shadow-pink-900/20 mb-4 flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" /> Generate Link
                        </button>
                        
                        <div className="w-full flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Paste meet link here..." 
                            value={meetLinkInput}
                            onChange={(e) => setMeetLinkInput(e.target.value)}
                            className="flex-1 min-w-0 bg-[#060606] border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none placeholder:text-gray-600 focus:outline-none"
                          />
                          <button 
                            onClick={handleSaveMeetLink}
                            disabled={!meetLinkInput.trim() || !meetLinkInput.includes('meet.google.com')}
                            className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold transition shrink-0"
                          >
                            Share
                          </button>
                        </div>
                        {!meetLinkInput.includes('meet.google.com') && meetLinkInput.trim().length > 0 && (
                           <p className="text-[10px] text-red-400 mt-2 text-left w-full">Must be a valid meet.google.com link</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ) : (
                chatMessages.length === 0 ? (
                  <div className="text-center text-gray-500 text-xs italic mt-10">
                    No messages yet. Be the first to say hi!
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isMine = msg.senderId === userId;
                    const isImage = msg.fileUrl && msg.fileType?.startsWith('image/');

                    return (
                      <div key={msg.id} className={`flex flex-col mb-4 group relative ${isMine ? 'items-end ml-auto' : 'items-start mr-auto'} max-w-[85%] min-w-0`}>
                        {!isMine && (
                          <div className="flex items-center gap-2 mb-1.5 ml-1">
                            <div className="w-6 h-6 rounded-full bg-pink-600 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                              {msg.senderName.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-[11px] font-semibold text-[#00d0e6]">{msg.senderName}</span>
                          </div>
                        )}

                        <div className="relative group/msg inline-flex max-w-full">
                          {/* Floating Actions Pill */}
                          <div className={`absolute -top-3.5 opacity-0 group-hover/msg:opacity-100 flex items-center gap-1 bg-[#1a1a1a] border border-zinc-700 rounded-full py-1 px-1.5 shadow-2xl transition-all duration-200 z-10 scale-95 group-hover/msg:scale-100 ${isMine ? 'right-0 mr-2' : 'left-0 ml-2'}`}>
                            <button 
                              onClick={() => {
                                setReplyingTo({ id: msg.id, text: msg.text || "📎 Attachment", sender: msg.senderName });
                                setTimeout(() => textInputRef.current?.focus(), 50);
                              }} 
                              className="p-1 hover:bg-zinc-800 text-gray-400 hover:text-white rounded-full transition-all"
                              title="Reply"
                            >
                              <Reply className="w-3.5 h-3.5" />
                            </button>
                            {isMine && (
                              <button 
                                onClick={() => handleDeleteMessage(msg.id)} 
                                className="p-1 hover:bg-zinc-800 text-gray-400 hover:text-red-500 rounded-full transition-all"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div className={`rounded-2xl shadow-sm ${isMine
                            ? 'bg-[#00d0e6] text-black rounded-tr-sm font-medium'
                            : 'bg-[#1a1a1a] text-gray-200 rounded-tl-sm border border-zinc-800'
                            } ${isImage ? 'p-1' : 'p-3 text-[13px] leading-relaxed'} overflow-hidden break-words max-w-full relative`}>
                            
                            {/* Reply Reference Bubble */}
                            {msg.replyTo && (
                              <div className={`mb-2 p-2 rounded-lg text-[11px] ${isMine ? 'bg-black/10 text-black/80' : 'bg-black/30 text-gray-400'} border-l-2 ${isMine ? 'border-black/30' : 'border-[#00d0e6]'}`}>
                                <div className={`font-bold mb-0.5 ${isMine ? 'text-black' : 'text-[#00d0e6]'}`}>{msg.replyTo.sender}</div>
                                <div className="truncate max-w-[200px] opacity-90">{msg.replyTo.text}</div>
                              </div>
                            )}
                            {msg.fileUrl ? (
                              isImage ? (
                                <img 
                                  src={msg.fileUrl} 
                                  alt="upload" 
                                  onClick={() => setSelectedImage(msg.fileUrl)}
                                  className="max-w-full sm:max-w-[300px] w-auto h-auto rounded-xl cursor-pointer hover:opacity-90 transition object-contain" 
                                />
                              ) : (
                                <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="underline font-bold flex items-center gap-2 max-w-full">
                                  <Paperclip className="w-4 h-4 shrink-0" />
                                  <span className="truncate max-w-full" title={msg.fileName}>{msg.fileName || "Download File"}</span>
                                </a>
                              )
                            ) : (
                              msg.text
                            )}
                          </div>
                        </div>
                        <span className="text-[9px] text-gray-500 mt-1 px-1">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    );
                  })
                )
              )}
              {!isCalling && <div ref={messagesEndRef} />}
            </div>

            {/* Input Area */}
            <div className="bg-[#0a0a0a] border-t border-zinc-900 shrink-0 mt-auto flex flex-col relative">
              {showScrollBottom && !isCalling && (
                <button 
                  onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  className="absolute -top-14 right-4 bg-[#1a1a1a]/95 backdrop-blur-md border border-zinc-700 text-[#00d0e6] shadow-xl shadow-black p-2 rounded-full hover:bg-zinc-800 transition z-50 animate-in slide-in-from-bottom-2 fade-in"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              )}
              {pendingAttachment && (
                <div className="px-4 py-3 bg-[#111] border-b border-zinc-900 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center shrink-0 overflow-hidden relative">
                      {pendingAttachment.type.startsWith('image/') ? (
                         pendingAttachment.url ? (
                           <img src={pendingAttachment.url} alt="preview" className="w-full h-full object-cover" />
                         ) : (
                           <Sparkles className="w-4 h-4 text-[#00d0e6] animate-pulse" />
                         )
                      ) : (
                        <Paperclip className="w-4 h-4 text-[#00d0e6]" />
                      )}
                      {!pendingAttachment.url && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-[9px] font-bold text-white">{Math.round(pendingAttachment.progress)}%</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-200 font-medium truncate max-w-[200px]">
                        {pendingAttachment.name}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-32 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#00d0e6] transition-all duration-300"
                            style={{width: `${pendingAttachment.progress}%`}}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setPendingAttachment(null); setIsUploading(false); }}
                    className="p-1.5 text-gray-500 hover:text-white bg-zinc-800 rounded-full hover:bg-zinc-700 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {replyingTo && (
                <div className="px-4 py-2.5 bg-[#161616] border-b border-zinc-900 flex items-center justify-between">
                  <div className="text-xs overflow-hidden">
                    <span className="text-[#00d0e6] font-bold block mb-0.5">Replying to {replyingTo.sender}</span>
                    <div className="text-gray-400 truncate max-w-[200px] sm:max-w-xs">{replyingTo.text}</div>
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="p-1.5 text-gray-500 hover:text-white bg-zinc-800 rounded-full hover:bg-zinc-700 transition">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              
              <div className="p-4">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 relative">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
                <button 
                  type="button" 
                  disabled={!!isCalling || isUploading} 
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-2 text-gray-500 hover:text-white transition rounded-full hover:bg-zinc-800 shrink-0 disabled:opacity-50 disabled:hover:bg-transparent ${isUploading ? 'animate-pulse text-cyan-400' : ''}`}
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  ref={textInputRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={isCalling ? "Text chat paused during call..." : "Type a message..."}
                  disabled={!!isCalling}
                  className="flex-1 bg-[#1a1a1a] text-sm text-white rounded-full px-4 py-2.5 outline-none border border-zinc-800 focus:border-[#00d0e6] transition-colors disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!!isCalling || (!newMessage.trim() && !pendingAttachment?.url)}
                  className="p-2.5 bg-[#f01c7d] hover:bg-[#d81970] disabled:opacity-50 disabled:hover:bg-[#f01c7d] text-white rounded-full transition shrink-0 shadow-lg shadow-pink-900/20"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Post Problem Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 tracking-tight">
                Post a Problem <span className="text-xl">😤</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-white transition-colors bg-zinc-800/50 hover:bg-zinc-700/50 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Problem Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Cab prices from campus are too high"
                  className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-zinc-800 focus:border-cyan-500 outline-none text-white placeholder:text-zinc-600 transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain your problem in detail... What's happening?"
                  className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-zinc-800 focus:border-cyan-500 outline-none h-32 text-white placeholder:text-zinc-600 resize-none transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Category 📌</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.filter(c => c.name !== 'All Problems' && c.name !== 'Hall of Fame').map(cat => (
                    <button
                      key={cat.name}
                      onClick={() => setNewPostCategory(cat.name)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${newPostCategory === cat.name ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-[#0a0a0a] border-zinc-800 text-gray-400 hover:border-zinc-700'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSubmit}
                  disabled={isAnalyzing}
                  className="w-full bg-[#f01c7d] hover:bg-[#d81970] disabled:opacity-75 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(219,39,119,0.3)] transition-all flex justify-center items-center gap-2 text-sm"
                >
                  {isAnalyzing ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-pulse text-yellow-300" />
                      AI Checking Duplicates...
                    </>
                  ) : (
                    "Submit Problem"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Meetup Modal */}
      {isMeetupModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 tracking-tight">
                Schedule Meetup 📅
              </h2>
              <button
                onClick={() => setIsMeetupModalOpen(false)}
                className="text-gray-500 hover:text-white transition-colors bg-zinc-800/50 hover:bg-zinc-700/50 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Date</label>
                <input
                  type="date"
                  value={meetupDate}
                  onChange={(e) => setMeetupDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-zinc-800 focus:border-cyan-500 outline-none text-white transition-colors text-sm [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Time</label>
                <input
                  type="time"
                  value={meetupTime}
                  onChange={(e) => setMeetupTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-zinc-800 focus:border-cyan-500 outline-none text-white transition-colors text-sm [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Location</label>
                <input
                  type="text"
                  value={meetupLocation}
                  onChange={(e) => setMeetupLocation(e.target.value)}
                  placeholder="e.g. Food Court"
                  className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-zinc-800 focus:border-cyan-500 outline-none text-white placeholder:text-zinc-600 transition-colors text-sm"
                />
              </div>
              <button
                onClick={handleScheduleMeetup}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex justify-center items-center gap-2 text-sm mt-2"
              >
                Confirm Meetup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Calendar Full Modal */}
      {isCalendarOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 min-h-[500px] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800 shrink-0">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 tracking-tight">
                Upcoming Meetups 📅
              </h2>
              <button
                onClick={() => setIsCalendarOpen(false)}
                className="text-gray-500 hover:text-white transition-colors bg-zinc-800/50 hover:bg-zinc-700/50 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {meetups.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-gray-400">No meetups scheduled yet.</p>
                </div>
              ) : (
                meetups.map((m: any) => (
                  <div key={m.id} className="bg-[#0a0a0a] border-l-[3px] border-l-cyan-500 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-white mb-1.5">{m.problemTitle}</h4>
                      <p className="text-xs text-gray-400 flex items-center gap-2">
                        <span className="bg-zinc-800 px-2 py-1 rounded text-gray-300">📍 {m.location}</span>
                        <span className="text-cyan-400">Organized by {m.creatorAlias}</span>
                      </p>
                    </div>
                    <div className="bg-[#111] border border-zinc-800 rounded-lg px-4 py-2 text-center shrink-0">
                      <div className="text-sm font-bold text-white">{new Date(m.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                      <div className="text-xs text-cyan-400">{m.time}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Summary Modal */}
      {chatSummary && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-zinc-800 rounded-2xl shadow-[0_0_40px_rgba(245,158,11,0.15)] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-[#1a1a1a]">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 tracking-tight">
                <Sparkles className="w-5 h-5 text-amber-500" />
                AI Chat Summary
              </h2>
              <button
                onClick={() => setChatSummary(null)}
                className="text-gray-500 hover:text-white transition-colors bg-zinc-800/50 hover:bg-zinc-700/50 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="prose prose-invert prose-sm max-w-none text-gray-300 leading-relaxed whitespace-pre-wrap">
                {chatSummary}
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-800/50 flex justify-end">
                <button
                  onClick={() => setChatSummary(null)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-2 px-5 rounded-lg transition-colors text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold text-3xl mb-4 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                {alias ? alias.charAt(0).toUpperCase() : "U"}
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">{alias}</h2>
              <p className="text-sm text-gray-500 mb-6">{campus}</p>
              
              <div className="w-full space-y-3">
                <button 
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full bg-[#1a1a1a] hover:bg-zinc-800 text-white font-medium py-3 rounded-xl transition"
                >
                  Close
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-500 font-bold py-3 rounded-xl transition flex justify-center items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-[#1a1a1a]">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-400" /> Settings
              </h2>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-gray-500 hover:text-white transition-colors bg-zinc-800/50 hover:bg-zinc-700/50 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Push Notifications</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Alerts for new messages and meetups</p>
                </div>
                <div onClick={() => setPushEnabled(!pushEnabled)} className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors duration-300 ${pushEnabled ? 'bg-cyan-600' : 'bg-zinc-700'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform duration-300 shadow-sm ${pushEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Message Sounds</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Play a sound when receiving a text</p>
                </div>
                <div onClick={() => setSoundEnabled(!soundEnabled)} className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors duration-300 ${soundEnabled ? 'bg-cyan-600' : 'bg-zinc-700'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform duration-300 shadow-sm ${soundEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Anonymous Browsing</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Hide your online status from others</p>
                </div>
                <div onClick={() => setAnonEnabled(!anonEnabled)} className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors duration-300 ${anonEnabled ? 'bg-cyan-600' : 'bg-zinc-700'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform duration-300 shadow-sm ${anonEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen Image Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md cursor-zoom-out animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 p-3 bg-zinc-900/80 hover:bg-zinc-800 text-white rounded-full transition z-50 shadow-2xl"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImage(null);
            }}
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={selectedImage} 
            alt="Full screen view" 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none" 
          />
        </div>
      )}

      {/* Solution Modal */}
      {isSolutionModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 tracking-tight">
                Share Solution 🏆
              </h2>
              <button
                onClick={() => { setIsSolutionModalOpen(false); setSolutionText(""); }}
                className="text-gray-500 hover:text-white transition-colors bg-zinc-800/50 hover:bg-zinc-700/50 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">How did you solve this?</label>
                <textarea
                  value={solutionText}
                  onChange={(e) => setSolutionText(e.target.value)}
                  placeholder="Explain the solution clearly so others can learn from it..."
                  className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-zinc-800 focus:border-green-500 outline-none h-32 text-white placeholder:text-zinc-600 resize-none transition-colors text-sm"
                />
              </div>
              <div className="pt-2">
                <button
                  onClick={handleMarkAsSolved}
                  className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all flex justify-center items-center gap-2 text-sm"
                >
                  Submit Solution & Mark Solved
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}