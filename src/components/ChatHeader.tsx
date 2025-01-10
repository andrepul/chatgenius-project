import { Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatHeaderProps {
  displayName: string;
  searchQuery: string;
  searchScope: "channel" | "global";
  onSearchQueryChange: (query: string) => void;
  onSearchScopeChange: (scope: "channel" | "global") => void;
}

const ChatHeader = ({
  displayName,
  searchQuery,
  searchScope,
  onSearchQueryChange,
  onSearchScopeChange,
}: ChatHeaderProps) => {
  return (
    <div className="p-4 border-b flex justify-between items-center">
      <h1 className="text-xl font-semibold">{displayName}</h1>
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="pl-9 pr-4 py-2 border rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md">
            {searchScope === "channel" ? "This Channel" : "All Channels"}
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onSearchScopeChange("channel")}>
              This Channel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSearchScopeChange("global")}>
              All Channels
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default ChatHeader;