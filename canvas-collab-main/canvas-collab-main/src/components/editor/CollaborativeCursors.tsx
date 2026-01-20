import { Collaborator } from "@/hooks/use-collaboration";
import { useEffect } from "react";

interface CollaborativeCursorsProps {
    collaborators: Collaborator[];
}

export function CollaborativeCursors({ collaborators }: CollaborativeCursorsProps) {
    // Debug: Log collaborators to see if cursor data is coming through
    useEffect(() => {
        if (collaborators.length > 0) {
            console.log("Collaborators with cursors:", collaborators);
        }
    }, [collaborators]);

    return (
        <>
            {collaborators.map((collaborator) => {
                if (!collaborator.cursor) return null;

                return (
                    <div
                        key={collaborator.id}
                        className="pointer-events-none fixed z-[9999] transition-all duration-100 ease-out"
                        style={{
                            left: `${collaborator.cursor.x}px`,
                            top: `${collaborator.cursor.y}px`,
                            transform: 'translate(-2px, -2px)', // Adjust for cursor tip
                        }}
                    >
                        {/* Cursor pointer */}
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}
                        >
                            <path
                                d="M5.65376 12.3673L11.6538 18.3673L13.6538 10.3673L19.6538 8.36729L5.65376 12.3673Z"
                                fill={collaborator.color}
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinejoin="round"
                            />
                        </svg>

                        {/* Name label */}
                        <div
                            className="ml-7 -mt-6 px-2.5 py-1 rounded-md text-xs font-semibold text-white whitespace-nowrap shadow-lg"
                            style={{
                                backgroundColor: collaborator.color,
                            }}
                        >
                            {collaborator.name}
                        </div>
                    </div>
                );
            })}
        </>
    );
}
