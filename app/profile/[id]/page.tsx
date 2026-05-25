"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { ArrowLeft, Award, Briefcase, FileText, Github, Globe, Linkedin, MapPin, Twitter, Zap, CheckCircle2, Layout, ExternalLink, LogOut } from "lucide-react";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  
  const [profile, setProfile] = useState<any>(null);
  const [solvedProblems, setSolvedProblems] = useState<any[]>([]);
  const [postedProblems, setPostedProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchProfileData = async () => {
      setLoading(true);
      try {
        // Fetch user basic info
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          setProfile(userDoc.data());
        }

        // Fetch solved problems - looking in both campus and growth
        const campusSolved = await getDocs(query(collection(db, "campusProblems"), where("solverId", "==", userId)));
        const growthSolved = await getDocs(query(collection(db, "growthStruggles"), where("solverId", "==", userId)));
        
        const solved = [
          ...campusSolved.docs.map(d => ({ id: d.id, ...d.data(), type: 'campus' })),
          ...growthSolved.docs.map(d => ({ id: d.id, ...d.data(), type: 'growth' }))
        ];
        setSolvedProblems(solved);

        // Fetch posted problems
        const campusPosted = await getDocs(query(collection(db, "campusProblems"), where("creatorId", "==", userId)));
        const growthPosted = await getDocs(query(collection(db, "growthStruggles"), where("creatorId", "==", userId)));

        const posted = [
          ...campusPosted.docs.map(d => ({ id: d.id, ...d.data(), type: 'campus' })),
          ...growthPosted.docs.map(d => ({ id: d.id, ...d.data(), type: 'growth' }))
        ];
        setPostedProblems(posted);

      } catch (err: any) {
        console.error("Error fetching profile:", err);
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium animate-pulse">Building Portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-cyan-500/30">
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <button 
          onClick={() => router.back()}
          className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-12 bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:border-white/20"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold">Back to Feed</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Sidebar / Info */}
          <div className="space-y-8">
            <div className="bg-[#111111] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-cyan-500/10 to-transparent pointer-events-none"></div>
              
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-4xl font-black shadow-xl shadow-cyan-500/20 border-2 border-white/10 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                    {profile?.alias ? profile.alias.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-green-500 p-2 rounded-xl border-4 border-[#111] shadow-lg">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                </div>

                <h1 className="text-3xl font-black tracking-tight mb-8">{profile?.alias || "Anonymous Agent"}</h1>

                <div className="grid grid-cols-2 gap-3 w-full mb-8">
                  <div className="bg-cyan-500/5 rounded-[2rem] p-4 border border-cyan-500/10 text-center group/stat">
                    <div className="flex justify-center mb-1">
                      <Briefcase className="w-4 h-4 text-cyan-400 opacity-50 group-hover/stat:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-2xl font-black text-white">{solvedProblems.length}</div>
                    <div className="text-[9px] uppercase tracking-widest font-black text-cyan-500/60 mt-0.5">Solved</div>
                  </div>
                  <div className="bg-purple-500/5 rounded-[2rem] p-4 border border-purple-500/10 text-center group/stat">
                    <div className="flex justify-center mb-1">
                      <Zap className="w-4 h-4 text-purple-400 opacity-50 group-hover/stat:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-2xl font-black text-white">{postedProblems.length}</div>
                    <div className="text-[9px] uppercase tracking-widest font-black text-purple-500/60 mt-0.5">Spotted</div>
                  </div>
                </div>

                {auth.currentUser?.uid === userId ? (
                  <button 
                    onClick={() => {
                      signOut(auth);
                      router.push("/");
                      toast.success("Logged out successfully");
                    }}
                    className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 rounded-2xl font-black text-sm border border-zinc-800 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 text-red-400"
                  >
                    <LogOut className="w-4 h-4" /> LOGOUT
                  </button>
                ) : (
                  <button className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-2xl font-black text-sm shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                    CONNECT PRIVATELY
                  </button>
                )}
              </div>
            </div>

            {/* Badges / Achievements */}
            <div className="bg-[#111111] border border-white/5 rounded-3xl p-8">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
                <Award className="w-4 h-4" /> Achievements
              </h3>
              <div className="space-y-4">
                {solvedProblems.length > 0 && (
                  <div 
                    onClick={() => document.getElementById('solved-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-green-500/5 border border-green-500/10 cursor-pointer hover:bg-green-500/10 transition"
                  >
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-xl">🔨</div>
                    <div>
                      <p className="text-xs font-black text-green-400 uppercase tracking-tight">Loop Closer</p>
                      <p className="text-[11px] text-gray-400 font-medium">Solved {solvedProblems.length} critical issues</p>
                    </div>
                  </div>
                )}
                {postedProblems.length >= 5 && (
                  <div 
                    onClick={() => document.getElementById('posted-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10 cursor-pointer hover:bg-purple-500/10 transition"
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-xl">📢</div>
                    <div>
                      <p className="text-xs font-black text-purple-400 uppercase tracking-tight">Active Voice</p>
                      <p className="text-[11px] text-gray-400 font-medium">Spotted 5+ campus problems</p>
                    </div>
                  </div>
                )}
                {solvedProblems.length === 0 && postedProblems.length < 5 && (
                  <p className="text-xs text-gray-500 italic text-center py-4">Achievements will appear here as you solve or post problems!</p>
                )}
              </div>
            </div>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-12">
            {/* Solved Projects - The Portfolio */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl border border-cyan-500/20">
                    <Layout className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h2 id="solved-section" className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
                      Portfolio
                    </h2>
                    <p className="text-sm font-bold text-cyan-500 tracking-widest uppercase mt-1">Shipped Projects</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {solvedProblems.length === 0 ? (
                  <div className="col-span-full relative overflow-hidden rounded-[2rem] p-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/50 via-zinc-900/50 to-black rounded-[2rem]"></div>
                    <div className="relative bg-[#0a0a0a]/80 backdrop-blur-xl border border-zinc-800/50 rounded-[1.85rem] py-16 px-6 text-center flex flex-col items-center">
                      <div className="w-20 h-20 mb-6 bg-gradient-to-tr from-cyan-500/10 to-purple-500/10 rounded-full flex items-center justify-center border border-white/5 shadow-[0_0_40px_rgba(6,182,212,0.1)]">
                        <Briefcase className="w-8 h-8 text-cyan-500/50" />
                      </div>
                      <h3 className="text-xl font-black text-white mb-2">No Projects Yet</h3>
                      <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">Builders close the loop by building solutions. Complete projects to showcase them here!</p>
                    </div>
                  </div>
                ) : (
                  solvedProblems.map(p => (
                    <div key={p.id} className="relative group rounded-[2rem] p-[1px] overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(6,182,212,0.15)]">
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/40 via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="absolute inset-0 bg-zinc-800 opacity-50 group-hover:opacity-0 transition-opacity duration-500"></div>
                      
                      <div className="relative h-full bg-[#0d0d0d] rounded-[1.95rem] p-8 flex flex-col backdrop-blur-xl transition-all duration-500 group-hover:bg-[#0a0a0a]/90">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-bl-full -z-10 blur-2xl group-hover:bg-cyan-500/20 transition-colors duration-500"></div>
                        
                        <div className="flex justify-between items-start mb-6">
                          <span className="text-[10px] font-black text-white bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-1.5 rounded-full shadow-lg shadow-cyan-500/20 uppercase tracking-widest">
                            {p.type === 'campus' ? 'Campus' : 'Growth'}
                          </span>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-full">
                            {p.solvedAt?.toDate ? p.solvedAt.toDate().toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Recently'}
                          </p>
                        </div>
                        
                        <h3 className="text-2xl font-black mb-3 text-white group-hover:text-cyan-400 transition-colors duration-300">{p.title}</h3>
                        <p className="text-gray-400 text-sm mb-8 leading-relaxed line-clamp-3 flex-grow group-hover:text-gray-300 transition-colors duration-300">{p.description}</p>
                        
                        <div className="pt-6 border-t border-white/10 mt-auto">
                          <a 
                            href={p.solution} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-between w-full p-4 rounded-xl bg-white/5 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/20 transition-all duration-300 group/btn"
                          >
                            <div className="flex items-center gap-3">
                              <div className="bg-cyan-500/20 p-2 rounded-lg group-hover/btn:bg-cyan-500 group-hover/btn:text-white text-cyan-500 transition-colors">
                                <Globe className="w-4 h-4" />
                              </div>
                              <span className="text-sm font-bold text-gray-300 group-hover/btn:text-white transition-colors">View Live Project</span>
                            </div>
                            <ExternalLink className="w-4 h-4 text-gray-600 group-hover/btn:text-cyan-400 transition-colors group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Posted Problems */}
            <section id="posted-section" className="pt-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl border border-purple-500/20">
                    <FileText className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
                      Spotted Issues
                    </h2>
                    <p className="text-sm font-bold text-purple-500 tracking-widest uppercase mt-1">Community Voice</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {postedProblems.length === 0 ? (
                  <div className="col-span-full bg-[#0a0a0a] border border-zinc-800/50 rounded-3xl py-12 px-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-purple-500/10 rounded-full flex items-center justify-center border border-purple-500/20">
                      <FileText className="w-6 h-6 text-purple-500/50" />
                    </div>
                    <p className="text-gray-500 text-sm font-medium">No problems spotted yet.</p>
                  </div>
                ) : (
                  postedProblems.map(p => (
                    <div key={p.id} className="relative group bg-[#0d0d0d] border border-white/5 rounded-3xl p-6 hover:border-purple-500/30 transition-all duration-300 overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-pink-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                      <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-colors"></div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-[10px] font-black text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">{p.category}</span>
                          {p.status === 'solved' && (
                            <span className="flex items-center gap-1 text-[10px] font-black text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                              <CheckCircle2 className="w-3 h-3" /> Solved
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-white text-base mb-2 group-hover:text-purple-400 transition-colors line-clamp-1">{p.title}</h4>
                        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed group-hover:text-gray-400 transition-colors">{p.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
