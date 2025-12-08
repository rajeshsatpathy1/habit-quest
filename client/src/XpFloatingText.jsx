import React, { useEffect, useState } from 'react';

export default function XpFloatingText({ amount, onComplete }) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            if (onComplete) onComplete();
        }, 1000); // Animation duration

        return () => clearTimeout(timer);
    }, [onComplete]);

    if (!visible) return null;

    return (
        <div
            className="fixed inset-0 pointer-events-none flex items-center justify-center z-50"
            style={{ animation: 'floatUp 1s ease-out forwards' }}
        >
            <style>
                {`
                    @keyframes floatUp {
                        0% { transform: translateY(0) scale(0.5); opacity: 0; }
                        20% { transform: translateY(-20px) scale(1.2); opacity: 1; }
                        100% { transform: translateY(-100px) scale(1); opacity: 0; }
                    }
                `}
            </style>
            <div className="text-4xl font-black text-yellow-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] stroke-black"
                style={{ textShadow: '0 0 10px rgba(250, 204, 21, 0.5)' }}>
                +{amount} XP
            </div>
        </div>
    );
}
