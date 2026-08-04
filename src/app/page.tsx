"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { Select } from "@/components/ui/select";
import { RoleModal } from "@/components/ui/RoleModal";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Mode = "login" | "register";

interface Program { id: number; name: string; department: { code: string; name: string } }
interface GroupedPrograms { [dept: string]: Program[] }

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [roleModalOpen, setRoleModalOpen] = useState(false);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [programId, setProgramId] = useState<number>(0);
  const [confirmPassword, setConfirmPassword] = useState("");
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
      if (data.mustChangePassword) {
        router.push("/change-password");
        return;
      }
      if (data.role === "super_admin") router.push("/super-admin");
      else if (["admin", "coordinator"].includes(data.role)) router.push("/admin/dashboard");
      else if (data.role === "staff") router.push("/staff");
      else router.push("/student/dashboard");
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDept) { setError("Please select your department"); return; }
    if (!programId) { setError("Please select your program of study"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, fullName, email, password, confirmPassword, programId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      router.push("/student/dashboard");
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  function handleRoleSelect(role: "student" | "staff") {
    setRoleModalOpen(false);
    if (role === "student") {
      setMode("register");
      setError("");
    } else {
      router.push("/staff/register");
    }
  }

  function handleDeptSelect(deptKey: string) {
    setSelectedDept(deptKey);
    setProgramId(0);
  }

  function switchMode(m: Mode) {
    setMode(m);
    setError("");
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-sm"
          >
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm">
              <div className="flex justify-center mb-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/must_Logo.png" alt="MUST Logo" className="h-24 w-24 object-contain" />
              </div>

              <h1 className="text-xl font-semibold text-slate-900 dark:text-white text-center">
                {mode === "register" ? "Create Account" : "Sign In"}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-1 mb-6">
                {mode === "register"
                  ? "Register for your IPT account"
                  : "Enter your credentials to continue"}
              </p>

              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">{error}</div>
              )}

              {mode === "register" ? (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Registration Number</Label>
                    <Input value={studentId} onChange={(e) => setStudentId(e.target.value)} required placeholder="e.g. 20252025" className="h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Full Name</Label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="John Doe" className="h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Department</Label>
                    <Select value={selectedDept} onChange={(e) => handleDeptSelect(e.target.value)} required className="h-10">
                      <option value="">Select your department...</option>
                      {Object.keys(programs).map((dept) => (<option key={dept} value={dept}>{dept}</option>))}
                    </Select>
                  </div>
                  {selectedDept && (
                    <div className="space-y-1.5">
                      <Label>Program of Study</Label>
                      <Select value={programId || ""} onChange={(e) => setProgramId(Number(e.target.value))} required className="h-10">
                        <option value="">Select your program...</option>
                        {programs[selectedDept]?.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                      </Select>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" className="h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Password</Label>
                    <div className="relative">
                      <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} placeholder="Min 8 chars, 1 cap, 1 number, 1 special" className="h-10 pr-10" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Re-Enter Password</Label>
                    <Input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} placeholder="Re-enter your password" className="h-10" />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full h-10 mt-2">
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                  <p className="text-center text-sm text-slate-500 mt-4">
                    Already have an account?{" "}
                    <button type="button" onClick={() => switchMode("login")} className="font-medium text-primary-600 hover:text-primary-700">Sign in</button>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Username</Label>
                    <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} required
                      placeholder="Email, Reg Number, or phone" className="h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label>Password</Label>
                      <button type="button" onClick={() => router.push("/forgot-password")} className="text-xs font-medium text-primary-600 hover:text-primary-700">Forgot password?</button>
                    </div>
                    <div className="relative">
                      <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required
                        placeholder="Enter your password" className="h-10 pr-10" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full h-10 mt-2">
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                  <p className="text-center text-sm text-slate-500 mt-4">
                    Don't have an account?{" "}
                    <button type="button" onClick={() => setRoleModalOpen(true)} className="font-medium text-primary-600 hover:text-primary-700">Sign up</button>
                  </p>
                </form>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <RoleModal open={roleModalOpen} onClose={() => setRoleModalOpen(false)} onSelect={handleRoleSelect} />
    </div>
  );
}
