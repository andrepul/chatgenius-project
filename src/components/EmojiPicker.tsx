import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Smile } from "lucide-react";

const commonEmojis = ["👍", "❤️", "😂", "🎉", "🚀", "👀", "💯"];

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

const EmojiPicker = ({ onEmojiSelect }: EmojiPickerProps) => {
  return (
    <Popover>
      <PopoverTrigger>
        <Smile className="h-4 w-4 text-muted-foreground hover:text-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-full p-2">
        <div className="flex flex-wrap gap-2">
          {commonEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onEmojiSelect(emoji)}
              className="hover:bg-accent p-1 rounded"
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EmojiPicker; 