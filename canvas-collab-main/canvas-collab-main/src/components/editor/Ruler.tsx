import React, { useState, useRef, useEffect } from 'react';
import { cn } from "@/lib/utils";

interface RulerProps {
    onLayoutChange?: (layout: RulerLayout) => void;
}

export interface RulerLayout {
    leftMargin: number; // in mm
    rightMargin: number; // in mm
    firstLineIndent: number; // in mm
    hangingIndent: number; // in mm
}

export function Ruler({ onLayoutChange }: RulerProps) {
    const [layout, setLayout] = useState<RulerLayout>({
        leftMargin: 25,
        rightMargin: 25,
        firstLineIndent: 0,
        hangingIndent: 0,
    });

    const rulerRef = useRef<HTMLDivElement>(null);
    const [activeMarker, setActiveMarker] = useState<string | null>(null);

    const PAGE_WIDTH_MM = 210;
    const PIXELS_PER_MM = 3.78; // Approximate conversion for A4 width (794px / 210mm)

    const handleMouseDown = (marker: string) => (e: React.MouseEvent) => {
        setActiveMarker(marker);
        e.preventDefault();
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!activeMarker || !rulerRef.current) return;

            const rect = rulerRef.current.getBoundingClientRect();
            const offsetPx = e.clientX - rect.left;
            const offsetMm = offsetPx / PIXELS_PER_MM;

            const newLayout = { ...layout };

            switch (activeMarker) {
                case 'leftMargin':
                    newLayout.leftMargin = Math.max(0, Math.min(offsetMm, PAGE_WIDTH_MM - layout.rightMargin - 20));
                    break;
                case 'rightMargin':
                    const fromRightMm = PAGE_WIDTH_MM - offsetMm;
                    newLayout.rightMargin = Math.max(0, Math.min(fromRightMm, PAGE_WIDTH_MM - layout.leftMargin - 20));
                    break;
                case 'firstLineIndent':
                    newLayout.firstLineIndent = offsetMm - layout.leftMargin;
                    break;
                case 'hangingIndent':
                    newLayout.hangingIndent = offsetMm - layout.leftMargin;
                    break;
                case 'leftIndent':
                    const delta = offsetMm - (layout.leftMargin + layout.hangingIndent);
                    newLayout.hangingIndent += delta;
                    newLayout.firstLineIndent += delta;
                    break;
            }

            setLayout(newLayout);
            onLayoutChange?.(newLayout);
        };

        const handleMouseUp = () => {
            setActiveMarker(null);
        };

        if (activeMarker) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [activeMarker, layout, onLayoutChange]);

    return (
        <div className="relative h-10 w-[210mm] mx-auto bg-muted/30 border-b border-border select-none" ref={rulerRef}>
            {/* Scale Marks */}
            <div className="absolute inset-0 flex items-end pb-1 overflow-hidden">
                {Array.from({ length: 22 }).map((_, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center border-l border-border/50 h-2 relative">
                        <span className="absolute -top-4 text-[9px] text-muted-foreground font-medium">{i}</span>
                        {i < 21 && (
                            <div className="flex w-full justify-evenly">
                                <div className="border-l border-border/30 h-1" />
                                <div className="border-l border-border/30 h-1.5" />
                                <div className="border-l border-border/30 h-1" />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Margins Highlights */}
            <div
                className="absolute top-0 bottom-0 bg-background/50 border-r border-border/50"
                style={{ width: `${layout.leftMargin * PIXELS_PER_MM}px` }}
            />
            <div
                className="absolute top-0 bottom-0 right-0 bg-background/50 border-l border-border/50"
                style={{ width: `${layout.rightMargin * PIXELS_PER_MM}px` }}
            />

            {/* Left Margin Marker */}
            <div
                className="absolute bottom-0 w-1 cursor-col-resize z-20 hover:bg-primary group"
                style={{ left: `${layout.leftMargin * PIXELS_PER_MM}px`, height: '100%' }}
                onMouseDown={handleMouseDown('leftMargin')}
            >
                <div className="hidden group-hover:block absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-screen bg-primary/30 pointer-events-none" />
            </div>

            {/* Right Margin Marker */}
            <div
                className="absolute bottom-0 w-1 cursor-col-resize z-20 hover:bg-primary group"
                style={{ right: `${layout.rightMargin * PIXELS_PER_MM}px`, height: '100%' }}
                onMouseDown={handleMouseDown('rightMargin')}
            >
                <div className="hidden group-hover:block absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-screen bg-primary/30 pointer-events-none" />
            </div>

            {/* Indent Markers */}
            <div className="absolute bottom-0 left-0 right-0 h-4 pointer-events-none">
                {/* First Line Indent (Top Triangle Down) */}
                <div
                    className="absolute top-[-4px] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px] border-t-foreground cursor-pointer pointer-events-auto z-30"
                    style={{ left: `${(layout.leftMargin + layout.firstLineIndent) * PIXELS_PER_MM - 6}px` }}
                    onMouseDown={handleMouseDown('firstLineIndent')}
                />

                {/* Hanging Indent (Bottom Triangle Up) */}
                <div
                    className="absolute bottom-[2px] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-foreground cursor-pointer pointer-events-auto z-30"
                    style={{ left: `${(layout.leftMargin + layout.hangingIndent) * PIXELS_PER_MM - 6}px` }}
                    onMouseDown={handleMouseDown('hangingIndent')}
                />

                {/* Left Indent (Square - moves both indents together) */}
                <div
                    className="absolute bottom-[-10px] w-3 h-3 bg-foreground cursor-pointer pointer-events-auto z-30 opacity-80"
                    style={{ left: `${(layout.leftMargin + layout.hangingIndent) * PIXELS_PER_MM - 6}px` }}
                    onMouseDown={handleMouseDown('leftIndent')}
                />
            </div>
        </div>
    );
}
