import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, KeyRound, Building2 } from "lucide-react";

const Login = () => {
  return (
    <div className="dark min-h-screen grid lg:grid-cols-2 bg-background text-foreground">
      {/* Left brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-[hsl(162_72%_8%)] text-brand-foreground overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20"/>
        <div className="absolute -bottom-40 -left-20 h-[500px] w-[500px] rounded-full bg-primary/15 blur-[120px]"/>

        <div className="relative">
          <Logo />
        </div>

        <div className="relative max-w-md">
          <ShieldCheck className="h-10 w-10 text-primary mb-6"/>
          <p className="text-2xl font-semibold leading-snug tracking-tight">
            "Foretyx let our clinicians use AI for discharge summaries without ever exposing a single ABHA ID."
          </p>
          <div className="mt-6 text-sm text-brand-foreground/60">
            Dr. Anjali Rao · CMIO, Apex Care Hospitals
          </div>
        </div>

        <div className="relative flex items-center gap-6 text-xs text-brand-foreground/50">
          <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-primary"/>SOC 2</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-primary"/>ISO 27001</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-primary"/>DPDP Act 2023</span>
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8"><Logo/></div>
          <h1 className="text-3xl font-bold tracking-tight">Sign in to your console</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enterprise SSO recommended. Local credentials available for break-glass access.
          </p>

          <div className="mt-8 space-y-3">
            <Button variant="outline" className="w-full h-11 justify-start gap-3 bg-card">
              <Building2 className="h-4 w-4 text-primary"/>
              Continue with workspace SSO
            </Button>
            <Button variant="outline" className="w-full h-11 justify-start gap-3 bg-card">
              <KeyRound className="h-4 w-4 text-primary"/>
              Sign in with hardware key
            </Button>
          </div>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border"/>
            <span>or with email</span>
            <div className="h-px flex-1 bg-border"/>
          </div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-1.5">
              <Label htmlFor="email">Work email</Label>
              <Input id="email" type="email" placeholder="riya.sharma@apexcare.in" className="h-11 bg-card"/>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="pw">Password</Label>
                <a href="#" className="text-xs text-primary hover:underline">Forgot?</a>
              </div>
              <Input id="pw" type="password" placeholder="••••••••••••" className="h-11 bg-card"/>
            </div>
            <Link to="/dashboard" className="block">
              <Button type="submit" className="w-full h-11">Sign in securely</Button>
            </Link>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Protected by Foretyx local key vault · No credentials sent to third parties
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
