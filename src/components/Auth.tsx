import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      if (showResetPassword) {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        
        if (resetError) throw resetError;
        
        toast({
          title: "Password reset email sent!",
          description: "Check your email for the reset link.",
          duration: 5000,
        });
        setShowResetPassword(false);
        return;
      }

      const { error } = isSignUp 
        ? await supabase.auth.signUp({ 
            email, 
            password,
            options: {
              data: { timestamp: new Date().toISOString() }
            }
          })
        : await supabase.auth.signInWithPassword({ 
            email, 
            password,
            options: {
              persistSession: rememberMe
            }
          });

      if (error) throw error;
      
      toast({
        title: isSignUp ? "Check your email to confirm signup!" : "Successfully signed in!",
        duration: 3000,
      });
    } catch (error) {
      let errorMessage = "An unexpected error occurred";
      
      // Provide more user-friendly error messages
      if (error.message.includes("Invalid login")) {
        errorMessage = "Invalid email or password";
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = "Please check your email and confirm your account first";
      } else if (error.message.includes("Password should be")) {
        errorMessage = "Password must be at least 6 characters long";
      } else if (error.message.includes("already registered")) {
        errorMessage = "This email is already registered. Try signing in instead";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-bold tracking-tight">
            {showResetPassword 
              ? "Reset Password"
              : isSignUp 
                ? "Create your account" 
                : "Sign in to your account"}
          </h2>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          <div className="space-y-4 rounded-md shadow-sm">
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {!showResetPassword && (
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            )}
          </div>

          {!isSignUp && !showResetPassword && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <label
                  htmlFor="remember"
                  className="text-sm text-gray-600 cursor-pointer"
                >
                  Remember me
                </label>
              </div>
              <button
                type="button"
                onClick={() => setShowResetPassword(true)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Forgot password?
              </button>
            </div>
          )}

          <div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </>
              ) : showResetPassword ? (
                "Send reset instructions"
              ) : isSignUp ? (
                "Sign up"
              ) : (
                "Sign in"
              )}
            </Button>
          </div>
        </form>

        <div className="text-center space-y-2">
          <button
            type="button"
            onClick={() => {
              setShowResetPassword(false);
              setIsSignUp(!isSignUp);
              setError("");
            }}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </button>
          {showResetPassword && (
            <button
              type="button"
              onClick={() => {
                setShowResetPassword(false);
                setError("");
              }}
              className="block w-full text-sm text-blue-600 hover:text-blue-800"
            >
              Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}