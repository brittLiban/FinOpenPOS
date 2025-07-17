"use client";
import { useState } from "react";
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

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    // TODO: Call your API to change password
    alert("Password changed!");
    setPassword("");
    setConfirmPassword("");
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
      </form>
    </div>
  );
}
