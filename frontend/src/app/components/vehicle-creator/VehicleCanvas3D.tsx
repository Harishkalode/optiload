import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useTheme } from '../../contexts/ThemeContext';
import { VehicleConfig } from '../../pages/VehicleCreator';
import { RotateCcw, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

type CameraView = 'isometric' | 'front' | 'side' | 'top';

interface Props {
  vehicle: VehicleConfig;
}

export function VehicleCanvas3D({ vehicle }: Props) {
  const { isDark, palette } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraView, setCameraView] = useState<CameraView>('isometric');
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>();

  const bg = isDark ? '#060B10' : '#F8FAFC';
  const gridColor = isDark ? '#1E2A38' : '#E2E8F0';
  const railColor = isDark ? '#475569' : '#94A3B8';
  const text = isDark ? '#94A3B8' : '#64748B';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const render = () => {
      const width = rect.width;
      const height = rect.height;

      // Clear
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Draw grid
      drawGrid(ctx, width, height, gridColor);

      // Draw rails
      drawRails(ctx, width, height, railColor);

      // Draw vehicle
      drawVehicle(ctx, width, height, vehicle, cameraView, zoom, rotation, isDark, palette);

      // Draw overlays
      drawOverlays(ctx, width, height, vehicle, isDark, palette);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [vehicle, cameraView, zoom, rotation, isDark, palette, bg, gridColor, railColor]);

  const resetCamera = () => {
    setCameraView('isometric');
    setZoom(1);
    setRotation({ x: 0, y: 0 });
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Camera Controls */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        {(['isometric', 'front', 'side', 'top'] as CameraView[]).map(view => (
          <button
            key={view}
            onClick={() => setCameraView(view)}
            className="px-3 py-1.5 rounded-lg transition-all text-xs font-semibold uppercase tracking-wide"
            style={{
              background: cameraView === view ? palette.primary : (isDark ? '#1E2A38' : '#ffffff'),
              color: cameraView === view ? '#ffffff' : text,
              border: `1px solid ${isDark ? '#1E2A38' : '#E2E8F0'}`,
            }}
          >
            {view}
          </button>
        ))}
      </div>

      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={() => setZoom(z => Math.min(z + 0.2, 3))}
          className="p-2 rounded-lg transition-all"
          style={{
            background: isDark ? '#1E2A38' : '#ffffff',
            color: text,
            border: `1px solid ${isDark ? '#1E2A38' : '#E2E8F0'}`,
          }}
        >
          <ZoomIn size={18} />
        </button>
        <button
          onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}
          className="p-2 rounded-lg transition-all"
          style={{
            background: isDark ? '#1E2A38' : '#ffffff',
            color: text,
            border: `1px solid ${isDark ? '#1E2A38' : '#E2E8F0'}`,
          }}
        >
          <ZoomOut size={18} />
        </button>
        <button
          onClick={resetCamera}
          className="p-2 rounded-lg transition-all"
          style={{
            background: isDark ? '#1E2A38' : '#ffffff',
            color: text,
            border: `1px solid ${isDark ? '#1E2A38' : '#E2E8F0'}`,
          }}
        >
          <RotateCcw size={18} />
        </button>
      </div>

      {/* Vehicle Info Overlay */}
      <div className="absolute bottom-4 left-4 z-10 px-4 py-2 rounded-lg" style={{ background: isDark ? '#0D1117CC' : '#ffffffCC', backdropFilter: 'blur(8px)', border: `1px solid ${isDark ? '#1E2A38' : '#E2E8F0'}` }}>
        <div style={{ fontSize: '11px', color: text, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
          Vehicle Dimensions
        </div>
        <div className="flex items-center gap-4" style={{ fontSize: '13px', color: isDark ? '#F1F5F9' : '#0F172A', fontWeight: 600 }}>
          <div>L: {Math.round(vehicle.length / 12)}'</div>
          <div>W: {Math.round(vehicle.width / 12)}'</div>
          <div>H: {Math.round(vehicle.height / 12)}'</div>
          <div>|</div>
          <div>{vehicle.type.charAt(0).toUpperCase() + vehicle.type.slice(1)}</div>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ cursor: 'grab' }}
      />
    </div>
  );
}

// Helper function to draw grid
function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  const spacing = 40;

  for (let x = 0; x < width; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = 0; y < height; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

// Helper function to draw rails
function drawRails(ctx: CanvasRenderingContext2D, width: number, height: number, color: string) {
  const centerY = height / 2 + 80;
  const railSpacing = 60;

  ctx.strokeStyle = color;
  ctx.lineWidth = 4;

  // Left rail
  ctx.beginPath();
  ctx.moveTo(0, centerY - railSpacing);
  ctx.lineTo(width, centerY - railSpacing);
  ctx.stroke();

  // Right rail
  ctx.beginPath();
  ctx.moveTo(0, centerY + railSpacing);
  ctx.lineTo(width, centerY + railSpacing);
  ctx.stroke();

  // Ties
  ctx.lineWidth = 3;
  for (let x = 0; x < width; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, centerY - railSpacing - 10);
    ctx.lineTo(x, centerY + railSpacing + 10);
    ctx.stroke();
  }
}

// Helper function to draw vehicle in isometric view
function drawVehicle(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  vehicle: VehicleConfig,
  view: CameraView,
  zoom: number,
  rotation: { x: number; y: number },
  isDark: boolean,
  palette: any
) {
  const centerX = width / 2;
  const centerY = height / 2;

  // Scale based on vehicle length
  const scale = (Math.min(width, height) * 0.4 * zoom) / vehicle.length;

  ctx.save();
  ctx.translate(centerX, centerY);

  if (view === 'isometric') {
    // Isometric projection
    const isoScale = 0.6;
    const vehicleWidth = vehicle.width * scale * isoScale;
    const vehicleLength = vehicle.length * scale;
    const vehicleHeight = vehicle.height * scale * isoScale;

    // Draw base (floor)
    ctx.fillStyle = isDark ? '#1E2A38' : '#CBD5E1';
    ctx.beginPath();
    ctx.moveTo(-vehicleLength / 2, 0);
    ctx.lineTo(-vehicleLength / 2 + vehicleWidth * 0.5, -vehicleWidth * 0.5);
    ctx.lineTo(vehicleLength / 2 + vehicleWidth * 0.5, -vehicleWidth * 0.5);
    ctx.lineTo(vehicleLength / 2, 0);
    ctx.closePath();
    ctx.fill();

    // Draw left side
    const sideGradient = ctx.createLinearGradient(0, 0, 0, vehicleHeight);
    sideGradient.addColorStop(0, isDark ? '#334155' : '#94A3B8');
    sideGradient.addColorStop(1, isDark ? '#1E293B' : '#64748B');
    ctx.fillStyle = sideGradient;
    ctx.beginPath();
    ctx.moveTo(-vehicleLength / 2, 0);
    ctx.lineTo(-vehicleLength / 2, -vehicleHeight);
    ctx.lineTo(vehicleLength / 2, -vehicleHeight);
    ctx.lineTo(vehicleLength / 2, 0);
    ctx.closePath();
    ctx.fill();

    // Draw right side (top)
    const topGradient = ctx.createLinearGradient(0, -vehicleHeight, vehicleWidth * 0.5, -vehicleHeight - vehicleWidth * 0.5);
    topGradient.addColorStop(0, isDark ? '#475569' : '#CBD5E1');
    topGradient.addColorStop(1, isDark ? '#334155' : '#94A3B8');
    ctx.fillStyle = topGradient;
    ctx.beginPath();
    ctx.moveTo(-vehicleLength / 2, -vehicleHeight);
    ctx.lineTo(-vehicleLength / 2 + vehicleWidth * 0.5, -vehicleHeight - vehicleWidth * 0.5);
    ctx.lineTo(vehicleLength / 2 + vehicleWidth * 0.5, -vehicleHeight - vehicleWidth * 0.5);
    ctx.lineTo(vehicleLength / 2, -vehicleHeight);
    ctx.closePath();
    ctx.fill();

    // Draw edge highlights
    ctx.strokeStyle = palette.primary + '80';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-vehicleLength / 2, 0);
    ctx.lineTo(-vehicleLength / 2, -vehicleHeight);
    ctx.lineTo(vehicleLength / 2, -vehicleHeight);
    ctx.lineTo(vehicleLength / 2, 0);
    ctx.stroke();

    // Draw bogies/wheels
    vehicle.bogies.forEach(bogie => {
      const bogieX = -vehicleLength / 2 + (bogie.position / 100) * vehicleLength;
      const wheelRadius = 8;
      const wheelSpacing = 20;

      for (let i = 0; i < bogie.axleCount; i++) {
        const offsetX = (i - (bogie.axleCount - 1) / 2) * wheelSpacing;
        
        // Left wheel
        ctx.fillStyle = isDark ? '#64748B' : '#475569';
        ctx.beginPath();
        ctx.arc(bogieX + offsetX, 0, wheelRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = palette.accent;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Right wheel
        ctx.beginPath();
        ctx.arc(bogieX + offsetX + vehicleWidth * 0.5, -vehicleWidth * 0.5, wheelRadius * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Axle bars
      ctx.strokeStyle = isDark ? '#94A3B8' : '#64748B';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(bogieX - wheelSpacing, 0);
      ctx.lineTo(bogieX + wheelSpacing, 0);
      ctx.stroke();
    });

    // Draw vehicle type specific details
    if (vehicle.type === 'boxcar') {
      // Draw door
      const doorX = -vehicleLength / 2 + (vehicle.doorPosition / 100) * vehicleLength;
      const doorWidth = vehicleLength * 0.15;
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = 3;
      ctx.strokeRect(doorX - doorWidth / 2, -vehicleHeight * 0.8, doorWidth, vehicleHeight * 0.7);
    }
  }

  ctx.restore();
}

// Helper function to draw validation overlays
function drawOverlays(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  vehicle: VehicleConfig,
  isDark: boolean,
  palette: any
) {
  const centerX = width / 2;
  const centerY = height / 2;
  const scale = (Math.min(width, height) * 0.4) / vehicle.length;
  const vehicleLength = vehicle.length * scale;

  // Draw CG marker
  const cgX = centerX; // Centered for empty vehicle
  const cgY = centerY - 50;

  ctx.fillStyle = palette.success;
  ctx.beginPath();
  ctx.arc(cgX, cgY, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = palette.success;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(cgX, cgY);
  ctx.lineTo(cgX, centerY + 100);
  ctx.stroke();
  ctx.setLineDash([]);

  // CG label
  ctx.fillStyle = isDark ? '#0D1117' : '#ffffff';
  ctx.fillRect(cgX - 30, cgY - 30, 60, 20);
  ctx.strokeStyle = palette.success;
  ctx.lineWidth = 1;
  ctx.strokeRect(cgX - 30, cgY - 30, 60, 20);
  ctx.fillStyle = palette.success;
  ctx.font = '600 11px Inter';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CG: 85"', cgX, cgY - 20);
}
