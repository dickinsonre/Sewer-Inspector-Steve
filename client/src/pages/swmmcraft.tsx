import { useRef, useEffect, useState, useCallback } from 'react';

interface Node {
  id: string;
  type: 'junction' | 'outfall' | 'storage';
  x: number;
  y: number;
  depth: number;
  maxDepth: number;
  invert: number;
}

interface Conduit {
  id: string;
  from: string;
  to: string;
  diameter: number;
  flow: number;
  maxFlow: number;
}

interface Steve {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  direction: 'left' | 'right';
  state: 'walking' | 'idle' | 'inspecting';
  animFrame: number;
  inspectingNode: Node | null;
  speechBubble: string;
  speechTimer: number;
}

interface UIState {
  zoom: number;
  panX: number;
  panY: number;
  isNight: boolean;
  showGrid: boolean;
  selectedTool: string;
  is3D: boolean;
  simTime: number;
  isPlaying: boolean;
}

const INITIAL_NODES: Node[] = [
  { id: 'J1', type: 'junction', x: 150, y: 200, depth: 2.5, maxDepth: 6, invert: 100 },
  { id: 'J2', type: 'junction', x: 350, y: 150, depth: 3.2, maxDepth: 6, invert: 98 },
  { id: 'J3', type: 'junction', x: 550, y: 220, depth: 1.8, maxDepth: 5, invert: 95 },
  { id: 'S1', type: 'storage', x: 280, y: 350, depth: 4.5, maxDepth: 10, invert: 92 },
  { id: 'O1', type: 'outfall', x: 650, y: 380, depth: 0.5, maxDepth: 3, invert: 88 },
];

const INITIAL_CONDUITS: Conduit[] = [
  { id: 'C1', from: 'J1', to: 'J2', diameter: 0.6, flow: 0.8, maxFlow: 2.0 },
  { id: 'C2', from: 'J2', to: 'J3', diameter: 0.8, flow: 1.5, maxFlow: 3.0 },
  { id: 'C3', from: 'J1', to: 'S1', diameter: 0.5, flow: 0.4, maxFlow: 1.5 },
  { id: 'C4', from: 'J3', to: 'O1', diameter: 1.0, flow: 2.0, maxFlow: 4.0 },
  { id: 'C5', from: 'S1', to: 'O1', diameter: 0.8, flow: 1.2, maxFlow: 2.5 },
];

const TOOLS = [
  { id: 'select', icon: '🖱️', tip: 'Select (V)', key: 'v', label: 'Select tool' },
  { id: 'pan', icon: '✋', tip: 'Pan (H)', key: 'h', label: 'Pan tool' },
  { id: 'junction', icon: '⬛', tip: 'Junction (J)', key: 'j', label: 'Add junction' },
  { id: 'outfall', icon: '🚪', tip: 'Outfall (O)', key: 'o', label: 'Add outfall' },
  { id: 'storage', icon: '🗃️', tip: 'Storage (S)', key: 's', label: 'Add storage' },
  { id: 'conduit', icon: '➡️', tip: 'Conduit (C)', key: 'c', label: 'Add conduit' },
  { id: 'subcatchment', icon: '🌧️', tip: 'Subcatch (A)', key: 'a', label: 'Add subcatchment' },
  { id: 'raingauge', icon: '☔', tip: 'Rain Gauge (R)', key: 'r', label: 'Add rain gauge' },
  { id: 'delete', icon: '🗑️', tip: 'Delete (Del)', key: 'Delete', label: 'Delete element' },
];

const INITIAL_STEVE: Steve = {
  x: 200,
  y: 250,
  targetX: 200,
  targetY: 250,
  direction: 'right',
  state: 'idle',
  animFrame: 0,
  inspectingNode: null,
  speechBubble: '',
  speechTimer: 0,
};

export default function SwmmCraft() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  
  const nodesRef = useRef<Node[]>(INITIAL_NODES);
  const conduitsRef = useRef<Conduit[]>(INITIAL_CONDUITS);
  const steveRef = useRef<Steve>({ ...INITIAL_STEVE });
  const starsRef = useRef<{ x: number; y: number; size: number; opacity: number }[]>([]);
  
  const [uiState, setUiState] = useState<UIState>({
    zoom: 1,
    panX: 0,
    panY: 0,
    isNight: false,
    showGrid: true,
    selectedTool: 'select',
    is3D: false,
    simTime: 0,
    isPlaying: false,
  });

  const [steveStatus, setSteveStatus] = useState({ state: 'idle', nodeId: '', speech: '' });
  const [showTooltip, setShowTooltip] = useState<{ x: number; y: number; node: Node } | null>(null);

  useEffect(() => {
    starsRef.current = Array.from({ length: 50 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      opacity: Math.random(),
    }));
  }, []);

  const getNodeAt = useCallback((x: number, y: number): Node | null => {
    for (const node of nodesRef.current) {
      const dx = node.x - x;
      const dy = node.y - y;
      if (Math.sqrt(dx * dx + dy * dy) < 30) {
        return node;
      }
    }
    return null;
  }, []);

  const updateSteve = useCallback(() => {
    const steve = steveRef.current;
    
    steve.animFrame = (steve.animFrame + 0.15) % 4;
    
    if (steve.speechTimer > 0) {
      steve.speechTimer -= 16;
      if (steve.speechTimer <= 0) {
        steve.speechBubble = '';
        steve.inspectingNode = null;
        setSteveStatus({ state: 'idle', nodeId: '', speech: '' });
      }
    }
    
    if (steve.state === 'inspecting') {
      if (steve.speechTimer <= 0) {
        steve.state = 'idle';
        const nodes = nodesRef.current;
        const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
        steve.targetX = randomNode.x - 40;
        steve.targetY = randomNode.y + 20;
      }
      return;
    }
    
    const dx = steve.targetX - steve.x;
    const dy = steve.targetY - steve.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 5) {
      steve.state = 'walking';
      const speed = 1.5;
      steve.x += (dx / dist) * speed;
      steve.y += (dy / dist) * speed;
      steve.direction = dx > 0 ? 'right' : 'left';
    } else {
      if (steve.state === 'walking') {
        const nearbyNode = getNodeAt(steve.x + 40, steve.y - 20);
        if (nearbyNode && Math.random() > 0.3) {
          steve.state = 'inspecting';
          steve.inspectingNode = nearbyNode;
          const fillPercent = Math.round((nearbyNode.depth / nearbyNode.maxDepth) * 100);
          steve.speechBubble = `${nearbyNode.id}: ${fillPercent}% full`;
          steve.speechTimer = 3000;
          setSteveStatus({ 
            state: 'inspecting', 
            nodeId: nearbyNode.id, 
            speech: steve.speechBubble 
          });
        } else {
          steve.state = 'idle';
          setSteveStatus(prev => ({ ...prev, state: 'idle' }));
          setTimeout(() => {
            const nodes = nodesRef.current;
            const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
            steveRef.current.targetX = randomNode.x - 40;
            steveRef.current.targetY = randomNode.y + 20;
          }, 2000 + Math.random() * 3000);
        }
      }
    }
  }, [getNodeAt]);

  const drawSteve = useCallback((ctx: CanvasRenderingContext2D, steve: Steve) => {
    ctx.save();
    ctx.translate(steve.x, steve.y);
    
    if (steve.direction === 'left') {
      ctx.scale(-1, 1);
    }
    
    const bobOffset = steve.state === 'idle' ? Math.sin(Date.now() / 300) * 2 : 0;
    
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 28, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.translate(0, bobOffset);
    
    const legSwing = steve.state === 'walking' ? Math.sin(steve.animFrame * Math.PI) * 0.4 : 0;
    
    ctx.fillStyle = '#1E3A8A';
    ctx.save();
    ctx.translate(-4, 8);
    ctx.rotate(legSwing);
    ctx.fillRect(-3, 0, 6, 16);
    ctx.restore();
    
    ctx.save();
    ctx.translate(4, 8);
    ctx.rotate(-legSwing);
    ctx.fillRect(-3, 0, 6, 16);
    ctx.restore();
    
    ctx.fillStyle = '#06B6D4';
    ctx.fillRect(-8, -8, 16, 16);
    
    const armSwing = steve.state === 'walking' ? Math.sin(steve.animFrame * Math.PI) * 0.5 : 0;
    
    ctx.fillStyle = '#D4A574';
    ctx.save();
    ctx.translate(-10, -6);
    ctx.rotate(-armSwing);
    ctx.fillRect(-2, 0, 4, 12);
    ctx.restore();
    
    ctx.save();
    ctx.translate(10, -6);
    ctx.rotate(armSwing);
    ctx.fillRect(-2, 0, 4, 12);
    
    if (steve.state === 'inspecting') {
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(0, 8, 8, 10);
      ctx.fillStyle = '#FFF';
      ctx.fillRect(1, 9, 6, 8);
    }
    ctx.restore();
    
    ctx.fillStyle = '#D4A574';
    ctx.fillRect(-6, -24, 12, 12);
    
    ctx.fillStyle = '#5D3A1A';
    ctx.fillRect(-6, -28, 12, 6);
    ctx.fillRect(-7, -24, 2, 4);
    ctx.fillRect(5, -24, 2, 4);
    
    ctx.fillStyle = '#FFF';
    ctx.fillRect(-4, -20, 3, 3);
    ctx.fillRect(1, -20, 3, 3);
    ctx.fillStyle = '#1E3A8A';
    ctx.fillRect(-3, -19, 2, 2);
    ctx.fillRect(2, -19, 2, 2);
    
    ctx.fillStyle = '#D4A574';
    ctx.fillRect(-1, -16, 2, 2);
    
    if (steve.speechBubble) {
      const bubbleX = steve.direction === 'left' ? -80 : 20;
      ctx.fillStyle = '#FFF';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.roundRect(bubbleX, -50, 70, 24, 4);
      ctx.fill();
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(bubbleX + 10, -26);
      ctx.lineTo(bubbleX + 5, -20);
      ctx.lineTo(bubbleX + 20, -26);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      ctx.fillStyle = '#000';
      ctx.font = "9px 'Press Start 2P'";
      ctx.fillText(steve.speechBubble, bubbleX + 5, -34);
    }
    
    ctx.restore();
  }, []);

  const drawNode = useCallback((ctx: CanvasRenderingContext2D, node: Node) => {
    const fillPercent = node.depth / node.maxDepth;
    const isWarning = fillPercent > 0.8;
    
    ctx.save();
    ctx.translate(node.x, node.y);
    
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(4, 20, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    if (node.type === 'junction') {
      ctx.fillStyle = '#4A4A4A';
      ctx.fillRect(-15, -20, 30, 40);
      
      ctx.fillStyle = '#3A3A3A';
      ctx.fillRect(-12, -17, 24, 34);
      
      const waterHeight = 34 * fillPercent;
      ctx.fillStyle = isWarning ? '#FF4444' : '#3B9AE1';
      ctx.fillRect(-12, -17 + (34 - waterHeight), 24, waterHeight);
      
      ctx.fillStyle = '#5A5A5A';
      ctx.beginPath();
      ctx.arc(0, -20, 12, Math.PI, 0);
      ctx.fill();
      
      ctx.strokeStyle = '#2A2A2A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-8, -18);
      ctx.lineTo(8, -18);
      ctx.moveTo(-8, -14);
      ctx.lineTo(8, -14);
      ctx.stroke();
    } else if (node.type === 'outfall') {
      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.moveTo(-20, -15);
      ctx.lineTo(20, -15);
      ctx.lineTo(25, 20);
      ctx.lineTo(-25, 20);
      ctx.closePath();
      ctx.fill();
      
      ctx.fillStyle = '#654321';
      ctx.beginPath();
      ctx.moveTo(-15, -10);
      ctx.lineTo(15, -10);
      ctx.lineTo(18, 15);
      ctx.lineTo(-18, 15);
      ctx.closePath();
      ctx.fill();
      
      ctx.fillStyle = '#3B9AE1';
      ctx.beginPath();
      ctx.arc(0, 5, 8, 0, Math.PI * 2);
      ctx.fill();
      
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = `rgba(59, 154, 225, ${0.6 - i * 0.2})`;
        ctx.beginPath();
        ctx.ellipse(25 + i * 12, 5, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (node.type === 'storage') {
      ctx.fillStyle = '#4A90D9';
      ctx.fillRect(-25, -25, 50, 50);
      
      ctx.fillStyle = '#2E5A87';
      ctx.fillRect(-22, -22, 44, 44);
      
      const waterHeight = 44 * fillPercent;
      ctx.fillStyle = isWarning ? 'rgba(255,68,68,0.8)' : 'rgba(59,154,225,0.8)';
      ctx.fillRect(-22, -22 + (44 - waterHeight), 44, waterHeight);
      
      ctx.strokeStyle = '#1E3A5F';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(-22, -22 + i * 11);
        ctx.lineTo(22, -22 + i * 11);
        ctx.stroke();
      }
    }
    
    ctx.fillStyle = '#FFF';
    ctx.font = "bold 10px 'Press Start 2P'";
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText(node.id, 0, 38);
    ctx.fillText(node.id, 0, 38);
    
    ctx.restore();
  }, []);

  const drawConduit = useCallback((ctx: CanvasRenderingContext2D, conduit: Conduit, nodes: Node[]) => {
    const fromNode = nodes.find(n => n.id === conduit.from);
    const toNode = nodes.find(n => n.id === conduit.to);
    if (!fromNode || !toNode) return;
    
    const flowPercent = conduit.flow / conduit.maxFlow;
    
    ctx.save();
    
    ctx.strokeStyle = '#4A4A4A';
    ctx.lineWidth = conduit.diameter * 20 + 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(fromNode.x, fromNode.y);
    ctx.lineTo(toNode.x, toNode.y);
    ctx.stroke();
    
    ctx.strokeStyle = '#2A2A2A';
    ctx.lineWidth = conduit.diameter * 20;
    ctx.beginPath();
    ctx.moveTo(fromNode.x, fromNode.y);
    ctx.lineTo(toNode.x, toNode.y);
    ctx.stroke();
    
    const gradient = ctx.createLinearGradient(fromNode.x, fromNode.y, toNode.x, toNode.y);
    gradient.addColorStop(0, flowPercent > 0.8 ? '#FF4444' : '#3B9AE1');
    gradient.addColorStop(1, flowPercent > 0.8 ? '#CC0000' : '#2980B9');
    ctx.strokeStyle = gradient;
    ctx.lineWidth = conduit.diameter * 20 * flowPercent;
    ctx.beginPath();
    ctx.moveTo(fromNode.x, fromNode.y);
    ctx.lineTo(toNode.x, toNode.y);
    ctx.stroke();
    
    const midX = (fromNode.x + toNode.x) / 2;
    const midY = (fromNode.y + toNode.y) / 2;
    const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
    
    ctx.save();
    ctx.translate(midX, midY);
    ctx.rotate(angle);
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-4, -6);
    ctx.lineTo(-4, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    
    ctx.restore();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const minimap = minimapRef.current;
    if (!canvas || !minimap) return;
    
    const ctx = canvas.getContext('2d');
    const mctx = minimap.getContext('2d');
    if (!ctx || !mctx) return;
    
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    const nodes = nodesRef.current;
    const conduits = conduitsRef.current;
    const steve = steveRef.current;
    const stars = starsRef.current;
    
    if (uiState.isNight) {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#0D1B2A');
      gradient.addColorStop(1, '#1B2838');
      ctx.fillStyle = gradient;
    } else {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#7EC8E3');
      gradient.addColorStop(1, '#A8E6CF');
      ctx.fillStyle = gradient;
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (uiState.isNight) {
      ctx.fillStyle = '#FFF';
      stars.forEach(star => {
        const twinkle = 0.5 + Math.sin(Date.now() / 500 + star.x * 10) * 0.5;
        ctx.globalAlpha = star.opacity * twinkle;
        ctx.beginPath();
        ctx.arc((star.x / 100) * canvas.width, (star.y / 100) * canvas.height, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }
    
    ctx.fillStyle = '#5D9E3C';
    ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
    
    if (uiState.showGrid) {
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 1;
      const gridSize = 50;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }
    
    ctx.save();
    ctx.translate(uiState.panX, uiState.panY);
    ctx.scale(uiState.zoom, uiState.zoom);
    
    conduits.forEach(conduit => drawConduit(ctx, conduit, nodes));
    nodes.forEach(node => drawNode(ctx, node));
    drawSteve(ctx, steve);
    
    ctx.restore();
    
    minimap.width = 140;
    minimap.height = 140;
    mctx.fillStyle = uiState.isNight ? '#1B2838' : '#A8E6CF';
    mctx.fillRect(0, 0, 140, 140);
    
    const scale = 0.15;
    mctx.save();
    mctx.scale(scale, scale);
    
    conduits.forEach(conduit => {
      const fromNode = nodes.find(n => n.id === conduit.from);
      const toNode = nodes.find(n => n.id === conduit.to);
      if (!fromNode || !toNode) return;
      mctx.strokeStyle = '#3B9AE1';
      mctx.lineWidth = 4;
      mctx.beginPath();
      mctx.moveTo(fromNode.x, fromNode.y);
      mctx.lineTo(toNode.x, toNode.y);
      mctx.stroke();
    });
    
    nodes.forEach(node => {
      mctx.fillStyle = node.type === 'junction' ? '#4A4A4A' : 
                       node.type === 'outfall' ? '#8B4513' : '#4A90D9';
      mctx.beginPath();
      mctx.arc(node.x, node.y, 15, 0, Math.PI * 2);
      mctx.fill();
    });
    
    mctx.fillStyle = '#06B6D4';
    mctx.beginPath();
    mctx.arc(steve.x, steve.y, 12, 0, Math.PI * 2);
    mctx.fill();
    
    mctx.restore();
  }, [uiState, drawConduit, drawNode, drawSteve]);

  useEffect(() => {
    const animate = () => {
      updateSteve();
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [updateSteve, draw]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tool = TOOLS.find(t => t.key.toLowerCase() === e.key.toLowerCase());
      if (tool) {
        setUiState(prev => ({ ...prev, selectedTool: tool.id }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - uiState.panX) / uiState.zoom;
    const y = (e.clientY - rect.top - uiState.panY) / uiState.zoom;
    
    const clickedNode = getNodeAt(x, y);
    if (clickedNode) {
      setShowTooltip({ x: e.clientX, y: e.clientY, node: clickedNode });
    } else {
      setShowTooltip(null);
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
  };

  const nodes = nodesRef.current;
  const conduits = conduitsRef.current;

  return (
    <div className={`h-screen flex flex-col ${uiState.isNight ? 'dark' : ''}`} style={{ fontFamily: "'VT323', monospace" }}>
      <header className="flex items-center justify-between gap-2 flex-wrap px-4 py-2" style={{ 
        background: 'linear-gradient(180deg, #2d2d2d 0%, #1a1a1a 100%)',
        borderBottom: '4px solid #000'
      }}>
        <div style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '14px', color: '#5D9E3C', textShadow: '2px 2px 0 #000' }} data-testid="logo-swmmcraft">
          SWMM<span style={{ color: '#3B9AE1' }}>CRAFT</span> <small style={{ fontSize: '8px', color: '#FFD700' }}>ULTIMATE</small>
        </div>
        <div className="flex items-center gap-1 flex-wrap" role="toolbar" aria-label="Main toolbar">
          <McButton data-testid="button-undo" aria-label="Undo last action">↶ UNDO</McButton>
          <McButton data-testid="button-redo" aria-label="Redo last action">↷ REDO</McButton>
          <Divider />
          <McButton data-testid="button-copy" aria-label="Copy selection">COPY</McButton>
          <McButton data-testid="button-paste" aria-label="Paste from clipboard">PASTE</McButton>
          <Divider />
          <McButton variant="primary" data-testid="button-import" aria-label="Import project file">IMPORT</McButton>
          <McButton data-testid="button-export" aria-label="Export project file">EXPORT</McButton>
          <Divider />
          <McButton data-testid="button-layout" aria-label="Auto layout network">LAYOUT</McButton>
          <McButton data-testid="button-profile" aria-label="View profile">PROFILE</McButton>
          <Divider />
          <McButton 
            data-testid="button-toggle-night"
            aria-label={uiState.isNight ? 'Switch to day mode' : 'Switch to night mode'}
            aria-pressed={uiState.isNight}
            onClick={() => setUiState(prev => ({ ...prev, isNight: !prev.isNight }))}
            className={uiState.isNight ? 'active' : ''}
          >
            {uiState.isNight ? '☀️' : '🌙'}
          </McButton>
          <McButton 
            data-testid="button-toggle-grid"
            aria-label={uiState.showGrid ? 'Hide grid' : 'Show grid'}
            aria-pressed={uiState.showGrid}
            onClick={() => setUiState(prev => ({ ...prev, showGrid: !prev.showGrid }))}
            className={uiState.showGrid ? 'active' : ''}
          >
            📐
          </McButton>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col gap-1.5 p-2" style={{
          width: '54px',
          background: 'linear-gradient(180deg, #3d3d3d 0%, #2a2a2a 100%)',
          borderRight: '4px solid #000'
        }} role="toolbar" aria-label="Drawing tools">
          {TOOLS.map(tool => (
            <ToolButton
              key={tool.id}
              data-testid={`tool-${tool.id}`}
              aria-label={tool.label}
              aria-pressed={uiState.selectedTool === tool.id}
              active={uiState.selectedTool === tool.id}
              onClick={() => setUiState(prev => ({ ...prev, selectedTool: tool.id }))}
              tip={tool.tip}
            >
              {tool.icon}
            </ToolButton>
          ))}
          <div className="flex-1" />
          <ToolButton 
            data-testid="button-zoom-in"
            aria-label="Zoom in"
            tip="Zoom In"
            onClick={() => setUiState(prev => ({ ...prev, zoom: Math.min(prev.zoom + 0.2, 3) }))}
          >
            ➕
          </ToolButton>
          <ToolButton 
            data-testid="button-zoom-out"
            aria-label="Zoom out"
            tip="Zoom Out"
            onClick={() => setUiState(prev => ({ ...prev, zoom: Math.max(prev.zoom - 0.2, 0.5) }))}
          >
            ➖
          </ToolButton>
          <ToolButton 
            data-testid="button-toggle-3d"
            aria-label={uiState.is3D ? 'Switch to 2D view' : 'Switch to 3D view'}
            aria-pressed={uiState.is3D}
            tip="3D View"
            active={uiState.is3D}
            onClick={() => setUiState(prev => ({ ...prev, is3D: !prev.is3D }))}
          >
            🎮
          </ToolButton>
        </div>

        <div className="flex-1 flex flex-col relative">
          <div className="flex" style={{ background: '#2a2a2a', borderBottom: '2px solid #000' }} role="tablist" aria-label="View mode">
            <ViewTab 
              active={!uiState.is3D} 
              onClick={() => setUiState(prev => ({ ...prev, is3D: false }))} 
              data-testid="tab-2d"
              aria-selected={!uiState.is3D}
              role="tab"
            >
              2D VIEW
            </ViewTab>
            <ViewTab 
              active={uiState.is3D} 
              onClick={() => setUiState(prev => ({ ...prev, is3D: true }))} 
              data-testid="tab-3d"
              aria-selected={uiState.is3D}
              role="tab"
            >
              3D ISOMETRIC
            </ViewTab>
          </div>
          
          <div className="flex-1 relative overflow-hidden">
            <canvas
              ref={canvasRef}
              data-testid="canvas-main"
              aria-label="Network canvas - click on nodes to view details"
              className="w-full h-full cursor-crosshair"
              onClick={handleCanvasClick}
              tabIndex={0}
            />
            
            <div className="absolute top-2.5 right-2.5" style={{
              width: '140px',
              height: '140px',
              background: 'rgba(0,0,0,0.8)',
              border: '3px solid',
              borderColor: '#fff #373737 #373737 #fff'
            }} aria-label="Minimap showing network overview">
              <canvas ref={minimapRef} data-testid="canvas-minimap" aria-hidden="true" className="w-full h-full" />
            </div>
            
            <div className="absolute bottom-2 left-2 px-2.5 py-1.5" style={{
              background: 'rgba(0,0,0,0.8)',
              fontFamily: "'Press Start 2P', cursive",
              fontSize: '7px',
              color: '#5D9E3C',
              border: '2px solid #444'
            }} data-testid="status-bar" aria-live="polite">
              ZOOM: {Math.round(uiState.zoom * 100)}% | TOOL: {uiState.selectedTool.toUpperCase()} | {uiState.is3D ? '3D' : '2D'}
            </div>
          </div>
        </div>

        <div className="overflow-y-auto" style={{
          width: '280px',
          background: 'linear-gradient(180deg, #3d3d3d 0%, #2a2a2a 100%)',
          borderLeft: '4px solid #000'
        }} role="complementary" aria-label="Control panel">
          <Panel title="SIMULATION">
            <div className="text-center p-1.5 mb-1.5" style={{
              fontFamily: "'Press Start 2P', cursive",
              fontSize: '11px',
              color: '#5D9E3C',
              background: '#000',
              border: '2px inset #444'
            }} data-testid="text-time-display" aria-live="polite">
              {formatTime(uiState.simTime)}
            </div>
            <label htmlFor="time-slider" className="sr-only">Simulation time</label>
            <input
              id="time-slider"
              type="range"
              min="0"
              max="86400"
              value={uiState.simTime}
              onChange={(e) => setUiState(prev => ({ ...prev, simTime: parseInt(e.target.value) }))}
              className="w-full h-3.5 mb-1.5"
              style={{ background: '#2a2a2a', border: '2px solid #1a1a1a' }}
              data-testid="slider-time"
              aria-label="Simulation time slider"
            />
            <div className="flex gap-1">
              <McButton 
                className="flex-1" 
                variant={uiState.isPlaying ? 'danger' : 'primary'}
                onClick={() => setUiState(prev => ({ ...prev, isPlaying: !prev.isPlaying }))}
                data-testid="button-play"
                aria-label={uiState.isPlaying ? 'Stop simulation' : 'Start simulation'}
                aria-pressed={uiState.isPlaying}
              >
                {uiState.isPlaying ? '⏹ STOP' : '▶ PLAY'}
              </McButton>
              <McButton className="flex-1" data-testid="button-step" aria-label="Step forward one time unit">⏭ STEP</McButton>
            </div>
          </Panel>

          <Panel title="NETWORK STATS">
            <div className="grid grid-cols-2 gap-1">
              <StatBox label="NODES" value={nodes.length.toString()} testId="stat-nodes" />
              <StatBox label="LINKS" value={conduits.length.toString()} testId="stat-links" />
              <StatBox 
                label="MAX DEPTH" 
                value={Math.max(...nodes.map(n => n.depth)).toFixed(1) + 'm'} 
                warning={Math.max(...nodes.map(n => n.depth / n.maxDepth)) > 0.8}
                testId="stat-max-depth"
              />
              <StatBox 
                label="TOTAL FLOW" 
                value={conduits.reduce((sum, c) => sum + c.flow, 0).toFixed(1) + ' m³/s'} 
                testId="stat-total-flow"
              />
            </div>
          </Panel>

          <Panel title="STEVE STATUS">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: '#06B6D4' }} aria-hidden="true">
                🧱
              </div>
              <div>
                <div className="text-sm" style={{ color: '#2d2d2d' }} data-testid="text-steve-name">Inspector Steve</div>
                <div className="text-xs" style={{ color: '#666' }} data-testid="text-steve-status" aria-live="polite">
                  {steveStatus.state === 'walking' ? 'Walking...' : 
                   steveStatus.state === 'inspecting' ? `Inspecting ${steveStatus.nodeId}` : 
                   'Idle'}
                </div>
              </div>
            </div>
            {steveStatus.speech && (
              <div className="p-2 rounded text-sm" style={{ background: '#000', color: '#5D9E3C', border: '2px inset #444' }} data-testid="text-steve-speech" aria-live="assertive">
                "{steveStatus.speech}"
              </div>
            )}
          </Panel>

          <Panel title="LEGEND">
            <div className="grid grid-cols-2 gap-1">
              <LegendItem color="#4A4A4A" label="Junction" />
              <LegendItem color="#8B4513" label="Outfall" />
              <LegendItem color="#4A90D9" label="Storage" />
              <LegendItem color="rgba(76,175,80,0.5)" label="Subcatch" />
            </div>
          </Panel>
        </div>
      </div>

      {showTooltip && (
        <div 
          className="fixed pointer-events-none z-50"
          style={{
            left: showTooltip.x + 10,
            top: showTooltip.y + 10,
            background: 'linear-gradient(180deg, #c6c6c6 0%, #8b8b8b 100%)',
            border: '3px solid',
            borderColor: '#fff #373737 #373737 #fff',
            padding: '10px',
            maxWidth: '240px'
          }}
          data-testid="tooltip-node"
          role="tooltip"
          aria-live="polite"
        >
          <div style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '9px', color: '#2d2d2d', marginBottom: '6px', borderBottom: '2px solid #5a5a5a', paddingBottom: '4px' }}>
            {showTooltip.node.type.toUpperCase()}: {showTooltip.node.id}
          </div>
          <div className="flex justify-between text-sm gap-2" style={{ color: '#333' }}>
            <span>Depth:</span>
            <span>{showTooltip.node.depth.toFixed(2)} / {showTooltip.node.maxDepth} m</span>
          </div>
          <div className="flex justify-between text-sm gap-2" style={{ color: '#333' }}>
            <span>Invert:</span>
            <span>{showTooltip.node.invert} m</span>
          </div>
          <div className="h-2 mt-1" style={{ background: '#3a3a3a', border: '2px inset #222' }} role="progressbar" aria-valuenow={Math.round((showTooltip.node.depth / showTooltip.node.maxDepth) * 100)} aria-valuemin={0} aria-valuemax={100}>
            <div 
              className="h-full" 
              style={{ 
                width: `${(showTooltip.node.depth / showTooltip.node.maxDepth) * 100}%`,
                background: showTooltip.node.depth / showTooltip.node.maxDepth > 0.8 
                  ? 'linear-gradient(180deg, #FF4444 0%, #CC0000 100%)'
                  : 'linear-gradient(180deg, #5D9E3C 0%, #3D6E2C 100%)'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function McButton({ children, variant, className = '', ...props }: { 
  children: React.ReactNode; 
  variant?: 'primary' | 'danger'; 
  className?: string;
  [key: string]: any;
}) {
  const baseStyle: React.CSSProperties = {
    fontFamily: "'Press Start 2P', cursive",
    fontSize: '8px',
    padding: '6px 10px',
    background: variant === 'primary' 
      ? 'linear-gradient(180deg, #4A90D9 0%, #2E5A87 100%)'
      : variant === 'danger'
      ? 'linear-gradient(180deg, #CC4444 0%, #993333 100%)'
      : 'linear-gradient(180deg, #7a7a7a 0%, #4a4a4a 100%)',
    border: '3px solid',
    borderColor: '#fff #373737 #373737 #fff',
    color: '#fff',
    cursor: 'pointer',
    textShadow: '1px 1px 0 #000',
    whiteSpace: 'nowrap' as const,
  };
  
  return (
    <button 
      type="button"
      style={baseStyle} 
      className={`hover:brightness-110 active:border-[#373737_#fff_#fff_#373737] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function ToolButton({ children, active, tip, ...props }: { 
  children: React.ReactNode; 
  active?: boolean; 
  tip: string;
  [key: string]: any;
}) {
  return (
    <button 
      type="button"
      className="relative group"
      style={{
        width: '42px',
        height: '42px',
        background: active 
          ? 'linear-gradient(180deg, #5D9E3C 0%, #3D6E2C 100%)'
          : 'linear-gradient(180deg, #5a5a5a 0%, #3a3a3a 100%)',
        border: '3px solid',
        borderColor: '#7a7a7a #2a2a2a #2a2a2a #7a7a7a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        cursor: 'pointer',
      }}
      {...props}
    >
      {children}
      <span 
        className="hidden group-hover:block absolute left-12 whitespace-nowrap z-50"
        style={{
          background: '#222',
          color: '#fff',
          padding: '4px 8px',
          fontSize: '12px',
          border: '2px solid #444',
          fontFamily: "'VT323', monospace",
        }}
        role="tooltip"
      >
        {tip}
      </span>
    </button>
  );
}

function ViewTab({ children, active, ...props }: { children: React.ReactNode; active?: boolean; [key: string]: any }) {
  return (
    <button
      type="button"
      style={{
        padding: '8px 16px',
        fontFamily: "'Press Start 2P', cursive",
        fontSize: '8px',
        color: active ? '#5D9E3C' : '#888',
        background: active ? '#4a4a4a' : 'transparent',
        cursor: 'pointer',
        borderRight: '2px solid #000',
        border: 'none',
        borderBottom: 'none',
      }}
      className="hover:bg-[#3a3a3a] hover:text-white"
      {...props}
    >
      {children}
    </button>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="m-2 p-2.5" style={{
      background: 'linear-gradient(180deg, #c6c6c6 0%, #8b8b8b 100%)',
      border: '3px solid',
      borderColor: '#fff #373737 #373737 #fff',
    }}>
      <div style={{
        fontFamily: "'Press Start 2P', cursive",
        fontSize: '9px',
        color: '#2d2d2d',
        marginBottom: '10px',
        paddingBottom: '6px',
        borderBottom: '2px solid #5a5a5a',
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function StatBox({ label, value, warning, testId }: { label: string; value: string; warning?: boolean; testId: string }) {
  return (
    <div className="text-center p-1.5" style={{ background: '#000', border: '2px inset #444' }} data-testid={testId}>
      <div style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '6px', color: '#888' }}>{label}</div>
      <div 
        className={warning ? 'animate-pulse' : ''}
        style={{ fontSize: '14px', color: warning ? '#FF4444' : '#5D9E3C' }}
        aria-label={`${label}: ${value}`}
      >
        {value}
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs" style={{ color: '#2d2d2d' }}>
      <div style={{
        width: '16px',
        height: '16px',
        background: color,
        border: '2px solid',
        borderColor: '#fff #373737 #373737 #fff',
      }} aria-hidden="true" />
      <span data-testid={`legend-${label.toLowerCase()}`}>{label}</span>
    </div>
  );
}

function Divider() {
  return <div className="w-0.5 h-6 mx-0.5" style={{ background: '#444' }} aria-hidden="true" />;
}
