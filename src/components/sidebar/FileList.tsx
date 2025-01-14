import { Download, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

interface FileData {
  id: string;
  name: string;
  storage_path: string;
  type: string;
  size: number;
  uploaded_by: string;
  created_at: string;
}

interface FileListProps {
  files: FileData[];
  currentUser?: string;
  onFilesClick: () => void;
  onDeleteFile: (fileId: string, storagePath: string) => void;
}

const FileList = ({ files, currentUser, onFilesClick, onDeleteFile }: FileListProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { toast } = useToast();

  const handleFileClick = async (file: FileData) => {
    try {
      const { data: { signedUrl }, error } = await supabase
        .storage
        .from('files')
        .createSignedUrl(file.storage_path, 3600);

      if (error) throw error;
      window.open(signedUrl, '_blank');
    } catch (error) {
      console.error('Error accessing file:', error);
      toast({
        title: "Error",
        description: "Failed to access file",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4">
      <button
        onClick={() => {
          setIsExpanded(!isExpanded);
          if (!isExpanded) {
            onFilesClick();
          }
        }}
        className="flex items-center justify-between w-full text-sm font-semibold text-gray-600"
      >
        <div className="flex items-center space-x-2">
          <Download size={18} />
          <span>Files</span>
        </div>
        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </button>

      {isExpanded && (
        <div className="mt-1 space-y-1">
          {files.length === 0 ? (
            <p className="px-4 py-2 text-sm text-gray-500">No files shared yet</p>
          ) : (
            files.map((file) => (
              <div key={file.id} className="group relative">
                <div className="flex items-center justify-between px-4 py-1 text-sm text-gray-600 hover:bg-gray-100">
                  <button
                    onClick={() => handleFileClick(file)}
                    className="flex-1 truncate hover:text-blue-600"
                  >
                    {file.name}
                  </button>
                  {file.uploaded_by === currentUser && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this file?')) {
                          onDeleteFile(file.id, file.storage_path);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 transition-opacity"
                      title="Delete file"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default FileList;