'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Trash2,
  Plus,
  Loader2,
  Image as ImageIcon,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { ImageUploader } from './image-uploader';

interface ImageGalleryProps {
  open: boolean;
  onClose: () => void;
  onSelectImage: (url: string, key: string) => void;
  visionBoardId?: string;
}

export function ImageGallery({
  open,
  onClose,
  onSelectImage,
  visionBoardId,
}: ImageGalleryProps) {
  const [showUploader, setShowUploader] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    key: string;
  } | null>(null);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch user's images
  const { data: images, isLoading } = useQuery({
    queryKey: ['my-images', visionBoardId],
    queryFn: async () => {
      const params = visionBoardId ? `?visionBoardId=${visionBoardId}` : '';
      const response = await api.get(`/vision-boards/upload/my-images${params}`);
      return response.data;
    },
    enabled: open,
  });

  // Delete image mutation
  const deleteMutation = useMutation({
    mutationFn: async (imageId: string) => {
      await api.delete(`/vision-boards/upload/${imageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-images'] });
      setImageToDelete(null);
    },
  });

  const handleUploadComplete = (url: string, key: string) => {
    queryClient.invalidateQueries({ queryKey: ['my-images'] });
    setShowUploader(false);
    onSelectImage(url, key);
    onClose();
  };

  const handleSelectImage = () => {
    if (selectedImage) {
      onSelectImage(selectedImage.url, selectedImage.key);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedImage(null);
    setShowUploader(false);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-warm-text dark:text-warm-bg">
              {showUploader ? 'Upload New Image' : 'Image Gallery'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {/* Upload Section */}
            {showUploader ? (
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUploader(false)}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Back to Gallery
                  </Button>
                </div>
                <ImageUploader
                  onUploadComplete={handleUploadComplete}
                  visionBoardId={visionBoardId}
                />
              </div>
            ) : (
              <div className="p-4">
                {/* Upload Button */}
                <Button
                  onClick={() => setShowUploader(true)}
                  className="w-full mb-4 gradient-bg hover:opacity-90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Upload New Image
                </Button>

                {/* Image Grid */}
                {isLoading ? (
                  <div className="flex items-center justify-center h-48">
                    <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
                  </div>
                ) : images && images.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {images.map((image: any) => (
                      <div
                        key={image.id}
                        className={cn(
                          'relative aspect-square rounded-xl overflow-hidden cursor-pointer group border-2 transition-all',
                          selectedImage?.url === image.url
                            ? 'border-terracotta ring-2 ring-terracotta ring-offset-2'
                            : 'border-transparent hover:border-terracotta/50'
                        )}
                        onClick={() =>
                          setSelectedImage({ url: image.url, key: image.key })
                        }
                      >
                        <img
                          src={image.url}
                          alt={image.fileName || 'Uploaded image'}
                          className="w-full h-full object-cover"
                        />

                        {/* Selection Indicator */}
                        {selectedImage?.url === image.url && (
                          <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-terracotta flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setImageToDelete(image.id);
                          }}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-status-alert text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-status-alert/80"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-warm-muted">
                    <ImageIcon className="w-12 h-12 mb-3 opacity-50" />
                    <p className="font-medium">No images uploaded yet</p>
                    <p className="text-sm">Upload your first image to get started</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {!showUploader && images && images.length > 0 && (
            <div className="border-t border-warm-border dark:border-warm-muted p-4 flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSelectImage}
                disabled={!selectedImage}
                className="gradient-bg hover:opacity-90"
              >
                Use Selected Image
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!imageToDelete}
        onOpenChange={() => setImageToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the image from your gallery and S3
              storage. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => imageToDelete && deleteMutation.mutate(imageToDelete)}
              className="bg-status-alert hover:bg-status-alert/80"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}