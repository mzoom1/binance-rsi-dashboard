"use client";
import { useState } from "react";
import { Button, Input } from "@/components/Ui";

export type Category = 'all' | 'spot' | 'futures' | 'top20' | 'defi' | 'memes';

type Props = {
  category: Category;
  onCategoryChange: (c: Category) => void;
  watchlist: string[];
  setWatchlist: (next: string[]) => void;
};

export default function Sidebar({ category, onCategoryChange, watchlist, setWatchlist }: Props) {
  const [addSymbol, setAddSymbol] = useState("");

  const addToWatch = () => {
    const s = addSymbol.trim().toUpperCase();
    if (!s) return;
    if (!watchlist.includes(s)) setWatchlist([...watchlist, s]);
    setAddSymbol("");
  };

  return (
    <aside className="w-full md:w-64 shrink-0 space-y-4">
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3">
        <div className="font-medium mb-2">Categories</div>
        <div className="grid grid-cols-2 gap-2">
          {([
            { key: 'spot', label: 'Spot' },
            { key: 'futures', label: 'Futures' },
            { key: 'top20', label: 'Top 20' },
            { key: 'defi', label: 'DeFi' },
            { key: 'memes', label: 'Memecoins' },
          ] as { key: Category; label: string }[]).map(c => (
            <Button
              key={c.key}
              className={`w-full text-xs ${category===c.key ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : ''}`}
              onClick={()=> onCategoryChange(c.key)}
            >
              {c.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3">
        <div className="font-medium mb-2">Watchlist</div>
        <div className="flex gap-2 mb-2">
          <Input value={addSymbol} onChange={(e)=>setAddSymbol(e.target.value)} placeholder="Add symbol" className="flex-1" />
          <Button onClick={addToWatch}>Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {watchlist.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs">
              {s}
              <button onClick={()=>setWatchlist(watchlist.filter(x=>x!==s))} className="opacity-60 hover:opacity-100" title="Remove">🗑</button>
            </span>
          ))}
          {watchlist.length===0 && (
            <div className="text-xs opacity-60">No favorites yet</div>
          )}
        </div>
      </div>
    </aside>
  );
}
