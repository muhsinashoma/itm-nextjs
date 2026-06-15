"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Shield, ArrowRight, Loader2 } from "lucide-react";
import { authApi } from "@/lib/api";

export default function AuthPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!username || !password) { setError("Please enter username and password."); return; }
        setError(""); setLoading(true);
        try {
            const res = await authApi.login(username, password);
            const { token, employee_id, full_name, user_type } = res.data;
            localStorage.setItem("itm_token", token);
            localStorage.setItem("itm_user", JSON.stringify({ employee_id, full_name, user_type }));
            router.push("/dashboard");
        } catch (e: any) {
            setError(e.message ?? "Login failed.");
        } finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
                <div className="hidden md:flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-10 text-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full translate-x-1/3 translate-y-1/3" />
                    <div className="relative z-10 text-center space-y-6">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 border border-white/20">
                            <Shield className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">ITM Portal</h2>
                            <p className="text-slate-400 mt-2 text-sm">Information Technology<br />Management System</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-left">
                            {[{ n: "12,867", l: "Active Assets" }, { n: "1,540+", l: "Employees" }, { n: "99.9%", l: "Uptime" }, { n: "24/7", l: "Support" }].map(s => (
                                <div key={s.l} className="bg-white/5 border border-white/10 rounded-xl p-3">
                                    <p className="text-xl font-bold">{s.n}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{s.l}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex flex-col justify-center p-8 sm:p-10">
                    <div className="md:hidden flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900">ITM Portal</p>
                            <p className="text-xs text-slate-500">Fiber@Home Ltd.</p>
                        </div>
                    </div>
                    <div className="space-y-1 mb-8">
                        <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
                        <p className="text-sm text-slate-500">Sign in to your account</p>
                    </div>
                    <div className="space-y-5">
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-slate-700">Username or Email</Label>
                            <Input value={username} onChange={e => setUsername(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleLogin()}
                                type="text" placeholder="username or email"
                                className="h-11 border-slate-200 focus-visible:ring-slate-900" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-slate-700">Password</Label>
                            <div className="relative">
                                <Input value={password} onChange={e => setPassword(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && handleLogin()}
                                    type={showPassword ? "text" : "password"} placeholder="Enter password"
                                    className="h-11 pr-10 border-slate-200 focus-visible:ring-slate-900" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-lg">{error}</div>}
                        <Button onClick={handleLogin} disabled={loading}
                            className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> :
                                <span className="flex items-center gap-2">Sign in <ArrowRight className="h-4 w-4" /></span>}
                        </Button>
                    </div>
                    <p className="text-center text-xs text-slate-400 mt-8">© 2026 Fiber@Home Ltd. · All rights reserved</p>
                </div>
            </div>
        </div>
    );
}
