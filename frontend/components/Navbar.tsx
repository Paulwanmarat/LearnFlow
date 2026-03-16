"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Settings, Search, User } from "lucide-react";
import Image from "next/image";
import API from "../utils/api";

/* ─── Types ─────────────────────────────────────────────── */

interface NavItem {
  name: string;
  path: string;
}

interface SearchUser {
  username: string;
  avatar:   string | null;
  level:    number;
  league:   string;
  country:  string;
}

interface AvatarCircleProps {
  src:      string;
  name:     string;
  size?:    "sm" | "md";
}

interface ResultAvatarProps {
  user: SearchUser;
}

interface SearchDropdownProps {
  results:  SearchUser[];
  loading:  boolean;
  query:    string;
  onSelect: (username: string) => void;
  onClear:  () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (q: string) => void;
}

/* ─── Constants ─────────────────────────────────────────── */

const NAV_ITEMS: NavItem[] = [
  { name: "Dashboard",    path: "/dashboard" },
  { name: "Learning Lab", path: "/learning" },
  { name: "Adaptive Mode",path: "/adaptive" },
  { name: "Leaderboard",  path: "/leaderboard" },
];

const DIM: Record<"sm" | "md", string> = {
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
};

/* ─── Sub-components (defined outside Navbar to avoid re-mount) ─ */

function AvatarCircle({ src, name, size = "md" }: AvatarCircleProps) {
  const dim = DIM[size];
  return src ? (
    <img
      src={src}
      alt={name || "Profile"}
      className={`${dim} rounded-full object-cover border-2 border-white/10 flex-shrink-0`}
    />
  ) : (
    <div className={`${dim} rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 border-2 border-white/10 flex items-center justify-center font-bold text-white flex-shrink-0`}>
      {name ? name[0].toUpperCase() : "?"}
    </div>
  );
}

function ResultAvatar({ user }: ResultAvatarProps) {
  const [err, setErr] = useState(false);
  return user.avatar && !err ? (
    <img
      src={user.avatar}
      alt={user.username}
      onError={() => setErr(true)}
      className="w-8 h-8 rounded-full object-cover border border-white/10 flex-shrink-0"
    />
  ) : (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 border border-white/10 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
      {user.username[0].toUpperCase()}
    </div>
  );
}

function getFlag(country: string): string {
  if (!country) return "";
  return country
    .slice(0, 2)
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

function SearchDropdown({
  results,
  loading,
  query,
  onSelect,
  onClear,
  inputRef,
  onChange,
}: SearchDropdownProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -6, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-[#0d1227] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden"
      >
        {/* Input row */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/5">
          <Search className="w-4 h-4 text-white/30 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Search players…"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none"
          />
          {query && (
            <button
              onClick={onClear}
              className="text-white/30 hover:text-white/60 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Results body */}
        <div className="max-h-64 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-6">
              <div className="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
            </div>
          )}

          {!loading && query.trim().length >= 2 && results.length === 0 && (
            <p className="py-6 text-center text-sm text-white/30">No players found</p>
          )}

          {!loading && results.length > 0 && (
            <ul className="p-1.5 space-y-0.5">
              {results.map((u) => (
                <li key={u.username}>
                  <button
                    onClick={() => onSelect(u.username)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all group text-left"
                  >
                    <ResultAvatar user={u} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate group-hover:text-cyan-400 transition-colors">
                        {u.username}
                      </p>
                      <p className="text-xs text-white/30">
                        {getFlag(u.country)} Lvl {u.level} · {u.league}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!loading && query.trim().length < 2 && (
            <p className="py-5 text-center text-xs text-white/20">
              Type at least 2 characters
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Navbar ─────────────────────────────────────────────── */

export default function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();

  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [profileOpen,   setProfileOpen]   = useState(false);
  const [avatar,        setAvatar]        = useState("");
  const [username,      setUsername]      = useState("");

  /* search */
  const [searchOpen,    setSearchOpen]    = useState(false);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const searchRef      = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);       // desktop
  const mobileInputRef = useRef<HTMLInputElement>(null);       // ← NEW: mobile
  const debounceRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* close mobile menu on route change */
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  /* close profile dropdown on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-profile-dropdown]")) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* close search on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        closeSearch();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ─── FIX: focus the correct input based on viewport ─── */
  useEffect(() => {
    if (!searchOpen) return;

    const focusInput = () => {
      if (window.innerWidth < 768) {
        mobileInputRef.current?.focus();
      } else {
        inputRef.current?.focus();
      }
    };

    const timer = setTimeout(focusInput, 120);
    return () => clearTimeout(timer);
  }, [searchOpen]);

  /* Escape key closes search */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeSearch(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  /* load current user's avatar + username */
  useEffect(() => {
    if (!localStorage.getItem("token")) return;
    API.get<{ user?: { avatar?: string; username?: string }; avatar?: string; username?: string }>("/dashboard")
      .then(({ data }) => {
        const u = data?.user ?? data;
        if (u?.avatar)   setAvatar(u.avatar);
        if (u?.username) setUsername(u.username);
      })
      .catch(() => {/* silently ignore — user may not be logged in */});
  }, []);

  /* debounced player search */
  const handleSearchInput = useCallback((q: string) => {
    setSearchQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 2) { setSearchResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const { data } = await API.get<{ users: SearchUser[] }>(
          `/users/search?q=${encodeURIComponent(q.trim())}`
        );
        setSearchResults(data.users ?? []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }, []);

  const closeSearch = useCallback((): void => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  }, []);

  const goToProfile = useCallback((uname: string): void => {
    closeSearch();
    router.push(`/profile/${uname}`);
  }, [closeSearch, router]);

  const logout = (): void => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  /* derived */
  const profileHref = username ? `/profile/${username}` : "#";

  return (
    <>
      {/* ═══ TOP BAR ═══ */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 sm:px-6 md:px-10 py-3 sm:py-4 glass-panel border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 sm:gap-3 group flex-shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden flex-shrink-0">
            <Image src="/Logo2.png" alt="Logo" width={40} height={40} className="w-full h-full object-cover" />
          </div>
          <h2 className="text-base sm:text-xl font-bold font-display tracking-tight text-white">
            Cognivra Adaptive
          </h2>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex gap-1">
          {NAV_ITEMS.map(({ name, path }) => (
            <Link
              key={path}
              href={path}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                pathname === path
                  ? "bg-white/10 text-brand-accent1 shadow-inner ring-1 ring-white/10"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              {name}
            </Link>
          ))}
        </nav>

        {/* Desktop right cluster */}
        <div className="hidden md:flex items-center gap-2">

          {/* Date pill */}
          <p className="text-xs font-semibold text-brand-accent1 tracking-widest uppercase bg-brand-accent1/10 px-3 py-1.5 rounded-full border border-brand-accent1/20">
            {new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
          </p>

          {/* Search */}
          <div className="relative" ref={searchRef}>
            <button
              aria-label="Search players"
              onClick={() => setSearchOpen((p) => !p)}
              className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all ${
                searchOpen
                  ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                  : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10"
              }`}
            >
              <Search className="w-4 h-4" />
            </button>

            {searchOpen && (
              <SearchDropdown
                results={searchResults}
                loading={searchLoading}
                query={searchQuery}
                onSelect={goToProfile}
                onClear={() => handleSearchInput("")}
                inputRef={inputRef}
                onChange={handleSearchInput}
              />
            )}
          </div>

          {/* Profile dropdown */}
          <div className="relative" data-profile-dropdown>
            <button
              onClick={() => setProfileOpen((p) => !p)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group"
            >
              <AvatarCircle src={avatar} name={username} size="md" />
              {username && (
                <span className="text-sm text-white/70 group-hover:text-white transition-colors font-medium max-w-[100px] truncate">
                  {username}
                </span>
              )}
              <svg
                className={`w-3.5 h-3.5 text-white/30 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#0d1227] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3">
                    <AvatarCircle src={avatar} name={username} size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{username || "User"}</p>
                      <p className="text-xs text-white/30">My Account</p>
                    </div>
                  </div>

                  <div className="p-2 space-y-0.5">
                    <Link
                      href={profileHref}
                      onClick={() => setProfileOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <User className="w-4 h-4" />
                      View Profile
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setProfileOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-400/10 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile: search + avatar + hamburger */}
        <div className="md:hidden flex items-center gap-2">
          <button
            aria-label="Search players"
            onClick={() => { setSearchOpen((p) => !p); setMobileOpen(false); }}
            className={`w-8 h-8 flex items-center justify-center rounded-xl border transition-all ${
              searchOpen
                ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                : "bg-white/5 border-white/10 text-white/50"
            }`}
          >
            <Search className="w-4 h-4" />
          </button>
          <AvatarCircle src={avatar} name={username} size="sm" />
          <button
            onClick={() => { setMobileOpen((p) => !p); setSearchOpen(false); }}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ═══ MOBILE SEARCH BAR (slides under navbar) ═══ */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed top-[57px] left-0 right-0 z-50 md:hidden px-3 pt-2 pb-3 bg-[#0d1227] border-b border-white/10 shadow-xl"
          >
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
              <Search className="w-4 h-4 text-white/30 flex-shrink-0" />
              <input
                ref={mobileInputRef}
                autoFocus
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                placeholder="Search players…"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none"
              />
              {searchQuery && (
                <button onClick={() => handleSearchInput("")} className="text-white/30">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {searchLoading && (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
              </div>
            )}

            {!searchLoading && searchResults.length > 0 && (
              <ul className="mt-2 space-y-1">
                {searchResults.map((u) => (
                  <li key={u.username}>
                    <button
                      onClick={() => goToProfile(u.username)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-left"
                    >
                      <ResultAvatar user={u} />
                      <div>
                        <p className="text-sm font-semibold text-white">{u.username}</p>
                        <p className="text-xs text-white/30">Lvl {u.level} · {u.league}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {!searchLoading && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
              <p className="text-center text-sm text-white/30 py-4">No players found</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ MOBILE DROPDOWN MENU ═══ */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="fixed top-[57px] left-0 right-0 z-50 md:hidden mx-3 rounded-2xl bg-[#0d1227] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden"
            >
              {/* Profile header */}
              <div className="px-4 py-3.5 border-b border-white/5 flex items-center gap-3">
                <AvatarCircle src={avatar} name={username} size="md" />
                <div>
                  <p className="text-sm font-semibold text-white">{username || "User"}</p>
                  <p className="text-xs text-white/30">My Account</p>
                </div>
              </div>

              <nav className="p-3 space-y-1">
                {NAV_ITEMS.map(({ name, path }) => (
                  <Link
                    key={path}
                    href={path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-all ${
                      pathname === path
                        ? "bg-brand-accent1/15 text-brand-accent1 border border-brand-accent1/25"
                        : "text-white/60 hover:bg-white/5 hover:text-white border border-transparent"
                    }`}
                  >
                    <span>{name}</span>
                    {pathname === path && (
                      <motion.span layoutId="mobileActiveTab" className="ml-auto w-2 h-2 rounded-full bg-brand-accent1" />
                    )}
                  </Link>
                ))}
              </nav>

              <div className="px-3 pb-3 pt-1 border-t border-white/5 space-y-1">
                {username && (
                  <Link
                    href={profileHref}
                    onClick={() => setMobileOpen(false)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white/60 hover:bg-white/5 hover:text-white border border-transparent transition-all"
                  >
                    <User className="w-4 h-4" />
                    View Profile
                  </Link>
                )}
                <Link
                  href="/settings"
                  onClick={() => setMobileOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white/60 hover:bg-white/5 hover:text-white border border-transparent transition-all"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
                <button
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-400/10 hover:border-red-400/20 border border-transparent transition-all"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}