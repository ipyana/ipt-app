"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Select, Label } from "@/components/ui/form";
import { LogIn, UserPlus, Shield, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Mode = "student" | "register" | "admin";

interface Program { id: number; name: string; department: { code: string; name: string } }
interface GroupedPrograms { [dept: string]: Program[] }

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("student");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [studentId, setStudentId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [programId, setProgramId] = useState<number>(0);
  const [programs, setPrograms] = useState<GroupedPrograms>({});
  const [selectedDept, setSelectedDept] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode === "register") {
      fetch("/api/programs")
        .then((r) => r.json())
        .then((d) => setPrograms(d.grouped || {}))
        .catch(() => {});
    }
  }, [mode]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      if (data.role === "admin") router.push("/admin/dashboard");
      else router.push("/student/dashboard");
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!programId) { setError("Please select your program of study"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, fullName, email, password, programId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      router.push("/student/dashboard");
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  function handleProgramChange(pid: number) {
    setProgramId(pid);
    for (const [dept, progs] of Object.entries(programs)) {
      if (progs.some((p) => p.id === pid)) {
        setSelectedDept(dept);
        return;
      }
    }
    setSelectedDept("");
  }

  const tabs = [
    { mode: "student" as const, label: "Student", icon: LogIn },
    { mode: "register" as const, label: "Register", icon: UserPlus },
    { mode: "admin" as const, label: "Admin", icon: Shield },
  ];

  return (
    <div className="flex min-h-screen bg-surface">
      <div className="hidden lg:flex lg:w-1/2 bg-primary-600 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent-400 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-center px-12">
          <div className="flex justify-center mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/must-logo.png" alt="MUST Logo" className="h-16 w-16 object-contain" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">CoICT — IPT 2025/2026</h1>
          <p className="text-lg text-primary-100/80 leading-relaxed">
            Industrial Practical Training<br />Cluster Selection Portal
          </p>
          <p className="mt-8 text-sm text-primary-200/60">Mbeya University of Science and Technology</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md"
          >
            <div className="lg:hidden text-center mb-8">
              <div className="flex justify-center mb-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 p-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/must-logo.png" alt="MUST Logo" className="h-12 w-12 object-contain brightness-0 invert" />
                </div>
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">CoICT — IPT</h1>
              <p className="text-sm text-slate-500">Industrial Practical Training</p>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center">
                {mode === "register" ? "Create Account" : "Sign In"}
              </h2>
              <p className="text-sm text-slate-500 text-center mt-1">
                {mode === "register" ? "Select your program of study" : mode === "admin" ? "Administrator access" : "Use your registration number to sign in"}
              </p>
            </div>

            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 mb-8">
              {tabs.map((t) => (
                <button key={t.mode} onClick={() => { setMode(t.mode); setError(""); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-medium transition-all duration-200 ${
                    mode === t.mode ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}>
                  <t.icon className="h-4 w-4" />{t.label}
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">{error}</div>
            )}

            {mode === "register" ? (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1.5"><Label>Registration Number</Label><Input value={studentId} onChange={(e) => setStudentId(e.target.value)} required placeholder="e.g. 20252025" /></div>
                <div className="space-y-1.5"><Label>Full Name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} required /></div>
                <div className="space-y-1.5">
                  <Label>Program of Study</Label>
                  <Select value={programId || ""} onChange={(e) => handleProgramChange(Number(e.target.value))} required>
                    <option value="">Select your program...</option>
                    {Object.entries(programs).map(([dept, progs]) => (
                      <optgroup key={dept} label={dept}>
                        {progs.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                      </optgroup>
                    ))}
                  </Select>
                </div>
                {selectedDept && (
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 text-sm">
                    <span className="text-slate-500">Department: </span>
                    <span className="font-medium text-slate-900 dark:text-white">{selectedDept}</span>
                  </div>
                )}
                <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                <div className="space-y-1.5"><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></div>
                <Button type="submit" disabled={loading} className="w-full" size="lg">
                  {loading ? "Creating account..." : "Create Account"}<ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5"><Label>{mode === "admin" ? "Username or Email" : "Registration Number or Email"}</Label>
                  <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} required placeholder={mode === "admin" ? "admin" : "20250001"} /></div>
                <div className="space-y-1.5"><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
                <Button type="submit" disabled={loading} className="w-full" size="lg">
                  {loading ? "Signing in..." : "Sign In"}<ArrowRight className="h-4 w-4" />
                </Button>
                <p className="text-xs text-center text-slate-400 mt-4">
                  {mode === "admin" ? "Demo: admin / Admin@123" : "Demo: 20250001 / Student@123"}
                </p>
              </form>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
