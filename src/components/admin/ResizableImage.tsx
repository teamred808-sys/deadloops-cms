import { useCallback, useEffect, useRef, useState } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type Alignment = 'left' | 'center' | 'right';

export default function ResizableImage({ node, updateAttributes, selected, editor }: NodeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [resizing, setResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<'left' | 'right' | null>(null);
  const initialData = useRef({ width: 0, mouseX: 0 });

  const width = node.attrs.width || '100%';
  const align = (node.attrs.align || 'center') as Alignment;
  const src = node.attrs.src;
  const alt = node.attrs.alt || '';

  // Parse width to number for slider
  const getWidthPercent = useCallback(() => {
    if (typeof width === 'string') {
      if (width.endsWith('%')) {
        return parseInt(width, 10);
      }
      if (width.endsWith('px') && containerRef.current?.parentElement) {
        const parentWidth = containerRef.current.parentElement.offsetWidth;
        const pxValue = parseInt(width, 10);
        return Math.round((pxValue / parentWidth) * 100);
      }
    }
    return typeof width === 'number' ? width : 100;
  }, [width]);

  const [sliderValue, setSliderValue] = useState(getWidthPercent());

  useEffect(() => {
    setSliderValue(getWidthPercent());
  }, [getWidthPercent]);

  // Handle resize start
  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent, handle: 'left' | 'right') => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!imageRef.current) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    initialData.current = {
      width: imageRef.current.offsetWidth,
      mouseX: clientX,
    };
    
    setResizing(true);
    setResizeHandle(handle);
  }, []);

  // Handle resize move
  useEffect(() => {
    if (!resizing) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.parentElement) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const deltaX = clientX - initialData.current.mouseX;
      
      // Calculate new width based on which handle is being dragged
      let newWidth: number;
      if (resizeHandle === 'right') {
        newWidth = initialData.current.width + deltaX;
      } else {
        newWidth = initialData.current.width - deltaX;
      }

      // Constrain to min/max
      const parentWidth = containerRef.current.parentElement.offsetWidth;
      const minWidth = 100;
      const maxWidth = parentWidth;
      
      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      
      // Convert to percentage
      const percentWidth = Math.round((newWidth / parentWidth) * 100);
      
      setSliderValue(percentWidth);
      updateAttributes({ width: `${percentWidth}%` });
    };

    const handleEnd = () => {
      setResizing(false);
      setResizeHandle(null);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [resizing, resizeHandle, updateAttributes]);

  // Handle alignment change
  const handleAlign = useCallback((newAlign: Alignment) => {
    updateAttributes({ align: newAlign });
  }, [updateAttributes]);

  // Handle slider change
  const handleSliderChange = useCallback((value: number[]) => {
    const newWidth = value[0];
    setSliderValue(newWidth);
    updateAttributes({ width: `${newWidth}%` });
  }, [updateAttributes]);

  // Alignment classes for the wrapper (using flexbox)
  const wrapperAlignmentClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  const isEditable = editor?.isEditable;

  return (
    <NodeViewWrapper className={cn("relative my-4 flex", wrapperAlignmentClasses[align])}>
      <div
        ref={containerRef}
        className={cn(
          'relative inline-block max-w-full transition-all',
          selected && isEditable && 'ring-2 ring-primary ring-offset-2'
        )}
        style={{ width }}
      >
        {/* Image */}
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          className="block h-auto max-w-full rounded-lg"
          draggable={false}
        />

        {/* Resize Handles - Only show when selected and editable */}
        {selected && isEditable && (
          <>
            {/* Left Handle */}
            <div
              className="absolute left-0 top-0 bottom-0 w-3 cursor-col-resize flex items-center justify-center group"
              onMouseDown={(e) => handleResizeStart(e, 'left')}
              onTouchStart={(e) => handleResizeStart(e, 'left')}
            >
              <div className="w-1 h-12 max-h-[50%] bg-primary/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Right Handle */}
            <div
              className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize flex items-center justify-center group"
              onMouseDown={(e) => handleResizeStart(e, 'right')}
              onTouchStart={(e) => handleResizeStart(e, 'right')}
            >
              <div className="w-1 h-12 max-h-[50%] bg-primary/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </>
        )}

        {/* Floating Toolbar - Only show when selected and editable */}
        {selected && isEditable && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 bg-popover border border-border rounded-lg shadow-lg z-50 animate-fade-in">
            {/* Alignment Buttons */}
            <Button
              variant={align === 'left' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => handleAlign('left')}
              title="Align left"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant={align === 'center' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => handleAlign('center')}
              title="Align center"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant={align === 'right' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => handleAlign('right')}
              title="Align right"
            >
              <AlignRight className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Width Slider */}
            <div className="flex items-center gap-2 px-2">
              <span className="text-xs text-muted-foreground w-8">{sliderValue}%</span>
              <Slider
                value={[sliderValue]}
                onValueChange={handleSliderChange}
                min={10}
                max={100}
                step={1}
                className="w-24"
              />
            </div>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}
