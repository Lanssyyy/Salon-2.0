import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2, User } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { useAuth } from "@/lib/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const [name,setName]=useState('Administrator'); const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [confirmPassword,setConfirmPassword]=useState(''); const [error,setError]=useState(''); const [loading,setLoading]=useState(false);
  const handleSubmit=async(e)=>{e.preventDefault(); setError(''); if(password!==confirmPassword){setError('Passwords do not match');return;} setLoading(true); try{ await register({name,email,password,role:'admin'}); window.location.href='/'; }catch(err){setError(err.message||'Registration failed');} finally{setLoading(false)}};
  const field=(id,type,value,set,Icon,auto,placeholder)=><div className="relative"><Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/><Input id={id} type={type} autoComplete={auto} placeholder={placeholder} value={value} onChange={(e)=>set(e.target.value)} className="pl-10 h-12" required/></div>;
  return <AuthLayout icon={UserPlus} title="Create local administrator" subtitle="Set up the first offline account for this computer" footer={<>Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Log in</Link></>}>
    {error&&<div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
    <form onSubmit={handleSubmit} className="space-y-4"><div className="space-y-2"><Label htmlFor="name">Name</Label>{field('name','text',name,setName,User,'name','Administrator')}</div><div className="space-y-2"><Label htmlFor="email">Email</Label>{field('email','email',email,setEmail,Mail,'email','you@example.com')}</div><div className="space-y-2"><Label htmlFor="password">Password</Label>{field('password','password',password,setPassword,Lock,'new-password','••••••••')}</div><div className="space-y-2"><Label htmlFor="confirm">Confirm Password</Label>{field('confirm','password',confirmPassword,setConfirmPassword,Lock,'new-password','••••••••')}</div><Button type="submit" className="w-full h-12 font-medium" disabled={loading}>{loading?<><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Creating account...</>:'Create administrator'}</Button></form>
  </AuthLayout>;
}
