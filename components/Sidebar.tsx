"use client";
import { useEffect, useMemo, useState } from "react";
import { Button, Input } from "@/components/Ui";
import { intervals, toggleInterval, sortIntervals } from "@/lib/intervals";

const CATEGORIES = ["Spot","Futures","Top 20","DeFi","Memecoins"] as const;

type Props = {
  selected: string[];
  setSelected: (v: string[]) => void;
  watchlist: string[];
  setWatchlist: (next: string[]) => void;
};

export default function Sidebar({ selected, setSelected, watchlist, setWatchlist }: Props) {
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
        <div className="font-medium mb-2">Timeframes</div>
        <div className="flex flex-wrap gap-2">
          {intervals.map((iv) => {
            const active = selected.includes(iv);
            return (
              <button
                key={iv}
                type="button"
                onClick={() => setSelected(sortIntervals(toggleInterval(selected, iv)))}
                className={`px-2 py-1 rounded text-sm border ${
                  active ? "bg-neutral-900 text-white border-neutral-900" : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
              >
                {iv}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3">
        <div className="font-medium mb-2">Categories</div>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((c) => (
            <Button key={c} className="w-full text-xs">{c}</Button>
          ))}
        </div>
        <div className="mt-2 text-xs opacity-60">(placeholders)</div>
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
              <button onClick={()=>setWatchlist(watchlist.filter(x=>x!==s))} className="opacity-60 hover:opacity-100">×</button>
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
