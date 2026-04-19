"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { BookOpen, Search, Filter } from "lucide-react";

// Components
import SubjectGrid from "@/components/dashboard/SubjectGrid";
import MaterialGrid from "@/components/dashboard/MaterialGrid";

interface Subject {
  id: string;
  name: string;
  description?: string;
}

export default function LibraryPage() {
  const [user, setUser] = useState<any>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<{id: string, name: string} | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        setUser(authUser);
      } else {
        router.push("/login");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!user) return;

    const qSub = query(collection(db, "subjects"), orderBy("name", "asc"));
    const unsubSub = onSnapshot(qSub, (snapshot) => {
      const subjectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as unknown as Subject[];
      setSubjects(subjectsData);
      setSubjectsLoading(false);
    });

    return () => unsubSub();
  }, [user]);

  const filteredSubjects = subjects.filter(sub => 
    sub.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return null;

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <BookOpen className="text-[#00cec9]" size={32} />
          Thư viện tài liệu
        </h1>
        <p className="text-slate-500">Tìm kiếm bài giảng, slide và tài liệu ôn tập theo từng môn học.</p>
      </div>

      {selectedSubject ? (
        <MaterialGrid 
          subjectId={selectedSubject.id} 
          subjectName={selectedSubject.name} 
          onBack={() => setSelectedSubject(null)} 
        />
      ) : (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
             <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm môn học..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 outline-none focus:border-[#00cec9] transition-all"
                />
             </div>
             <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors">
                <Filter size={14} />
                <span>Lọc theo khối</span>
             </button>
          </div>

          <div className="space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#00cec9]">Danh mục môn học</h2>
            <SubjectGrid 
              subjects={filteredSubjects} 
              loading={subjectsLoading} 
              onSelect={(id, name) => setSelectedSubject({ id, name })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
