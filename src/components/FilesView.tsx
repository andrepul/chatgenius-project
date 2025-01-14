import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Download, Trash2 } from "lucide-react";

interface FilesViewProps {
  currentUser?: string;
}

interface FileData {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploaded_by: string;
  created_at: string;
  storage_path: string;
}

export default function FilesView({ currentUser }: FilesViewProps) {
  const [files, setFiles] = useState<FileData[]>([]);
  const { toast } = useToast();

  const fetchFiles = async () => {
    try {
      const { data: filesData, error } = await supabase
        .from('files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Generate signed URLs for each file
      const filesWithUrls = await Promise.all(
        (filesData || []).map(async (file) => {
          const { data: { signedUrl }, error: signedUrlError } = await supabase
            .storage
            .from('files')
            .createSignedUrl(file.storage_path, 3600);

          if (signedUrlError) throw signedUrlError;

          return {
            ...file,
            url: signedUrl
          };
        })
      );

      setFiles(filesWithUrls || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast({
        title: "Error",
        description: "Failed to load files",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFile = async (fileId: string, storagePath: string) => {
    try {
      // Delete from storage first
      const { error: storageError } = await supabase
        .storage
        .from('files')
        .remove([storagePath]);

      if (storageError) throw storageError;

      // Then delete from database
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .match({ id: fileId });

      if (dbError) throw dbError;

      setFiles(files.filter(file => file.id !== fileId));
      toast({
        title: "Success",
        description: "File deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchFiles();
    
    const filesSubscription = supabase
      .channel('files')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'files' }, () => {
        fetchFiles();
      })
      .subscribe();

    return () => {
      filesSubscription.unsubscribe();
    };
  }, []);

  return (
    <div className="flex-1 p-4">
      <h2 className="text-2xl font-bold mb-4">Files</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {files.map((file) => (
          <div key={file.id} className="group relative bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 flex-1 truncate"
              >
                <Download size={20} />
                <span className="truncate">{file.name}</span>
              </a>
              {file.uploaded_by === currentUser && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete this file?')) {
                      handleDeleteFile(file.id, file.storage_path);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 transition-opacity"
                  title="Delete file"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {new Date(file.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
        {files.length === 0 && (
          <p className="text-gray-500 col-span-full text-center py-8">
            No files shared yet
          </p>
        )}
      </div>
    </div>
  );
} 