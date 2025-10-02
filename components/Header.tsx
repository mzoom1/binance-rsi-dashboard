"use client";
import { Input, Button } from "@/components/Ui";
import ThemeToggle from "@/components/ThemeToggle";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Header({
  search,
  setSearch,
}: {
  search: string;
  setSearch: (v: string) => void;
}) {
  const [local, setLocal] = useState(search);
  useEffect(()=>{ setLocal(search); }, [search]);

  useEffect(()=>{
    const t = setTimeout(()=> setSearch(local), 250);
    return ()=> clearTimeout(t);
  }, [local, setSearch]);

  // Autocomplete symbols (max 5)
  const [sugs, setSugs] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let alive = true;
    const q = local.trim().toUpperCase();
    if (!q) { setSugs([]); setOpen(false); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/symbols?market=spot&quote=USDT`, { cache: 'force-cache' });
        const json = await res.json();
        const all: { symbol: string }[] = json?.symbols || [];
        const out = all.map(s => s.symbol).filter((s: string) => s.includes(q)).slice(0, 5);
        if (!alive) return;
        setSugs(out);
        setOpen(out.length > 0);
      } catch {
        if (alive) { setSugs([]); setOpen(false); }
      }
    }, 200);
    return () => { alive = false; clearTimeout(t); };
  }, [local]);

  return (
    <header className="flex items-center gap-3 justify-between py-2">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-lg font-semibold hover:opacity-90 transition-opacity">NeuroFi RSI</Link>
        <div className="hidden md:block text-xs opacity-60">All Binance coins • Multi-timeframe RSI</div>
      </div>

      <div className="relative flex-1 max-w-2xl">
        <Input
          value={local}
          onChange={(e)=>setLocal(e.target.value)}
          placeholder="Search coins (e.g., BTCUSDT)"
          className="w-full"
        />
        {open && (
          <div className="absolute z-20 mt-1 w-full rounded-lg border bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 shadow-lg">
            <ul className="py-1 text-sm">
              {sugs.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                    onClick={()=>{ setLocal(s); setSearch(s); setOpen(false); }}
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button className="border-blue-500/30 hover:shadow-[0_0_0_3px_rgba(96,165,250,0.15)]">
          <span className="mr-1">👤</span> Login / Register
        </Button>
      </div>
    </header>
  );
}
