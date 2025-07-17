"use client";
import { useState } from "react";
import LanguagePicker from "@/components/language-picker";
import { useTranslations } from "next-intl";

export default function SettingsPage() {
  const t = useTranslations();
  const [darkMode, setDarkMode] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleDarkModeToggle = () => {
    setDarkMode((prev) => !prev);
    document.documentElement.classList.toggle("dark", !darkMode);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert(t("Passwords do not match"));
      return;
    }
    alert(t("Password changed!"));
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="max-w-lg mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold mb-4">{t("Settings")}</h1>
      <div>
        <h2 className="font-semibold mb-2">{t("Language")}</h2>
        <LanguagePicker />
      </div>
      <div>
        <h2 className="font-semibold mb-2">{t("Appearance")}</h2>
        <button
          className="border rounded px-3 py-1"
          onClick={handleDarkModeToggle}
        >
          {darkMode ? t("Switch to Light Mode") : t("Switch to Dark Mode")}
        </button>
      </div>
      <form onSubmit={handlePasswordChange} className="space-y-4">
        <h2 className="font-semibold mb-2">{t("Change Password")}</h2>
        <input
          type="password"
          placeholder={t("New Password")}
          className="border rounded px-2 py-1 w-full"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder={t("Confirm Password")}
          className="border rounded px-2 py-1 w-full"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
        />
        <button type="submit" className="border rounded px-3 py-1 bg-primary text-white">
          {t("Change Password")}
        </button>
      </form>
    </div>
  );
}
