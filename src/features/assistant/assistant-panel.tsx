"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { useShopStore } from "@/store/use-shop-store";
import type { AssistantIntent } from "@/types/domain";
import type { Product } from "@/types/product";
import { assistantResponse, parseAssistantIntent, resolveAssistantProducts } from "./assistant-parser";

export function AssistantPanel({ products }: { products: Product[] }) {
  const addToCart = useShopStore((state) => state.addToCart);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [intent, setIntent] = useState<AssistantIntent>();
  const [results, setResults] = useState<Product[]>([]);
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string; products?: Product[] }>>([]);
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!input.trim()) return;
    const nextIntent = parseAssistantIntent(input, intent);
    const nextResults = resolveAssistantProducts(products, nextIntent, results);
    setIntent(nextIntent);
    setResults(nextResults);
    setMessages((current) => [...current, { role: "user", content: input }, { role: "assistant", content: assistantResponse(nextIntent, nextResults.length), products: nextResults }]);
    setInput("");
  }
  return <><button aria-label="Open shopping assistant" onClick={() => setOpen(true)} className="fixed bottom-5 right-5 z-20 flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white shadow-lg"><MessageCircle size={18} /> Shop assistant</button>{open && <aside className="fixed bottom-5 right-5 z-30 flex h-[min(680px,calc(100vh-2rem))] w-[min(390px,calc(100vw-2rem))] flex-col rounded-3xl bg-cream p-4 shadow-2xl"><div className="flex items-center justify-between"><div><h2 className="font-display text-2xl">Shop assistant</h2><p className="text-xs text-muted">Rule-based demo, not a real LLM</p></div><button aria-label="Close shopping assistant" onClick={() => setOpen(false)}><X /></button></div><div className="mt-4 flex-1 space-y-3 overflow-y-auto">{messages.length === 0 && <div className="rounded-2xl bg-white p-4 text-sm"><p>Tell me what you are shopping for.</p><div className="mt-3 flex flex-wrap gap-2">{["Headphones under 5000", "Laptops with good ratings", "Show me cheaper options"].map((prompt) => <button key={prompt} onClick={() => setInput(prompt)} className="rounded-full bg-sage px-3 py-2 text-xs font-semibold text-leaf">{prompt}</button>)}</div></div>}{messages.map((message, index) => <div key={index} className={message.role === "user" ? "ml-8 rounded-2xl bg-ink p-3 text-sm text-white" : "mr-4 rounded-2xl bg-white p-3 text-sm"}>{message.content}{message.products && <div className="mt-3 space-y-2">{message.products.map((product) => <div key={product.id} className="flex items-center gap-2 rounded-xl bg-cream p-2"><Image src={product.thumbnail} alt="" width={42} height={42} className="rounded-lg object-cover" /><Link href={`/products/${product.id}`} className="min-w-0 flex-1 truncate text-xs font-semibold">{product.title}</Link><button onClick={() => addToCart(product)} className="rounded-full bg-leaf px-2 py-1 text-[10px] font-bold text-white">Add</button></div>)}</div>}</div>)}</div><form onSubmit={submit} className="mt-3 flex gap-2"><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Try: shoes under 3000" className="min-w-0 flex-1 rounded-full border border-ink/10 bg-white px-4 py-3 text-sm outline-none" /><button aria-label="Send assistant message" className="rounded-full bg-ink p-3 text-white"><Send size={16} /></button></form></aside>}</>;
}
