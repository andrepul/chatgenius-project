import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

const SidebarHeader = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="h-16 px-4 border-b flex items-center flex-shrink-0">
      <Popover>
        <PopoverTrigger className="w-full">
          <button className="w-full text-left font-semibold flex items-center justify-between text-secondary-foreground hover:bg-chat-hover rounded p-2">
            <span>ChatGenius Community</span>
            <ChevronDown size={18} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 bg-background/95">
          <div className="py-1">
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-accent"
            >
              Logout
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default SidebarHeader;