import { ChevronDown } from "lucide-react";

const SidebarHeader = () => {
  return (
    <div className="p-4 border-b flex-shrink-0">
      <button className="w-full text-left font-semibold flex items-center justify-between text-secondary-foreground hover:bg-chat-hover rounded p-2">
        <span>ChatGenius Community</span>
        <ChevronDown size={18} />
      </button>
    </div>
  );
};

export default SidebarHeader;