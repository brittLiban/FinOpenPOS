"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import LanguagePicker from "@/components/language-picker";

export default function SettingsPage() {
  // For dark mode toggle (simple local state, you may want to use context or next-themes for real app)
  const [darkMode, setDarkMode] = useState(false);
  // For password change (placeholder, you should implement real logic)
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleDarkModeToggle = () => {
    setDarkMode((prev) => !prev);
    // TODO: Integrate with your theme provider or next-themes
    document.documentElement.classList.toggle("dark", !darkMode);
  };

  const [pwChangeStatus, setPwChangeStatus] = useState<string | null>(null);
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwChangeStatus(null);
    if (password !== confirmPassword) {
      setPwChangeStatus("Passwords do not match");
      return;
    }
    if (!password) {
      setPwChangeStatus("Password cannot be empty");
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setPwChangeStatus(error.message || "Failed to change password");
    } else {
      setPwChangeStatus("Password changed successfully!");
      setPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <div>
        <h2 className="font-semibold mb-2">Language</h2>
        <LanguagePicker />
      </div>
      <div>
        <h2 className="font-semibold mb-2">Appearance</h2>
        <button
          className="border rounded px-3 py-1"
          onClick={handleDarkModeToggle}
        >
          {darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        </button>
      </div>
      <form onSubmit={handlePasswordChange} className="space-y-4">
        <h2 className="font-semibold mb-2">Change Password</h2>
        <input
          type="password"
          placeholder="New Password"
          className="border rounded px-2 py-1 w-full"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm Password"
          className="border rounded px-2 py-1 w-full"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
        />
        <button type="submit" className="border rounded px-3 py-1 bg-primary text-white">
          Change Password
        </button>
        {pwChangeStatus && (
          <div className={pwChangeStatus.includes("success") ? "text-green-600" : "text-red-500"}>{pwChangeStatus}</div>
        )}
      </form>
    </div>
  );
}
