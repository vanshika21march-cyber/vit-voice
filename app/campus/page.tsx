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
import Link from "next/link";
import { Search, Bell, Settings, Plus, X, MessageCircle, Zap, ThumbsUp, Users, AlertCircle, ArrowRight, Phone, Video, MoreVertical, Send, Paperclip, Maximize2, Minimize2, LogOut, CalendarIcon, CalendarPlus, Sparkles, Reply, Trash2, ChevronDown, Menu, Building2, Utensils, Car, Brain, Book, Laptop, Palette, Trophy, Flame, Medal, Briefcase, FileText, TrendingUp, HeartPulse, Pin, ChevronRight, MapPin, CheckCircle2 } from "lucide-react";

const CATEGORIES = [
  { name: "All Problems", icon: Flame, count: 0, glow: "hover:text-orange-500" },
  { name: "Hall of Fame", icon: Trophy, count: 0, glow: "hover:text-yellow-500" },
  { name: "Hostel", icon: Building2, count: 0, glow: "hover:text-cyan-500" },
  { name: "Food", icon: Utensils, count: 0, glow: "hover:text-pink-500" },
  { name: "Transport", icon: Car, count: 0, glow: "hover:text-blue-500" },
  { name: "Mental Health", icon: Brain, count: 15, glow: "hover:text-purple-500" },
  { name: "Academics", icon: Book, count: 23, glow: "hover:text-green-500" },
  { name: "Sports", icon: Medal, count: 7, glow: "hover:text-red-500" },
  { name: "Tech Issues", icon: Laptop, count: 9, glow: "hover:text-indigo-500" },
  { name: "Events", icon: Palette, count: 11, glow: "hover:text-rose-500" },
];

function CategoryIcon({ icon: Icon, isActive, glow }: { icon: any, isActive: boolean, glow: string }) {
  return (
    <div className={`relative transition-all duration-300 ${isActive ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-gray-500 group-hover:scale-110 ' + glow}`}>
      <Icon className={`w-4 h-4 transition-all duration-500 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px] group-hover:stroke-[2px]'}`} />
      {isActive && (
        <div className="absolute inset-0 blur-sm opacity-50 bg-current rounded-full" />
      )}
    </div>
  );
}

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
  const [guidedStep, setGuidedStep] = useState(1); // 1: Title/Category, 2: Details/Audience, 3: Help Needed
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All Problems");
  const [newPostCategory, setNewPostCategory] = useState("Other");
  const [audience, setAudience] = useState("");
  const [helpNeeded, setHelpNeeded] = useState<"developer" | "designer" | "both">("developer");
  const [similarProblems, setSimilarProblems] = useState<any[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMemberListOpen, setIsMemberListOpen] = useState(false);
  const [isProblemVisible, setIsProblemVisible] = useState(false);

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
  const [meetupTitle, setMeetupTitle] = useState("");
  const [meetupDate, setMeetupDate] = useState("");
  const [meetupTime, setMeetupTime] = useState("");
  const [meetupLocation, setMeetupLocation] = useState("");
  const [maxAttendees, setMaxAttendees] = useState<number | null>(null);
  const [meetupProblemId, setMeetupProblemId] = useState("");
  const [meetups, setMeetups] = useState<any[]>([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [meetupTab, setMeetupTab] = useState<'upcoming' | 'past'>('upcoming');

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

  // Cleanup effect for uploads
  useEffect(() => {
    if (!activeChat) {
      setIsUploading(false);
      setPendingAttachment(null);
      toast.dismiss("upload-campus");
    }
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
      const newVotes = currentVotes + 1;

      await updateDoc(docRef, {
        votes: increment(1),
        upvotedBy: [...upvotedBy, userId],
      });

      if (newVotes === 10) {
        toast("🔥 This problem is trending! Be the first to solve it.", {
          duration: 5000,
          icon: "🚀",
          style: {
            background: "#111",
            color: "#fff",
            border: "1px solid #00d0e6"
          }
        });
      }

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

      // Send System Message
      await addDoc(collection(db, "campusProblems", problem.id, "messages"), {
        text: `${alias} joined to work on this problem`,
        type: "system",
        createdAt: serverTimestamp(),
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
        solverId: userId,
        solverAlias: alias,
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
    if (!userId) return;
    if (!meetupTitle.trim()) { toast.error("Please give your meetup a title!"); return; }
    if (!meetupProblemId) { toast.error("Please link this meetup to a problem!"); return; }
    if (!meetupDate) { toast.error("Please specify a Date!"); return; }
    if (!meetupTime) { toast.error("Please specify a Time!"); return; }
    if (maxAttendees !== null && maxAttendees <= 0) { toast.error("Please enter a positive number of people!"); return; }
    
    const today = new Date().toISOString().split('T')[0];
    if (meetupDate < today) { toast.error("Cannot schedule in the past!"); return; }
    if (meetupDate === today) {
      const currentTime = new Date().toTimeString().slice(0, 5);
      if (meetupTime < currentTime) { toast.error("Cannot schedule in the past time!"); return; }
    }
    
    const problem = problems.find(p => p.id === meetupProblemId);
    
    try {
      await addDoc(collection(db, "meetups"), {
        title: meetupTitle.trim(),
        problemId: meetupProblemId,
        problemTitle: problem?.title || "Unknown Problem",
        category: problem?.category || "Misc",
        campus: campus,
        creatorId: userId,
        creatorAlias: alias,
        date: meetupDate,
        time: meetupTime,
        location: meetupLocation || "TBD",
        maxAttendees: maxAttendees,
        attendees: [userId],
        createdAt: serverTimestamp(),
      });
      toast.success("Meetup Scheduled! 📅");
      setIsMeetupModalOpen(false);
      setMeetupTitle("");
      setMeetupDate("");
      setMeetupTime("");
      setMeetupLocation("");
      setMaxAttendees(null);
    } catch (err: any) {
      toast.error("Failed to schedule: " + err.message);
    }
  };

  const handleJoinMeetup = async (meetupId: string, currentAttendees: string[] = []) => {
    if (!userId) { toast.error("Please login 😅"); return; }
    try {
      const docRef = doc(db, "meetups", meetupId);
      if (currentAttendees.includes(userId)) {
        await updateDoc(docRef, { attendees: currentAttendees.filter(id => id !== userId) });
        toast.success("Left meetup");
      } else {
        const meetup = meetups.find(m => m.id === meetupId);
        if (meetup?.maxAttendees && currentAttendees.length >= meetup.maxAttendees) {
          toast.error("This meetup is full! 😅");
          return;
        }
        await updateDoc(docRef, { attendees: [...currentAttendees, userId] });
        toast.success("Joined meetup! 🚀");
      }
    } catch (e: any) {
      toast.error("Failed to update status");
    }
  };

  const handlePostOutcome = async (meetupId: string, text: string) => {
    if (!text.trim()) return;
    try {
      const docRef = doc(db, "meetups", meetupId);
      await updateDoc(docRef, { outcome: text.trim() });
      toast.success("Outcome archived! 🚀");
    } catch (e) {
      toast.error("Failed to archive outcome");
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
      toast.error("Please provide a concise title! 😅");
      return;
    }
    if (description.trim().length < 80) {
      toast.error("Please describe the problem in more detail (min 80 chars)! 📝");
      return;
    }
    if (!audience.trim()) {
      toast.error("Who does this affect? (e.g. 1st years, Hostellers)");
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
      setAudience("");
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
        audience: audience.trim(),
        helpNeeded,
        category: newPostCategory,
        campus,
        alias,
        creatorId: userId,
        votes: 1,
        status: "open",
        upvotedBy: [userId],
        createdAt: serverTimestamp(),
      });

      toast.success("New Problem Posted! Use group chat to fix it. 🚀");
      setIsModalOpen(false);
      setTitle("");
      setDescription("");
      setAudience("");
      setNewPostCategory("Other");
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
      const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setPendingAttachment((prev) => (prev ? { ...prev, progress } : null));
        }, 
        (err) => {
          console.error("Upload error:", err);
          toast.error("Upload failed", { id: "upload-campus" });
          setPendingAttachment(null);
          setIsUploading(false);
        }, 
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setPendingAttachment((prev) =>
              prev ? { ...prev, url: downloadURL, progress: 100 } : null
            );
            setIsUploading(false);
            toast.dismiss("upload-campus");
            toast.success("Ready to send!", { id: "upload-campus-success", duration: 2000 });
          } catch (error) {
            console.error("Post-upload error:", error);
            setIsUploading(false);
            setPendingAttachment(null);
            toast.error("Finalizing upload failed", { id: "upload-campus" });
          }
        }
      );
    } catch (err) {
      console.error("Processing error:", err);
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
      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Top Header */}
      <header className="h-[72px] bg-[#0a0a0a] border-b border-zinc-900 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-zinc-800 rounded-lg text-gray-400 lg:hidden transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-[22px] font-bold text-white tracking-tight leading-tight">Campus Life Mode</h1>
            <span className="text-[10px] sm:text-xs text-gray-400">Collaborate & solve problems together</span>
          </div>
        </div>

        <div className="flex-1 max-w-xl mx-4 sm:mx-8 hidden md:block relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search problems, projects, or students..."
            className="w-full bg-[#111] text-sm text-gray-200 rounded-full pl-10 pr-4 py-2.5 border border-zinc-800 focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-zinc-600"
          />
        </div>

        <div className="flex items-center gap-3 sm:gap-6">

          <button onClick={() => setIsSettingsOpen(true)} className="text-gray-400 hover:text-white transition-colors hidden sm:block">
            <Settings className="w-5 h-5" />
          </button>

          <Link href={`/profile/${userId}`} className="flex items-center gap-3 border-l-0 sm:border-l border-zinc-800 pl-3 sm:pl-6 cursor-pointer hover:opacity-80 transition">
            <div className="w-9 h-9 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold text-sm">
              {alias ? alias.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="flex flex-col hidden sm:flex">
              <span className="text-sm font-semibold text-white leading-tight">Hi, {alias || "Guest"}</span>
              <span className="text-[10px] text-gray-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online
              </span>
            </div>
          </Link>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-72px)] relative">

        {/* Left Sidebar */}
        <aside className={`${isMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} fixed lg:relative top-[72px] lg:top-0 left-0 w-[260px] h-[calc(100vh-72px)] bg-[#0a0a0a] border-r border-zinc-900 flex flex-col overflow-y-auto shrink-0 z-40 transition-transform duration-300`}>
          <div className="p-5">
            <button
              onClick={() => { setIsModalOpen(true); setIsMenuOpen(false); setGuidedStep(1); }}
              className="w-full bg-gradient-to-r from-[#f01c7d] to-[#7c3aed] hover:from-[#d81970] hover:to-[#6d28d9] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-900/20 text-sm hover:-translate-y-0.5"
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
                      ? "border border-cyan-500/30 bg-cyan-500/10 text-white shadow-[0_0_15px_rgba(0,208,230,0.1)]"
                      : "border border-transparent text-gray-300 hover:bg-zinc-900/50 hover:text-white"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <CategoryIcon icon={cat.icon} isActive={isActive} glow={cat.glow} />
                      <span className={`text-sm font-medium ${isActive ? 'text-white' : 'group-hover:text-white'}`}>
                        {cat.name}
                      </span>
                    </div>
                    {(count > 0 || cat.name === "All Problems") && (
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          cat.name === "All Problems" ? "bg-orange-500" :
                          cat.name === "Hall of Fame" ? "bg-yellow-500" :
                          cat.name === "Hostel" ? "bg-cyan-500" :
                          cat.name === "Food" ? "bg-pink-500" :
                          cat.name === "Transport" ? "bg-blue-500" :
                          cat.name === "Mental Health" ? "bg-purple-500" :
                          cat.name === "Academics" ? "bg-green-500" :
                          cat.name === "Sports" ? "bg-red-500" :
                          cat.name === "Tech Issues" ? "bg-indigo-500" :
                          cat.name === "Events" ? "bg-rose-500" :
                          "bg-zinc-500"
                        }`} />
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-zinc-800 text-gray-400'
                          }`}>
                          {count || cat.count}
                        </span>
                      </div>
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
                    {isDashboardSummarizing ? "Summarizing..." : "Summarize"}
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

            {/* Weekly Leaderboard */}
            {selectedCategory === "Hall of Fame" && (
              <div className="bg-[#111111] border border-green-500/20 rounded-2xl p-5 mb-6 shadow-xl shadow-green-500/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                    <span className="text-xl">🏆</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">Top Builders This Week</h3>
                    <p className="text-[11px] text-gray-400 font-medium">Problem solving Hall of Fame</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {(() => {
                    const solverCounts: Record<string, { count: number, name: string }> = {};
                    problems.filter(p => p.status === 'solved' && p.solverId).forEach(p => {
                      if (!solverCounts[p.solverId]) solverCounts[p.solverId] = { count: 0, name: p.solverAlias || 'Unknown' };
                      solverCounts[p.solverId].count++;
                    });
                    const topSolvers = Object.values(solverCounts).sort((a,b) => b.count - a.count).slice(0, 3);
                    if (topSolvers.length === 0) return <div className="text-xs text-gray-500 italic px-2">No projects built yet this week. Be the first!</div>;
                    return topSolvers.map((s, i) => (
                      <div 
                         key={i} 
                         onClick={() => router.push(`/profile/${Object.keys(solverCounts).find(key => solverCounts[key] === s)}`)}
                         className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`font-black text-xs ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : 'text-amber-600'}`}>#{i+1}</span>
                          <span className="text-sm font-bold text-gray-200">{s.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                            {s.count} SOLVED
                          </span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {filteredProblems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/10">
                {selectedCategory === "Hall of Fame" ? (
                  <div className="text-center">
                    <span className="text-6xl mb-6 block">🏆</span>
                    <h3 className="text-xl font-bold text-white mb-2">The Hall of Fame is Empty</h3>
                    <p className="text-gray-500 mb-4 text-sm max-w-sm mx-auto font-medium">Problems appear here once someone builds a solution and marks them as Solved. Be the first to build something great!</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <span className="text-6xl mb-6 block">🏜️</span>
                    <h3 className="text-xl font-bold text-white mb-2">It's quiet in here...</h3>
                    <p className="text-gray-500 mb-6 font-medium">No problems found in "{selectedCategory}".</p>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="px-8 py-3 bg-gradient-to-r from-[#f01c7d] to-[#7c3aed] text-white font-extrabold rounded-full shadow-lg shadow-purple-900/20 hover:shadow-cyan-500/10 transition-all hover:-translate-y-1 active:scale-95"
                    >
                      Be the first to post 🤍
                    </button>
                  </div>
                )}
              </div>
            ) : (
              filteredProblems.map((p: any, index: number) => {
                const workingBy = p.workingBy || [];
                const isWorking = workingBy.includes(userId);
                const initialsArray = getAvatarInitials(workingBy);

                return (
                  <div
                    key={p.id}
                    className="bg-[#111111] border border-zinc-800 rounded-xl p-6 hover:-translate-y-1 hover:border-zinc-700 hover:shadow-[0_4px_20px_rgba(0,0,0,0.5)] shadow-sm transition-all duration-300 relative group"
                  >
                    {/* Tags */}
                    <div className="flex items-center flex-wrap gap-2 mb-4">
                      {p.status === 'solved' ? (
                         <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded w-fit uppercase tracking-wide border border-cyan-500/20">
                          ✓ Solved
                        </span>
                      ) : (workingBy.length > 0 ? (
                         <span className="text-[10px] font-bold text-[#f01c7d] bg-[#f01c7d]/10 px-2 py-1 rounded w-fit uppercase tracking-wide border border-[#f01c7d]/20">
                          In Progress
                        </span>
                      ) : (
                         <span className="text-[10px] font-bold text-cyan-500 bg-cyan-500/10 px-2 py-1 rounded w-fit uppercase tracking-wide border border-cyan-500/20">
                          Open
                        </span>
                      ))}

                      {['campus', p.category.toLowerCase().replace(/ /g, "")].map(tag => (
                        <span key={tag} className="text-[11px] font-medium text-gray-500 bg-zinc-800/50 px-2 py-1 rounded w-fit border border-zinc-700/50">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Content */}
                    <h3 
                       onClick={() => router.push(`/profile/${p.creatorId || userId}`)}
                       className="text-xl font-extrabold text-white mb-2 leading-snug group-hover:text-[#00d0e6] transition-colors cursor-pointer"
                    >
                      {p.title}
                    </h3>

                    <p className="text-[#a1a1aa] text-[14px] mb-5 leading-relaxed line-clamp-3">
                      {p.description}
                    </p>

                    {p.status === "solved" && p.solution && (
                      <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4 mb-5">
                        <div className="text-[11px] font-bold text-cyan-400 mb-1.5 uppercase tracking-wider">Solution / Fix:</div>
                        <div className="text-[13px] text-cyan-50 leading-relaxed font-medium whitespace-pre-wrap">
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
                            <button
                              onClick={() => handleOpenSolutionModal(p.id, p.alias)}
                              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-cyan-500/20 text-cyan-500 hover:bg-cyan-500/10 transition text-[11px] font-black uppercase tracking-tight"
                            >
                              ✅ Solved
                            </button>
                            <button
                              onClick={() => handleUpvote(p.id, p.votes, p.upvotedBy || [])}
                              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full transition text-[11px] font-black uppercase tracking-tight ${p.votes >= 10 ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/20' : 'border border-pink-500/20 text-[#f01c7d] hover:bg-pink-500/10 bg-zinc-900'}`}
                            >
                              {p.votes >= 10 ? <Zap className="w-3.5 h-3.5 fill-current" /> : <ThumbsUp className="w-3.5 h-3.5" />}
                              Upvote {p.votes > 0 && <span>{p.votes}</span>}
                            </button>

                            <button
                              onClick={() => handleStartWorking(p)}
                              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full transition text-[11px] font-black uppercase tracking-tight relative ${isWorking ? 'bg-[#1a1a1a] text-[#00d0e6] border border-[#00d0e6]/30 shadow-lg shadow-cyan-500/10' : 'bg-gradient-to-r from-[#f01c7d] to-[#7c3aed] hover:scale-105 active:scale-95 text-white overflow-hidden'}`}
                            >
                              {isWorking ? (
                                <>
                                  <MessageCircle className="w-3.5 h-3.5" /> Chat
                                  {(() => {
                                    const unreadCount = (p.messageCount || 0) - (readCounts[p.id] || 0);
                                    if (unreadCount > 0 && activeChat?.id !== p.id) {
                                      return (
                                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] w-4.5 h-4.5 font-black rounded-full flex items-center justify-center border-2 border-[#111] animate-bounce">
                                          {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                      );
                                    }
                                    return null;
                                  })()}
                                </>
                              ) : (
                                <>
                                  <Users className="w-3.5 h-3.5" /> Join Group
                                </>
                              )}
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center gap-3">
                            {p.solution && (
                               <a 
                                 href={p.solution} 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 className="text-[11px] font-black text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-3 py-1.5 rounded-full hover:bg-cyan-400/20 transition uppercase tracking-tighter"
                               >
                                 View Project
                               </a>
                            )}
                            <span className="text-[11px] font-black text-green-500 flex items-center gap-1.5 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20 uppercase tracking-tighter">
                              🏆 Solved
                            </span>
                          </div>
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
                  <Link key={student.id} href={`/profile/${student.id}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#111] transition-colors cursor-pointer border border-transparent hover:border-zinc-800/60">
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
                  </Link>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Live Chat Panel (Overlay / Slide in / Expandable) */}
        {activeChat && (
          <div className={`absolute top-0 right-0 h-full pb-safe ${isChatExpanded ? 'w-full lg:w-[calc(100%-260px)]' : 'w-full sm:w-[400px] lg:w-[450px]'} bg-[#0a0a0a] border-l border-zinc-900 shadow-2xl flex flex-col z-20 transition-all duration-300 transform`}>
            {/* Chat Header */}
            <div className="h-[76px] border-b border-zinc-900 flex items-center px-4 shrink-0 bg-[#0a0a0a] gap-3">
              <button 
                onClick={() => setIsMemberListOpen(!isMemberListOpen)}
                className="w-10 h-10 rounded-full bg-[#111] hover:bg-zinc-800 flex items-center justify-center text-gray-400 shrink-0 transition"
              >
                <Users className="w-5 h-5" />
              </button>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-sm truncate">{activeChat.title}</h3>
                  <button 
                    onClick={() => setIsProblemVisible(!isProblemVisible)}
                    className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-gray-400 py-0.5 px-2 rounded-md transition"
                  >
                    View Problem
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 truncate mt-0.5">{activeChat.description}</p>
              </div>

              <div className="hidden md:flex -space-x-2 mr-2">
                {getAvatarInitials(activeChat.workingBy || []).slice(0, 3).map((initial, i) => (
                  <div key={i} className="w-7 h-7 rounded-full border-2 border-[#0a0a0a] bg-zinc-800 flex items-center justify-center text-[9px] font-bold text-gray-300">
                    {initial}
                  </div>
                ))}
                {(activeChat.workingBy?.length || 0) > 3 && (
                  <div className="w-7 h-7 rounded-full border-2 border-[#0a0a0a] bg-zinc-900 flex items-center justify-center text-[9px] font-bold text-gray-500">
                    +{(activeChat.workingBy?.length || 0) - 3}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 sm:gap-2 text-gray-400 shrink-0 border-l border-zinc-800 pl-4">
                <button
                  onClick={() => setIsMeetupModalOpen(true)}
                  className="p-1.5 hover:bg-zinc-800 hover:text-purple-400 rounded-md transition"
                  title="Schedule Meetup"
                >
                  <CalendarPlus className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-0.5 sm:gap-1 bg-zinc-900/50 rounded-lg p-0.5 border border-zinc-800/50">
                  <button
                    onClick={() => setIsCalling('audio')}
                    className="p-1.5 hover:bg-zinc-800 hover:text-blue-400 rounded-md transition"
                    title="Audio Call"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsCalling('video')}
                    className="p-1.5 hover:bg-zinc-800 hover:text-blue-400 rounded-md transition"
                    title="Video Call"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                </div>

                <div className="w-[1px] h-4 bg-zinc-800 mx-1" />

                <button
                  onClick={handleSummarizeChat}
                  disabled={isSummarizing || chatMessages.length === 0}
                  className="p-1.5 hover:bg-amber-500/10 hover:text-amber-400 rounded-md transition disabled:opacity-50"
                  title="Summarize"
                >
                  <Sparkles className={`w-4 h-4 ${isSummarizing ? 'animate-pulse text-amber-500' : ''}`} />
                </button>

                <button
                  onClick={() => setIsChatExpanded(!isChatExpanded)}
                  className="p-1.5 hover:bg-zinc-800 hover:text-white rounded-md transition hidden sm:block"
                >
                  {isChatExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                <button
                  onClick={handleLeaveGroup}
                  className="p-1.5 hover:bg-red-500/10 hover:text-red-500 text-red-400 rounded-md transition"
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
                  className="p-1.5 hover:bg-zinc-800 hover:text-white rounded-md transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Pinned Problem Card (Replaces banner) */}
            <div className={`bg-gradient-to-b from-[#111] to-[#0a0a0a] border-b border-zinc-900 transition-all duration-300 overflow-hidden ${isProblemVisible ? 'max-h-[300px] py-4 shadow-2xl' : 'max-h-[58px] py-3'}`}>
              <div className="px-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex-shrink-0 w-2 h-2 bg-yellow-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.5)]"></span>
                    <h4 className="text-xs font-bold text-white transition-all truncate">Active Problem</h4>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tighter ${
                      activeChat.status === "solved" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                    }`}>
                      {activeChat.status}
                    </span>
                  </div>
                  
                  {isProblemVisible ? (
                    <p className="text-[12px] text-gray-400 leading-relaxed font-sans">{activeChat.description}</p>
                  ) : (
                    <p className="text-[11px] text-gray-500 truncate">{activeChat.title}</p>
                  )}
                </div>

                {userId === activeChat.creatorId && activeChat.status !== "solved" && (
                  <button
                    onClick={() => {
                      setProblemToSolve({ id: activeChat.id, alias: activeChat.alias });
                      setIsSolutionModalOpen(true);
                    }}
                    className="shrink-0 bg-white text-black text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors shadow-lg shadow-white/5 active:scale-95"
                  >
                    Mark as Solved
                  </button>
                )}
              </div>
              
              {isProblemVisible && (
                <div className="px-4 mt-4 pt-4 border-t border-zinc-900/50 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-[10px] text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3 h-3" /> {activeChat.workingBy?.length || 0} builders
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ThumbsUp className="w-3 h-3" /> {activeChat.votes || 0} upvotes
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-600">
                    Posted by {activeChat.alias}
                  </div>
                </div>
              )}
            </div>

            {/* Messages Area & Member List */}
            <div className="flex-1 flex overflow-hidden min-h-0 relative">
              <div 
                className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 bg-[#060606] scroll-smooth"
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
                    if (msg.type === 'system') {
                      return (
                        <div key={msg.id} className="flex justify-center my-4">
                          <span className="text-[10px] sm:text-xs text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800/50 italic tracking-wide">
                            {msg.text}
                          </span>
                        </div>
                      );
                    }

                    const isMine = msg.senderId === userId;
                    const isImage = msg.fileUrl && msg.fileType?.startsWith('image/');

                    return (
                      <div key={msg.id} className={`flex flex-col mb-4 group relative ${isMine ? 'items-end ml-auto' : 'items-start mr-auto'} max-w-[85%] min-w-0`}>
                        {!isMine && (
                          <Link href={`/profile/${msg.senderId}`} className="flex items-center gap-2 mb-1.5 ml-1 group/author">
                            <div className="w-6 h-6 rounded-full bg-pink-600 flex items-center justify-center text-[9px] font-bold text-white shrink-0 group-hover/author:scale-110 transition-transform shadow-lg shadow-pink-900/20">
                              {msg.senderName.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-[11px] font-semibold text-gray-400 group-hover/author:text-white transition-colors">{msg.senderName}</span>
                          </Link>
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

                          <div className={`rounded-2xl shadow-lg border transition-all ${isMine
                            ? 'bg-gradient-to-br from-[#f01c7d] to-[#7c3aed] text-white rounded-tr-sm font-medium border-pink-400/20'
                            : 'bg-gradient-to-br from-[#1a1a1a] to-[#111] text-gray-200 rounded-tl-sm border-zinc-800'
                            } ${isImage ? 'p-1' : 'px-4 py-3 text-[13px] leading-relaxed'} overflow-hidden break-words max-w-full relative shadow-black/40`}>
                            
                            {/* Reply Reference Bubble */}
                            {msg.replyTo && (
                              <div className={`mb-2 p-2 rounded-lg text-[11px] ${isMine ? 'bg-black/20 text-white/80' : 'bg-black/30 text-gray-400'} border-l-2 ${isMine ? 'border-white/30' : 'border-pink-500'}`}>
                                <div className={`font-bold mb-0.5 ${isMine ? 'text-white' : 'text-pink-400'}`}>{msg.replyTo.sender}</div>
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
                        <span className={`text-[9px] text-gray-500 mt-1 px-1 transition-opacity duration-300 opacity-0 group-hover:opacity-100`}>
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    );
                  })
                )
              )}
              <div ref={messagesEndRef} />
            </div>

              {/* Member List Panel */}
              <div className={`transition-all duration-300 border-l border-zinc-900 bg-[#0a0a0a] overflow-y-auto shrink-0 ${isMemberListOpen ? 'w-[200px] sm:w-[240px]' : 'w-0'}`}>
                <div className="p-4 pt-6">
                  <div className="flex items-center justify-between mb-6 px-1">
                    <h4 className="text-[11px] font-bold text-gray-400 font-mono uppercase tracking-widest">Workspace</h4>
                    <button onClick={() => setIsMemberListOpen(false)} className="lg:hidden text-gray-500 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Role: Problem Poster */}
                    <div>
                      <h5 className="text-[10px] text-zinc-600 font-bold mb-3 px-1 uppercase tracking-tighter italic">Problem Poster</h5>
                      <div className="space-y-2">
                        {(() => {
                          const poster = campusUsers.find(u => u.id === activeChat.creatorId);
                          if (poster && poster.status === 'online') {
                            return (
                              <Link href={`/profile/${poster.id}`} className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-zinc-900/50 transition group/item">
                                <div className="relative">
                                  <div className="w-7 h-7 rounded-full bg-cyan-600 flex items-center justify-center text-[10px] font-bold text-white uppercase group-hover/item:scale-105 transition-transform">
                                    {poster.alias.charAt(0)}
                                  </div>
                                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-[#0a0a0a]"></div>
                                </div>
                                <span className="text-xs font-medium text-gray-300 truncate group-hover/item:text-white transition-colors">{poster.alias}</span>
                              </Link>
                            );
                          }
                          return <div className="text-[10px] text-zinc-700 italic px-1">Offline</div>;
                        })()}
                      </div>
                    </div>

                    {/* Role: Builder (Solver) */}
                    {(() => {
                      const solverId = activeChat.solverId;
                      const solver = campusUsers.find(u => u.id === solverId);
                      if (solver && solver.status === 'online') {
                        return (
                          <div>
                            <h5 className="text-[10px] text-zinc-600 font-bold mb-3 px-1 uppercase tracking-tighter italic">Builder</h5>
                            <div className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-zinc-900/50 transition">
                              <div className="w-7 h-7 rounded-full bg-pink-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                                { solver.alias.charAt(0) }
                              </div>
                              <span className="text-xs font-medium text-gray-300 truncate">{solver.alias}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Role: Collaborators */}
                    <div>
                      <h5 className="text-[10px] text-zinc-600 font-bold mb-3 px-1 uppercase tracking-tighter italic">Collaborators (Online)</h5>
                      <div className="space-y-2">
                        {(() => {
                          const onlineCollaborators = (activeChat.workingBy || [])
                            .filter((id: string) => id !== activeChat.creatorId && id !== activeChat.solverId)
                            .map((id: string) => campusUsers.find(u => u.id === id))
                            .filter((u: any) => u && u.status === 'online');

                          if (onlineCollaborators.length === 0) {
                            return <div className="text-[10px] text-zinc-700 italic px-1">No collaborators online</div>;
                          }

                          return onlineCollaborators.map((user: any) => (
                            <div key={user.id} className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-zinc-900/50 transition group/mem">
                              <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-gray-400 group-hover/mem:text-white transition uppercase">
                                {user.alias.charAt(0)}
                              </div>
                              <span className="text-xs font-medium text-gray-400 group-hover/mem:text-gray-200 truncate transition">{user.alias}</span>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
                <div className="flex-1 relative group">
                  <input
                    type="text"
                    ref={textInputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={isCalling ? "Text chat paused during call..." : "Type a message..."}
                    disabled={!!isCalling}
                    className="w-full bg-[#1a1a1a] text-sm text-white rounded-full px-4 py-2.5 outline-none border border-zinc-800 focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all disabled:opacity-50"
                  />
                  {newMessage.length > 0 && (
                    <span className={`absolute right-4 -top-6 text-[10px] font-mono ${newMessage.length > 500 ? 'text-red-500' : 'text-gray-500'} transition-opacity`}>
                      {newMessage.length}
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!!isCalling || (!newMessage.trim() && !pendingAttachment?.url)}
                  className="p-2.5 bg-gradient-to-r from-[#f01c7d] to-[#7c3aed] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 text-white rounded-full transition-all shrink-0 shadow-lg shadow-purple-900/20"
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

            <div className="p-6">
              {/* Stepper Indicator */}
              <div className="flex items-center justify-between mb-8 px-2">
                {[1, 2].map((s) => (
                  <div key={s} className="flex items-center flex-1 last:flex-none">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${guidedStep >= s ? 'bg-gradient-to-r from-[#f01c7d] to-[#7c3aed] text-white shadow-[0_0_15px_rgba(240,28,125,0.4)]' : 'bg-zinc-800 text-zinc-500'}`}>
                      {s}
                    </div>
                    {s < 2 && (
                      <div className={`flex-1 h-[2px] mx-2 rounded-full transition-all duration-500 ${guidedStep > s ? 'bg-gradient-to-r from-[#f01c7d] to-[#7c3aed]' : 'bg-zinc-800'}`} />
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-6 min-h-[300px] flex flex-col justify-center">
                {guidedStep === 1 && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <label className="block text-[10px] font-black text-zinc-500 mb-4 uppercase tracking-[0.2em]">Step 1: The Core Issue</label>
                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2">What's the problem?</label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="e.g. Broken elevator in Block B"
                          className="w-full px-4 py-3.5 rounded-xl bg-[#0a0a0a] border border-zinc-800 focus:border-cyan-500 outline-none text-white placeholder:text-zinc-700 transition-all text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2">Category</label>
                        <div className="grid grid-cols-2 gap-2">
                          {CATEGORIES.filter(c => c.name !== 'All Problems' && c.name !== 'Hall of Fame').slice(0, 6).map(cat => (
                            <button
                              key={cat.name}
                              onClick={() => setNewPostCategory(cat.name)}
                              className={`px-3 py-2.5 rounded-xl border text-[11px] font-bold transition-all flex items-center gap-2 ${newPostCategory === cat.name ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' : 'bg-zinc-900/30 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                            >
                              <cat.icon className="w-3.5 h-3.5" />
                              {cat.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {guidedStep === 2 && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <label className="block text-[10px] font-black text-zinc-500 mb-4 uppercase tracking-[0.2em]">Step 2: Impact & Details</label>
                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2">Describe it in detail (min 80 chars)</label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Describe your situation — what do you know, what confuses you, or where are you stuck? (No worries if you haven't tried anything yet)"
                          className="w-full px-4 py-3.5 rounded-xl bg-[#0a0a0a] border border-zinc-800 focus:border-cyan-500 outline-none h-32 text-white placeholder:text-zinc-700 resize-none transition-all text-sm leading-relaxed"
                        />
                        <div className="flex justify-between mt-2">
                          <span className={`text-[10px] font-bold ${description.length >= 80 ? 'text-green-500' : 'text-zinc-600'}`}>
                            {description.length} / 80 characters
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2">Who does it affect?</label>
                        <input
                          type="text"
                          value={audience}
                          onChange={(e) => setAudience(e.target.value)}
                          placeholder="e.g. All Block B students, morning commuters"
                          className="w-full px-4 py-3.5 rounded-xl bg-[#0a0a0a] border border-zinc-800 focus:border-cyan-500 outline-none text-white placeholder:text-zinc-700 transition-all text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

              </div>

              <div className="pt-8 flex gap-3">
                {guidedStep > 1 && (
                  <button
                    onClick={() => setGuidedStep(prev => prev - 1)}
                    className="px-6 py-3.5 rounded-xl bg-zinc-900 text-zinc-400 font-bold text-xs hover:text-white transition-all border border-zinc-800"
                  >
                    Back
                  </button>
                )}
                
                {guidedStep < 2 ? (
                  <button
                    onClick={() => setGuidedStep(prev => prev + 1)}
                    disabled={guidedStep === 1 ? !title.trim() : (guidedStep === 2 ? description.length < 80 : false)}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all flex justify-center items-center gap-2 text-xs border border-zinc-700"
                  >
                    Next Step <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isAnalyzing || description.length < 80}
                    className="flex-1 bg-gradient-to-r from-[#f01c7d] to-[#7c3aed] hover:from-[#d81970] hover:to-[#6d28d9] disabled:opacity-75 text-white font-black py-4 rounded-2xl shadow-[0_0_20px_rgba(219,39,119,0.3)] transition-all flex justify-center items-center gap-2 text-sm uppercase tracking-widest"
                  >
                    {isAnalyzing ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-pulse text-yellow-300" />
                        Analyzing...
                      </>
                    ) : (
                      "Post Problem 🚀"
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Meetup Modal */}
      {isMeetupModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-900 bg-[#0c0c0c]">
              <h2 className="text-lg font-black text-white flex items-center gap-2 tracking-tight uppercase">
                <CalendarPlus className="w-5 h-5 text-pink-500" /> Plan a Meetup
              </h2>
              <button
                onClick={() => setIsMeetupModalOpen(false)}
                className="text-gray-500 hover:text-white transition-colors bg-zinc-800/30 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex flex-col h-[500px]">
              <div className="flex-1 p-6 space-y-4 overflow-y-auto custom-scrollbar">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 px-0.5">Meetup Title</label>
                  <input
                    type="text"
                    value={meetupTitle}
                    onChange={(e) => setMeetupTitle(e.target.value)}
                    placeholder="e.g. Cab Sharing to Airport"
                    className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-zinc-800 focus:border-pink-500 outline-none text-white placeholder:text-zinc-700 transition-colors text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 px-0.5">Link to Problem</label>
                  <select
                    value={meetupProblemId}
                    onChange={(e) => setMeetupProblemId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-zinc-800 focus:border-pink-500 outline-none text-white text-sm cursor-pointer appearance-none"
                  >
                    <option value="">Select a challenge...</option>
                    {problems.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 px-0.5">Date</label>
                    <input
                      type="date"
                      value={meetupDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setMeetupDate(e.target.value)}
                      className="w-full px-3 py-3 rounded-xl bg-[#0a0a0a] border border-zinc-800 focus:border-pink-500 outline-none text-white text-xs [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 px-0.5">Time</label>
                    <input
                      type="time"
                      value={meetupTime}
                      min={meetupDate === new Date().toISOString().split('T')[0] ? new Date().toTimeString().slice(0, 5) : undefined}
                      onChange={(e) => setMeetupTime(e.target.value)}
                      className="w-full px-3 py-3 rounded-xl bg-[#0a0a0a] border border-zinc-800 focus:border-pink-500 outline-none text-white text-xs [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-300">Max Attendees</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Limit joiners (empty for ∞)</p>
                  </div>
                  <input 
                    type="number"
                    min="1"
                    value={maxAttendees || ""}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setMaxAttendees(isNaN(val) ? null : Math.max(1, val));
                    }}
                    placeholder="∞"
                    className="w-16 h-10 bg-black border border-zinc-800 rounded-lg text-center text-sm text-pink-500 font-bold outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 px-0.5">Meeting Point Name</label>
                  <input
                    type="text"
                    value={meetupLocation}
                    onChange={(e) => setMeetupLocation(e.target.value)}
                    placeholder="e.g. Ground Floor Stairs, Lift Lobby"
                    className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-zinc-800 focus:border-pink-500 outline-none text-white placeholder:text-zinc-700 transition-colors text-sm"
                  />
                </div>

                <div className="mt-6 flex gap-2">
                   <button
                    onClick={handleScheduleMeetup}
                    className="w-full py-4 bg-gradient-to-r from-[#f01c7d] to-[#7c3aed] hover:from-[#d81970] hover:to-[#6d28d9] text-white font-black rounded-xl shadow-lg transition-all text-xs uppercase tracking-widest"
                  >
                    Confirm Meetup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Calendar Full Modal */}
      {isCalendarOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 h-[600px] flex flex-col">
            <div className="p-6 border-b border-zinc-900 flex items-center justify-between bg-[#111]">
              <div className="flex bg-zinc-900/50 p-1 rounded-xl">
                <button 
                  onClick={() => setMeetupTab('upcoming')}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${meetupTab === 'upcoming' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-gray-300'}`}
                >
                  Upcoming
                </button>
                <button 
                  onClick={() => setMeetupTab('past')}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${meetupTab === 'past' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-gray-300'}`}
                >
                  Archive
                </button>
              </div>
              <button
                onClick={() => setIsCalendarOpen(false)}
                className="text-gray-400 hover:text-white transition-colors bg-white/5 p-2 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {(() => {
                const now = new Date();
                const filtered = meetups.filter(m => {
                  const mDate = new Date(`${m.date}T${m.time || '00:00'}`);
                  return meetupTab === 'upcoming' ? mDate >= now : mDate < now;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
                      <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center">
                        <CalendarIcon className="w-10 h-10 text-zinc-700" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-white font-bold">No {meetupTab} meetups</h3>
                        <p className="text-xs text-zinc-500 max-w-[200px]">Create one from any problem chat to solve things together!</p>
                      </div>
                      <button 
                        onClick={() => { setIsCalendarOpen(false); setIsMeetupModalOpen(true); }}
                        className="py-2.5 px-6 bg-gradient-to-r from-[#f01c7d] to-[#7c3aed] text-white text-[11px] font-black uppercase rounded-full shadow-lg"
                      >
                        Plan First Meetup
                      </button>
                    </div>
                  );
                }

                return filtered.map((m: any) => {
                  const isAttendee = m.attendees?.includes(userId);
                  const isCreator = m.creatorId === userId;
                  const canPostOutcome = meetupTab === 'past' && isCreator && !m.outcome;

                  // Dynamic style based on Category
                  let borderClass = "border-l-cyan-500";
                  let bgClass = "bg-cyan-500/5";
                  let Icon = CalendarIcon;
                  let textColor = "text-cyan-400";
                  
                  if (m.category === 'Cab') {
                    borderClass = "border-l-purple-500"; bgClass = "bg-purple-500/5"; Icon = Car; textColor = "text-purple-400";
                  } else if (m.category === 'Academics' || m.category === 'Exam') {
                    borderClass = "border-l-yellow-500"; bgClass = "bg-yellow-500/5"; Icon = Book; textColor = "text-yellow-400";
                  } else if (m.category === 'Food') {
                    borderClass = "border-l-pink-500"; bgClass = "bg-pink-500/5"; Icon = Utensils; textColor = "text-pink-400";
                  }

                  return (
                    <div key={m.id} className={`bg-[#0a0a0a] border border-zinc-900 rounded-2xl overflow-hidden border-l-4 ${borderClass} transition-all hover:bg-white/[0.02]`}>
                      <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                             <div className={`p-1.5 rounded-lg ${bgClass} ${textColor}`}>
                              <Icon className="w-3.5 h-3.5" />
                             </div>
                             <span className={`text-[10px] font-black uppercase tracking-widest ${textColor}`}>{m.title}</span>
                          </div>
                          <h4 className="text-sm font-bold text-white mb-3 truncate">{m.problemTitle}</h4>
                          <div className="flex flex-wrap gap-3 items-center">
                            <span className="text-[11px] text-gray-500 flex items-center gap-1.5 bg-zinc-900/50 px-2 py-1 rounded-lg">
                              <MapPin className="w-3 h-3" /> {m.location}
                            </span>
                            <div className="flex items-center -space-x-2">
                              {m.attendees?.slice(0, 3).map((at: string, idx: number) => (
                                <div key={idx} className="w-6 h-6 rounded-full bg-zinc-800 border-2 border-black flex items-center justify-center text-[8px] font-black text-white">
                                  {idx + 1}
                                </div>
                              ))}
                              {m.attendees?.length > 3 && (
                                <div className="w-6 h-6 rounded-full bg-zinc-900 border-2 border-black flex items-center justify-center text-[8px] font-black text-gray-500">
                                  +{m.attendees.length - 3}
                                </div>
                              )}
                              <span className="text-[10px] text-zinc-500 ml-3 font-bold">{m.attendees?.length || 0} {m.maxAttendees ? `/ ${m.maxAttendees}` : ''} joining</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-row md:flex-col items-center gap-4">
                          <div className="bg-[#111] border border-zinc-800 rounded-2xl px-5 py-3 text-center min-w-[100px] shadow-xl">
                            <div className="text-xs font-black text-gray-500 uppercase tracking-tighter mb-0.5">
                              {new Date(m.date).toLocaleDateString([], { month: 'short' })}
                            </div>
                            <div className="text-2xl font-black text-white leading-none">
                              {new Date(m.date).toLocaleDateString([], { day: 'numeric' })}
                            </div>
                            <div className={`text-[10px] font-bold mt-1.5 ${textColor}`}>{m.time}</div>
                          </div>

                          {meetupTab === 'upcoming' ? (
                            <button 
                              onClick={() => handleJoinMeetup(m.id, m.attendees)}
                              className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isAttendee ? 'bg-zinc-800 text-zinc-400 border border-zinc-700' : 'bg-white text-black hover:bg-gray-200'}`}
                            >
                              {isAttendee ? 'Joined ✓' : 'Join'}
                            </button>
                          ) : (
                             m.outcome ? (
                               <div className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full flex items-center gap-1.5">
                                 <CheckCircle2 className="w-3 h-3 text-green-500" />
                                 <span className="text-[9px] font-black text-green-400 uppercase">Solved</span>
                               </div>
                             ) : isCreator && (
                               <button 
                                 onClick={() => {
                                   const text = prompt("What did you build or decide in this meetup?");
                                   if (text) handlePostOutcome(m.id, text);
                                 }}
                                 className="py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-black uppercase rounded-xl transition-all shadow-lg shadow-cyan-900/40"
                               >
                                 Post Outcome
                               </button>
                             )
                          )}
                        </div>
                      </div>
                      
                      {m.outcome && (
                        <div className="px-5 pb-5 pt-0 border-t border-zinc-900/50 mt-1">
                          <div className="bg-zinc-900/30 p-3 rounded-xl border border-zinc-800/50">
                            <div className="flex items-center gap-2 mb-1.5">
                              <Sparkles className="w-3 h-3 text-yellow-500" />
                              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Meetup Outcome</span>
                            </div>
                            <p className="text-[11px] text-gray-400 leading-relaxed italic">"{m.outcome}"</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
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
                Solution Built 🏆
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
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Deployed Project Link / Final URL</label>
                <input
                  type="text"
                  value={solutionText}
                  onChange={(e) => setSolutionText(e.target.value)}
                  placeholder="https://your-project-link.com"
                  className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-zinc-800 focus:border-green-500 outline-none text-white placeholder:text-zinc-600 transition-colors text-sm mb-4"
                />
                
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <p className="text-xs text-green-400 flex items-start gap-2">
                    <span className="text-lg leading-none">💡</span>
                    <span>By marking this solved, you will be permanently credited as the builder for this problem on your profile. Awesome job closing the loop!</span>
                  </p>
                </div>
              </div>
              <div className="pt-2">
                <button
                  onClick={handleMarkAsSolved}
                  className="w-full bg-gradient-to-r from-[#f01c7d] to-[#7c3aed] hover:from-[#d81970] hover:to-[#6d28d9] text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(240,28,125,0.3)] transition-all flex justify-center items-center gap-2 text-sm hover:-translate-y-0.5"
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