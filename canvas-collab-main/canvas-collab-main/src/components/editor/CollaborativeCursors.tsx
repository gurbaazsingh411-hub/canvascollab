import { Collaborator } from "@/hooks/use-collaboration";

interface CollaborativeCursorsProps {
    collaborators: Collaborator[];
}

export function CollaborativeCursors({ collaborators }: CollaborativeCursorsProps) {
    return (
        <>
            {collaborators.map((collaborator) => {
                if (!collaborator.cursor) return null;

                return (
                    <div
                        key={collaborator.id}
                        className="pointer-events-none fixed z-50 transition-all duration-100"
                        style={{
                            left: `${collaborator.cursor.x}px`,
                            top: `${collaborator.cursor.y}px`,
                        }}
                    >
                        {/* Cursor pointer */}
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
                        >
                            <path
                                d="M5.65376 12.3673L11.6538 18.3673L13.6538 10.3673L19.6538 8.36729L5.65376 12.3673Z"
                                fill={collaborator.color}
                                stroke="white"
                                strokeWidth="1.5"
                            />
                        </svg>

                        {/* Name label */}
                        <div
                            className="ml-6 -mt-5 px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap"
                            style={{
                                backgroundColor: collaborator.color,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
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
