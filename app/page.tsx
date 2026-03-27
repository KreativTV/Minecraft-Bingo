"use client";

import { supabase } from '@/lib/supabaseClient';
import { useState, useEffect } from 'react';

const spielerFarben = {
    0: "bg-gray-800 border-gray-700 text-gray-400",
    1: "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/50 scale-105 hover:bg-blue-500",
    2: "bg-red-600 border-red-400 text-white shadow-lg shadow-red-500/50 scale-105 hover:bg-red-500",
};

export default function BingoMultiplayer() {
    const [aktiverSpieler, setAktiverSpieler] = useState<1 | 2>(1);
    const [felderStatus, setFelderStatus] = useState<number[]>(new Array(25).fill(0));
    const [begriffe, setBegriffe] = useState<string[]>(new Array(25).fill("Laden..."));
    const [isEditing, setIsEditing] = useState(false);
    const [neueBegriffeInput, setNeueBegriffeInput] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            const { data } = await supabase.from('bingo_cells').select('*').order('id', { ascending: true });
            if (data) {
                setFelderStatus(data.map(f => f.status));
                setBegriffe(data.map(f => f.content || `Feld ${f.id + 1}`));
            }
        };
        fetchData().catch(console.error);

        const channel = supabase.channel('bingo_updates')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bingo_cells' }, (payload) => {
                const { id, status, content } = payload.new;
                setFelderStatus(prev => { const k = [...prev]; k[id] = status; return k; });
                if (content !== undefined) setBegriffe(prev => { const k = [...prev]; k[id] = content; return k; });
            })
            .subscribe();

        return () => { void supabase.removeChannel(channel); };
    }, []);

    const feldKlicken = async (index: number) => {
        const neuerStatus = felderStatus[index] === aktiverSpieler ? 0 : aktiverSpieler;
        await supabase.from('bingo_cells').update({ status: neuerStatus }).eq('id', index);
    };

    const spielResetten = async () => {
        const liste = neueBegriffeInput.split(/\n/).map(s => s.trim()).filter(s => s !== "");
        if (liste.length < 25) {
            alert(`Du hast erst ${liste.length} von 25 Begriffen!`);
            return;
        }
        for (let i = 0; i < 25; i++) {
            await supabase.from('bingo_cells').update({ status: 0, content: liste[i] }).eq('id', i);
        }
        setIsEditing(false);
        setNeueBegriffeInput("");
    };

    return (
        <main className="min-h-screen bg-gray-950 p-12 text-white flex flex-col items-center justify-center overflow-x-hidden">

            <header className="mb-12 text-center shrink-0">
                <h1 className="text-6xl font-extrabold tracking-tighter bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    MINECRAFT BINGO
                </h1>
            </header>

            {!isEditing ? (
                <div className="flex flex-row items-start justify-center w-full max-w-[1600px]">
                    <aside className="flex flex-col gap-4 w-72 shrink-0">
                        <button
                            onClick={() => setAktiverSpieler(1)}
                            className={`w-full py-5 rounded-2xl font-bold transition-all border-2 text-lg ${aktiverSpieler === 1 ? 'bg-blue-600 border-blue-400 shadow-xl shadow-blue-500/40 scale-105' : 'bg-gray-900 border-gray-800 text-gray-500 hover:border-blue-400'}`}
                        >
                            Spieler 1 (Blau)
                        </button>

                        <button
                            onClick={() => setAktiverSpieler(2)}
                            className={`w-full py-5 rounded-2xl font-bold transition-all border-2 text-lg ${aktiverSpieler === 2 ? 'bg-red-600 border-red-400 shadow-xl shadow-red-500/40 scale-105' : 'bg-gray-900 border-gray-800 text-gray-500 hover:border-red-400'}`}
                        >
                            Spieler 2 (Rot)
                        </button>
                    </aside>
                    <div className="w-[700px] mx-12 grid grid-cols-5 gap-2 shrink-0">
                        {felderStatus.map((status, i) => {
                            const hoverFarbe = status === 0
                                ? (aktiverSpieler === 1
                                    ? "hover:border-blue-500/50 hover:bg-blue-900/30 text-gray-400 hover:text-blue-200"
                                    : "hover:border-red-500/50 hover:bg-red-900/30 text-gray-400 hover:text-red-200")
                                : "hover:brightness-110";

                            return (
                                <button
                                    key={i}
                                    onClick={() => feldKlicken(i)}
                                    className={`aspect-square rounded-2xl border-2 flex items-center justify-center text-center p-3 text-sm font-bold transition-all duration-300 ${spielerFarben[status as keyof typeof spielerFarben]} ${hoverFarbe}`}
                                >
                                    {begriffe[i]}
                                </button>
                            );
                        })}
                    </div>
                    <aside className="flex flex-col gap-4 w-72 shrink-0">
                        <button
                            onClick={() => setIsEditing(true)}
                            className="w-full py-5 rounded-2xl bg-green-700/20 text-green-400 border border-green-800 hover:bg-green-700/40 transition-all font-bold text-base mb-6 shadow-lg shadow-green-900/20"
                        >
                            ⚙️ Neues Spiel
                        </button>
                    </aside>
                </div>
            ) : (
                <div className="w-[800px] bg-gray-900 p-10 rounded-3xl border border-gray-800 shadow-2xl">
                    <h2 className="text-3xl font-bold mb-4">⚙️ Spielfeld bearbeiten</h2>
                    <p className="text-base text-gray-400 mb-8">Trage 25 Begriffe ein getrennt Zeilenumbruch.</p>
                    <textarea
                        className="w-full h-96 bg-gray-950 border-2 border-gray-700 rounded-2xl p-6 text-base focus:border-blue-500 outline-none transition-all resize-none font-mono"
                        placeholder="Holz, Stein, Eisen..."
                        value={neueBegriffeInput}
                        onChange={(e) => setNeueBegriffeInput(e.target.value)}
                    />
                    <div className="flex gap-4 mt-8">
                        <button onClick={spielResetten}
                                className="flex-1 bg-green-600 py-4 rounded-2xl font-bold text-xl hover:bg-green-500 shadow-lg transition-colors">Speichern & Starten</button>
                        <button onClick={() => setIsEditing(false)} className="px-8 py-4 bg-gray-800 rounded-2xl font-bold text-lg hover:bg-gray-700 transition-colors">Abbrechen</button>
                    </div>
                </div>
            )}
        </main>
    );
}