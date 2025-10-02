"use client";
import { Input, Button } from "@/components/Ui";
import ThemeToggle from "@/components/ThemeToggle";
import { useState, useEffect } from "react";

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

  return (
    <header className="flex items-center gap-3 justify-between py-2">
      <div className="flex items-center gap-3">
        <div className="text-lg font-semibold">NeuroFi RSI</div>
        <div className="hidden md:block text-xs opacity-60">All Binance coins • Multi-timeframe RSI</div>
      </div>

      <div className="flex-1 max-w-2xl">
        <Input
          value={local}
          onChange={(e)=>setLocal(e.target.value)}
          placeholder="Search coins (e.g., BTCUSDT)"
          className="w-full"
        />
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button>Login / Register</Button>
      </div>
    </header>
  );
}
