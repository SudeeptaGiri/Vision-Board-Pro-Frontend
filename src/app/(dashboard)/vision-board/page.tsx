'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Plus,
  Image as ImageIcon,
  Type,
  Quote,
  Target,
  Loader2,
  Sparkles,
  Palette,
} from 'lucide-react';

// Lazy load heavy vision board components (drag-n-drop, image processing)
const VisionItem = dynamic(() => import('@/components/vision-board/vision-item').then(mod => ({ default: mod.VisionItem })), {
  loading: () => <div className="animate-pulse bg-warm-card dark:bg-warm-muted/30 rounded-xl h-32 w-32" />,
  ssr: false,
});

const ImageGallery = dynamic(() => import('@/components/vision-board/image-gallery').then(mod => ({ default: mod.ImageGallery })), {
  loading: () => <div className="animate-pulse bg-warm-card dark:bg-warm-muted/30 rounded-xl h-64" />,
  ssr: false,
});

interface VisionBoardData {
  id: string;
  title: string;
  description?: string;
  theme?: string;
  backgroundColor?: string;
  background?: string;
  items?: VisionItemData[];
}

interface VisionItemData {
  id: string;
  type: 'IMAGE' | 'TEXT' | 'QUOTE' | 'GOAL_CARD' | 'PROGRESS';
  title?: string;
  quote?: string;
  imageUrl?: string;
  imageKey?: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  rotation?: number;
  zIndex?: number;
  style?: any;
  goal?: {
    id: string;
    title: string;
    progress: number;
    type: string;
  };
}

const backgroundPresets = [
  {
    name: 'Warm Sunset',
    value: 'linear-gradient(135deg, #2d2418 0%, #d97757 50%, #f4e8d9 100%)',
  },
  {
    name: 'Purple Dream',
    value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  {
    name: 'Ocean Blue',
    value: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)',
  },
  {
    name: 'Forest',
    value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  },
  {
    name: 'Night Sky',
    value: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  },
  {
    name: 'Rose Gold',
    value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
];

export default function VisionBoardPage() {
  const [selectedBoard, setSelectedBoard] = useState<string>('');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [showGoalSelector, setShowGoalSelector] = useState(false);
  const queryClient = useQueryClient();

  // Fetch vision boards
  const { data: boards, isLoading: boardsLoading } = useQuery<VisionBoardData[]>({
    queryKey: ['vision-boards'],
    queryFn: async () => {
      const response = await api.get('/vision-boards');
      return response.data;
    },
  });

  // Set selected board when boards are loaded
  useEffect(() => {
    if (boards && boards.length > 0 && !selectedBoard) {
      setSelectedBoard(boards[0].id);
    }
  }, [boards, selectedBoard]);

  // Fetch selected board details
  const { data: board, isLoading: boardLoading } = useQuery<VisionBoardData>({
    queryKey: ['vision-board', selectedBoard],
    queryFn: async () => {
      const response = await api.get(`/vision-boards/${selectedBoard}`);
      return response.data;
    },
    enabled: !!selectedBoard,
  });

  // Fetch goals for adding to vision board
  const { data: goals } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const response = await api.get('/goals');
      return response.data;
    },
  });

  // Create board mutation
  const createBoardMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/vision-boards', {
        title: 'My Vision Board',
        background: backgroundPresets[0].value,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vision-boards'] });
      setSelectedBoard(data.id);
    },
  });

  // Add item mutation
  const addItemMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post(`/vision-boards/${selectedBoard}/items`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vision-board', selectedBoard] });
      setIsAddingItem(false);
    },
  });

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, data }: { itemId: string; data: any }) => {
      const response = await api.put(
        `/vision-boards/${selectedBoard}/items/${itemId}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vision-board', selectedBoard] });
    },
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await api.delete(`/vision-boards/${selectedBoard}/items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vision-board', selectedBoard] });
    },
  });

  // Update board background mutation
  const updateBackgroundMutation = useMutation({
    mutationFn: async (background: string) => {
      const response = await api.put(`/vision-boards/${selectedBoard}`, {
        background,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vision-board', selectedBoard] });
      setShowBackgroundPicker(false);
    },
  });

  // Handle adding image from gallery
  const handleAddImage = (imageUrl: string, imageKey: string) => {
    addItemMutation.mutate({
      type: 'IMAGE',
      imageUrl,
      imageKey,
      positionX: Math.random() * 300 + 50,
      positionY: Math.random() * 200 + 50,
      width: 200,
      height: 200,
    });
    setShowImageGallery(false);
  };

  // Handle item position update
  const handleDragStop = (itemId: string, position: { x: number; y: number }) => {
    updateItemMutation.mutate({
      itemId,
      data: { positionX: position.x, positionY: position.y },
    });
  };

  // Handle item resize
  const handleResize = (itemId: string, size: { width: number; height: number }) => {
    updateItemMutation.mutate({
      itemId,
      data: { width: size.width, height: size.height },
    });
  };

  // Add text item
  const addTextItem = () => {
    addItemMutation.mutate({
      type: 'TEXT',
      title: 'Double click to edit',
      positionX: Math.random() * 300 + 50,
      positionY: Math.random() * 200 + 50,
      width: 200,
      height: 100,
    });
    setIsAddingItem(false);
  };

  // Add quote item
  const addQuoteItem = () => {
    addItemMutation.mutate({
      type: 'QUOTE',
      quote: '"Your dreams are valid"',
      positionX: Math.random() * 300 + 50,
      positionY: Math.random() * 200 + 50,
      width: 300,
      height: 150,
    });
    setIsAddingItem(false);
  };

  // Add goal card
  const addGoalCard = (goalId: string) => {
    addItemMutation.mutate({
      type: 'GOAL_CARD',
      goalId,
      positionX: Math.random() * 300 + 50,
      positionY: Math.random() * 200 + 50,
      width: 250,
      height: 180,
    });
    setShowGoalSelector(false);
    setIsAddingItem(false);
  };

  // Get max z-index for bringing items to front
  const getMaxZIndex = () => {
    if (!board?.items || board.items.length === 0) return 1;
    return Math.max(...board.items.map((item) => item.zIndex || 1));
  };

  // Bring item to front
  const bringToFront = (itemId: string) => {
    const maxZ = getMaxZIndex();
    updateItemMutation.mutate({
      itemId,
      data: { zIndex: maxZ + 1 },
    });
  };

  if (boardsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
      </div>
    );
  }

  // No boards yet - show create prompt
  if (!boards || boards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Sparkles className="w-16 h-16 text-terracotta mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-warm-text dark:text-warm-bg">
          Create Your Vision Board
        </h2>
        <p className="text-warm-muted dark:text-warm-border mb-6 text-center max-w-md">
          Visualize your dreams and goals with a beautiful, interactive vision
          board
        </p>
        <Button
          onClick={() => createBoardMutation.mutate()}
          disabled={createBoardMutation.isPending}
          className="gradient-bg hover:opacity-90"
        >
          {createBoardMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          Create Vision Board
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-warm-text dark:text-warm-bg">
            Vision Board
          </h1>
          <p className="text-sm sm:text-base text-warm-muted dark:text-warm-border mt-1">
            Visualize your dreams and track your progress
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Background Picker */}
          <Dialog open={showBackgroundPicker} onOpenChange={setShowBackgroundPicker}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Palette className="w-4 h-4 mr-2" />
                Background
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Choose Background</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                {backgroundPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => updateBackgroundMutation.mutate(preset.value)}
                    disabled={updateBackgroundMutation.isPending}
                    className="h-24 rounded-xl transition-all hover:scale-105 hover:shadow-lg disabled:opacity-50"
                    style={{ background: preset.value }}
                  >
                    <span className="text-white font-medium text-sm drop-shadow-md">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          {/* Add Items */}
          <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
            <DialogTrigger asChild>
              <Button className="gradient-bg hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add to Vision Board</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                {/* Upload/Select Image */}
                <button
                  onClick={() => {
                    setIsAddingItem(false);
                    setShowImageGallery(true);
                  }}
                  className="flex flex-col items-center p-6 rounded-xl border-2 border-dashed border-warm-border dark:border-warm-muted hover:border-terracotta transition-colors"
                >
                  <ImageIcon className="w-8 h-8 text-terracotta dark:text-terracotta-light mb-2" />
                  <span className="font-medium text-warm-text dark:text-warm-bg">
                    Add Image
                  </span>
                  <span className="text-xs text-warm-muted dark:text-warm-border">
                    Upload or select
                  </span>
                </button>

                {/* Add Text */}
                <button
                  onClick={addTextItem}
                  className="flex flex-col items-center p-6 rounded-xl border-2 border-warm-border dark:border-warm-muted hover:border-terracotta transition-colors"
                >
                  <Type className="w-8 h-8 text-status-warning mb-2" />
                  <span className="font-medium text-warm-text dark:text-warm-bg">
                    Add Text
                  </span>
                  <span className="text-xs text-warm-muted dark:text-warm-border">
                    Custom text
                  </span>
                </button>

                {/* Add Quote */}
                <button
                  onClick={addQuoteItem}
                  className="flex flex-col items-center p-6 rounded-xl border-2 border-warm-border dark:border-warm-muted hover:border-terracotta transition-colors"
                >
                  <Quote className="w-8 h-8 text-status-alert mb-2" />
                  <span className="font-medium text-warm-text dark:text-warm-bg">
                    Add Quote
                  </span>
                  <span className="text-xs text-warm-muted dark:text-warm-border">
                    Inspirational quote
                  </span>
                </button>

                {/* Add Goal */}
                <button
                  onClick={() => setShowGoalSelector(!showGoalSelector)}
                  className={`flex flex-col items-center p-6 rounded-xl border-2 transition-colors ${
                    showGoalSelector 
                      ? 'border-terracotta bg-terracotta/10' 
                      : 'border-warm-border dark:border-warm-muted hover:border-terracotta'
                  }`}
                >
                  <Target className="w-8 h-8 text-sage mb-2" />
                  <span className="font-medium text-warm-text dark:text-warm-bg">
                    Link a Goal
                  </span>
                  <span className="text-xs text-warm-muted dark:text-warm-border">
                    Show goal progress
                  </span>
                </button>
              </div>

              {/* Goal Selection */}
              {showGoalSelector && goals && goals.length > 0 && (
                <div className="border-t border-warm-border dark:border-warm-muted pt-4">
                  <p className="text-sm font-medium mb-3 text-warm-text dark:text-warm-bg">
                    Select a goal to add:
                  </p>
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                    {goals.map((goal: any) => (
                      <button
                        key={goal.id}
                        onClick={() => addGoalCard(goal.id)}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-warm-card dark:hover:bg-warm-muted/30 text-left transition-colors"
                      >
                        <Target className="w-5 h-5 text-terracotta dark:text-terracotta-light" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-warm-text dark:text-warm-bg">
                            {goal.title}
                          </p>
                          <p className="text-xs text-warm-muted dark:text-warm-border">
                            {goal.progress}% complete
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Vision Board Canvas */}
      <div
        className="relative w-full min-h-[400px] sm:min-h-[600px] lg:min-h-[800px] rounded-xl sm:rounded-2xl overflow-hidden"
        style={{
          background:
            board?.background ||
            'linear-gradient(135deg, #2d2418 0%, #d97757 50%, #f4e8d9 100%)',
        }}
      >
        {/* Grid Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />

        {/* Vision Items */}
        {board?.items?.map((item: VisionItemData) => (
          <VisionItem
            key={item.id}
            item={item}
            onDragStop={(position) => handleDragStop(item.id, position)}
            onResize={(size) => handleResize(item.id, size)}
            onDelete={() => deleteItemMutation.mutate(item.id)}
            onUpdate={(data) =>
              updateItemMutation.mutate({ itemId: item.id, data })
            }
            onBringToFront={() => bringToFront(item.id)}
          />
        ))}

        {/* Empty State */}
        {(!board?.items || board.items.length === 0) && (
          <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
            <div className="text-center text-white">
              <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl sm:text-2xl font-bold mb-2">
                Your Vision Board is Empty
              </h3>
              <p className="text-sm sm:text-base opacity-75 mb-6">
                Add images, quotes, and goals to visualize your dreams
              </p>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {boardLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
        )}
      </div>

      {/* Image Gallery Modal */}
      <ImageGallery
        open={showImageGallery}
        onClose={() => setShowImageGallery(false)}
        onSelectImage={handleAddImage}
        visionBoardId={selectedBoard}
      />
    </div>
  );
}