import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Collaborator {
  id: string;
  name: string;
  color: string;
  avatar?: string;
}

interface CollaboratorPresenceProps {
  collaborators: Collaborator[];
  maxVisible?: number;
}

export function CollaboratorPresence({
  collaborators,
  maxVisible = 4,
}: CollaboratorPresenceProps) {
  const visible = collaborators.slice(0, maxVisible);
  const hidden = collaborators.slice(maxVisible);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">
        {collaborators.length} collaborator{collaborators.length !== 1 && "s"}
      </span>
      <div className="flex -space-x-2">
        {visible.map((collaborator) => (
          <Tooltip key={collaborator.id}>
            <TooltipTrigger asChild>
              <Avatar
                className="h-8 w-8 ring-2 ring-background cursor-pointer transition-transform hover:z-10 hover:scale-110"
                style={{ borderColor: collaborator.color }}
              >
                <AvatarFallback
                  style={{ backgroundColor: collaborator.color }}
                  className="text-xs font-medium text-white"
                >
                  {getInitials(collaborator.name)}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: collaborator.color }}
                />
                {collaborator.name}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
        {hidden.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="h-8 w-8 ring-2 ring-background cursor-pointer">
                <AvatarFallback className="bg-muted text-xs font-medium text-muted-foreground">
                  +{hidden.length}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <div className="space-y-1">
                {hidden.map((collaborator) => (
                  <div key={collaborator.id} className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: collaborator.color }}
                    />
                    {collaborator.name}
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
