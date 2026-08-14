import { Link } from "react-router-dom";
import { KeyRound } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
export default function ForgotPassword(){ return <AuthLayout icon={KeyRound} title="Local password recovery" subtitle="Offline accounts cannot be reset by email."><p className="text-sm text-muted-foreground">Ask a local administrator to create a new user or restore a known-good backup. No password recovery email is sent because Salon Management runs fully offline.</p><Link to="/login" className="text-primary font-medium hover:underline mt-4 inline-block">Back to login</Link></AuthLayout> }
