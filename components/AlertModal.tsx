"use client";
import Modal from "@/components/Modal";
import { Button, Input } from "@/components/Ui";
import { useState } from "react";

export default function AlertModal({ open, onClose, symbol }: { open: boolean; onClose: () => void; symbol: string | null }) {
  const [level, setLevel] = useState<number | ''>('');
  const [tf, setTf] = useState<string>('1h');

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-semibold">Set Alert {symbol ? `• ${symbol}` : ''}</div>
          <Button onClick={onClose}>Close</Button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <label className="text-sm">
            <span className="block mb-1 opacity-80">RSI level</span>
            <Input type="number" placeholder="e.g. 30 or 70" value={level}
              onChange={(e)=> setLevel(e.target.value === '' ? '' : Number(e.target.value))} />
          </label>
          <label className="text-sm">
            <span className="block mb-1 opacity-80">Timeframe</span>
            <select className="px-2 py-1 border rounded-md bg-transparent" value={tf} onChange={(e)=>setTf(e.target.value)}>
              {['1m','5m','15m','1h','4h','1d','1w','1M'].map(x => <option key={x} value={x}>{x}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-4">
          <Button className="bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900">Save (placeholder)</Button>
        </div>
      </div>
    </Modal>
  );
}
