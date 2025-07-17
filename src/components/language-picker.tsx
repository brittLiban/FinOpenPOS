"use client";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";


const languages = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
];

export default function LanguagePicker() {
  const pathname = usePathname() || "/en";
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value;
    // Replace the first segment of the path with the new locale
    const segments = pathname.split("/");
    if (languages.some(l => l.code === segments[1])) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }
    const newPath = segments.join("/");
    startTransition(() => {
      router.push(newPath);
    });
  };


  const currentLocale = (() => {
    const seg = pathname.split("/")[1];
    return languages.some(l => l.code === seg) ? seg : "en";
  })();

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="language-picker" className="text-xs font-medium mb-1">Language</label>
      <div className="relative">
        <select
          id="language-picker"
          value={currentLocale}
          onChange={handleChange}
          disabled={isPending}
          className="border rounded px-3 py-2 pr-8 text-sm bg-background appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Select language"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.label}
            </option>
          ))}
        </select>
        <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</span>
      </div>
    </div>
  );
}
