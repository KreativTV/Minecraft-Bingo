"use client";

import { supabase } from '@/lib/supabaseClient';
import { useState, useEffect } from 'react';

const spielerFarben = {
    0: "bg-gray-800",
    1: "bg-blue-600 shadow-blue-500/50",
    2: "bg-red-600 shadow-red-500/50",
};

const bingoBegriffe = [
    "Homeoffice", "Kaffeepause", "Meeting", "Deadline", "Team",
    "Feierabend", "Wochenende", "Projekt", "Erfolg", "Kunde",
    "Zoom", "E-Mail", "Mittagessen", "Pause", "Urlaub",
    "Stress", "Lachen", "Kollege", "Büro", "Laptop",
    "Internet", "Update", "Kreativ", "Idee", "FERTIG"
];

function shuffleArray(array: string[]) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export default function BingoMultiplayer() {
    const [aktiverSpieler, setAktiverSpieler] = useState<1 | 2>(1);
    const [felderStatus, setFelderStatus] = useState<number[]>(new Array(25).fill(0));

    useEffect(() => {
        const fetchInitialData = async () => {
            const { data, error } = await supabase
                .from('bingo_cells')
                .select('*')
                .order('id', { ascending: true });

            if (data) {
                const geladeneFelder = new Array(25).fill(0);
                data.forEach(row => geladeneFelder[row.id] = row.status);
                setFelderStatus(geladeneFelder);
            }
        };

        fetchInitialData().catch(console.error);

        const channel = supabase
            .channel('bingo_updates')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'bingo_cells'
            }, (payload) => {
                const { id, status } = payload.new;
                setFelderStatus((prev) => {
                    const kopie = [...prev];
                    kopie[id] = status;
                    return kopie;
                });
            })
            .subscribe();

        return () => {
            void supabase.removeChannel(channel);
        };
    }, []);

    const feldKlicken = async (index: number) => {
        const aktuellerStatus = felderStatus[index];
        const neuerStatus = aktuellerStatus === aktiverSpieler ? 0 : aktiverSpieler;

        const { error } = await supabase
            .from('bingo_cells')
            .update({ status: neuerStatus })
            .eq('id', index);

        if (error) console.error("Fehler beim Speichern:", error.message);
    };

    return (
        <main className="min-h-screen bg-gray-950 p-8 text-white">

            <header className="mb-8 text-center">
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    BINGO MULTIPLAYER
                </h1>
            </header>

            <div className="flex gap-4 justify-center mb-10">
                <button
                    onClick={() => setAktiverSpieler(1)}
                    className={`px-4 py-2 rounded-lg border-2 ${aktiverSpieler === 1 ? 'border-blue-500 bg-blue-900/30' : 'border-gray-700'}`}
                >
                    Spieler 1 (Blau)
                </button>
                <button
                    onClick={() => setAktiverSpieler(2)}
                    className={`px-4 py-2 rounded-lg border-2 ${aktiverSpieler === 2 ? 'border-red-500 bg-red-900/30' : 'border-gray-700'}`}
                >
                    Spieler 2 (Rot)
                </button>
            </div>

            <div className="max-w-md mx-auto grid grid-cols-5 gap-2">
                {felderStatus.map((status, i) => (
                    <button
                        key={i}
                        onClick={() => feldKlicken(i)}
                        className={`aspect-square rounded-md border border-gray-700 transition-all ${spielerFarben[status as keyof typeof spielerFarben]}`}
                    >
                        {}
                    </button>
                ))}
            </div>
        </main>
    );
}