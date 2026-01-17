'use client';

import { useState, useRef } from 'react';
import Draggable from 'react-draggable';
import { Resizable } from 're-resizable';
import { cn } from '@/lib/utils';
import { Trash2, Move, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';

interface VisionItemProps {
  item: {
    id: string;
    type: 'IMAGE' | 'TEXT' | 'QUOTE' | 'GOAL_CARD' | 'PROGRESS';
    title?: string;
    imageUrl?: string;
    quote?: string;
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
  };
  onDragStop: (position: { x: number; y: number }) => void;
  onResize: (size: { width: number; height: number }) => void;
  onDelete: () => void;
  onUpdate: (data: any) => void;
  onBringToFront: () => void;
}

export function VisionItem({
  item,
  onDragStop,
  onResize,
  onDelete,
  onUpdate,
  onBringToFront,
}: VisionItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [editValue, setEditValue] = useState(item.title || item.quote || '');
  const nodeRef = useRef(null);
  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Show controls on touch or hover
  const showControls = isHovered || isTouched;

  // Handle touch start - show controls and bring to front
  const handleTouchStart = () => {
    onBringToFront();
    setIsTouched(true);
    // Clear any existing timeout
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
    }
  };

  // Handle touch end - hide controls after delay
  const handleTouchEnd = () => {
    touchTimeoutRef.current = setTimeout(() => {
      setIsTouched(false);
    }, 3000); // Keep controls visible for 3 seconds after touch
  };

  // Handle mouse down - bring to front
  const handleMouseDown = () => {
    onBringToFront();
  };

  const handleSave = () => {
    if (item.type === 'QUOTE') {
      onUpdate({ quote: editValue });
    } else {
      onUpdate({ title: editValue });
    }
    setIsEditing(false);
  };

  const renderContent = () => {
    switch (item.type) {
      case 'IMAGE':
        return (
          <img
            src={item.imageUrl}
            alt=""
            className="w-full h-full object-cover rounded-xl"
            draggable={false}
          />
        );

      case 'TEXT':
        if (isEditing) {
          return (
            <div className="p-4 h-full">
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full h-full resize-none bg-transparent border-none focus:ring-0 text-white text-lg"
                autoFocus
              />
            </div>
          );
        }
        return (
          <div
            className="p-4 h-full flex items-center justify-center text-white text-lg font-medium text-center"
            onDoubleClick={() => setIsEditing(true)}
          >
            {item.title}
          </div>
        );

      case 'QUOTE':
        if (isEditing) {
          return (
            <div className="p-6 h-full">
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full h-full resize-none bg-transparent border-none focus:ring-0 text-white text-xl italic"
                autoFocus
              />
            </div>
          );
        }
        return (
          <div
            className="p-6 h-full flex items-center justify-center"
            onDoubleClick={() => setIsEditing(true)}
          >
            <p className="text-white text-xl italic text-center font-serif">
              {item.quote}
            </p>
          </div>
        );

      case 'GOAL_CARD':
        if (!item.goal) return null;
        return (
          <div className="p-4 h-full flex flex-col justify-between">
            <div>
              <p className="text-xs text-white/70 font-medium uppercase tracking-wide mb-1">
                {item.goal.type}
              </p>
              <h4 className="font-semibold text-white line-clamp-2">
                {item.goal.title}
              </h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Progress</span>
                <span className="font-medium text-white">{item.goal.progress}%</span>
              </div>
              <Progress value={item.goal.progress} className="h-2 bg-white/20" aria-label={`${item.goal.title} progress: ${item.goal.progress}%`} />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      defaultPosition={{ x: item.positionX, y: item.positionY }}
      onStop={(e, data) => onDragStop({ x: data.x, y: data.y })}
      handle=".drag-handle"
      bounds="parent"
    >
      <div
        ref={nodeRef}
        className="absolute touch-none"
        style={{ zIndex: item.zIndex || 1 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Resizable
          defaultSize={{ width: item.width, height: item.height }}
          onResizeStop={(e, direction, ref, d) => {
            onResize({
              width: item.width + d.width,
              height: item.height + d.height,
            });
          }}
          minWidth={80}
          minHeight={60}
          className={cn(
            'relative rounded-xl overflow-hidden shadow-lg transition-shadow',
            showControls && 'shadow-2xl ring-2 ring-white/50',
            item.type !== 'IMAGE' && 'bg-black/30 backdrop-blur-sm'
          )}
          style={{
            transform: item.rotation ? `rotate(${item.rotation}deg)` : undefined,
          }}
        >
          {/* Content */}
          {renderContent()}

          {/* Controls - Always visible on touch, hover on desktop */}
          {showControls && (
            <div className="absolute top-1 right-1 sm:top-2 sm:right-2 flex items-center gap-1">
              {isEditing ? (
                <>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7 sm:h-8 sm:w-8"
                    onClick={handleSave}
                  >
                    <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7 sm:h-8 sm:w-8"
                    onClick={() => setIsEditing(false)}
                  >
                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7 sm:h-8 sm:w-8 drag-handle cursor-move"
                  >
                    <Move className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                  {(item.type === 'TEXT' || item.type === 'QUOTE') && (
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-7 w-7 sm:h-8 sm:w-8"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-7 w-7 sm:h-8 sm:w-8"
                    onClick={onDelete}
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </>
              )}
            </div>
          )}
        </Resizable>
      </div>
    </Draggable>
  );
}