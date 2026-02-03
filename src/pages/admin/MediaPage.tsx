import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getMedia, addMedia, deleteMedia, deleteMediaByFilename } from '@/lib/api';
import { getUploadUrl } from '@/lib/apiClient';
import { formatFileSize, formatDate } from '@/lib/storage';
import { Media } from '@/types/blog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Upload,
  Search,
  Trash2,
  Copy,
  X,
  Image as ImageIcon,
  FileImage,
  Loader2,
} from 'lucide-react';

export default function MediaPage() {
  const { toast } = useToast();
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    getMedia().then((data) => {
      setMedia(data);
      setLoading(false);
    });
  }, []);

  const filteredMedia = media.filter(m =>
    m.filename.toLowerCase().includes(search.toLowerCase())
  );

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files) return;

    setUploading(true);

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Error', description: 'Only images are allowed', variant: 'destructive' });
        continue;
      }

      if (file.size > 50 * 1024 * 1024) {
        toast({ title: 'Error', description: `${file.name} is larger than 50MB`, variant: 'destructive' });
        continue;
      }

      try {
        // Get image dimensions
        const img = new window.Image();
        const url = URL.createObjectURL(file);

        await new Promise<void>((resolve) => {
          img.onload = async () => {
            try {
              const newMedia = await addMedia(file, img.width, img.height);
              setMedia(prev => [newMedia, ...prev]);
              toast({ title: 'Uploaded', description: `${file.name} has been uploaded.` });
            } catch (error) {
              toast({ title: 'Error', description: `Failed to upload ${file.name}`, variant: 'destructive' });
            }
            URL.revokeObjectURL(url);
            resolve();
          };
          img.src = url;
        });
      } catch (error) {
        toast({ title: 'Error', description: `Failed to upload ${file.name}`, variant: 'destructive' });
      }
    }

    setUploading(false);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const handleDelete = async () => {
    if (selectedMedia) {
      // Use the new Safe Delete by filename if available, or fallback to ID
      if (selectedMedia.filename) {
        await deleteMediaByFilename(selectedMedia.filename);
      } else {
        await deleteMedia(selectedMedia.id);
      }

      const updatedMedia = await getMedia();
      setMedia(updatedMedia);
      setSelectedMedia(null);
      toast({ title: 'Deleted', description: 'Image has been permanently deleted.' });
    }
    setDeleteDialogOpen(false);
  };

  const copyUrl = () => {
    if (selectedMedia) {
      const fullUrl = getUploadUrl(selectedMedia.url);
      navigator.clipboard.writeText(fullUrl);
      toast({ title: 'Copied', description: 'URL copied to clipboard.' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Media Library</h1>
          <p className="text-muted-foreground">Manage your uploaded images</p>
        </div>
        <label>
          <Button asChild disabled={uploading}>
            <span className="cursor-pointer">
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Upload
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
                disabled={uploading}
              />
            </span>
          </Button>
        </label>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Grid */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search media..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Upload Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <FileImage className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Drag and drop images here, or click Upload button
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Max file size: 50MB • JPG, PNG, WebP
            </p>
          </div>

          {/* Media Grid */}
          {filteredMedia.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No media found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredMedia.map((item) => (
                <div
                  key={item.id}
                  className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${selectedMedia?.id === item.id
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-transparent hover:border-muted-foreground/50'
                    }`}
                  onClick={() => setSelectedMedia(item)}
                >
                  <img
                    src={getUploadUrl(item.url)}
                    alt={item.filename}
                    className="w-full h-full object-cover"
                  />
                  {/* Hover Overlay with Delete Button */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8 w-auto px-3"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent opening details
                        setSelectedMedia(item);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Details</CardTitle>
              {selectedMedia && (
                <Button variant="ghost" size="icon" onClick={() => setSelectedMedia(null)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {selectedMedia ? (
                <div className="space-y-4">
                  <img
                    src={getUploadUrl(selectedMedia.url)}
                    alt={selectedMedia.filename}
                    className="w-full aspect-video object-contain bg-muted rounded-lg"
                  />
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Filename:</span>
                      <p className="font-medium truncate">{selectedMedia.filename}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Size:</span>
                      <p className="font-medium">{formatFileSize(selectedMedia.size)}</p>
                    </div>
                    {selectedMedia.width && selectedMedia.height && (
                      <div>
                        <span className="text-muted-foreground">Dimensions:</span>
                        <p className="font-medium">{selectedMedia.width} × {selectedMedia.height}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Uploaded:</span>
                      <p className="font-medium">{formatDate(selectedMedia.uploadedAt)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={copyUrl}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy URL
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Select an image to view details
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this image? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
