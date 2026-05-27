import React, { useEffect, useRef, useState } from 'react';

interface StickmanWesternAnimationProps {
  isLoading: boolean;
  isComplete: boolean;
  onFinishedAnimation?: () => void;
  interactiveDemo?: boolean;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'bullet' | 'arrow' | 'fatal_arrow';
  width: number;
  height: number;
  angle: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

export default function StickmanWesternAnimation({
  isLoading,
  isComplete,
  onFinishedAnimation,
  interactiveDemo = false
}: StickmanWesternAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Simulation states
  const [demoState, setDemoState] = useState<'idle' | 'running' | 'completed'>('idle');
  const [simulatedComplete, setSimulatedComplete] = useState(false);

  // Buffer input actions for integration in frame ticks
  const inputRef = useRef({
    fireArrow: false,
    fireColt: false
  });

  // Animation cycle internal metrics using ref to keep 60fps loop stable
  const stateRef = useRef({
    cowboyX: -100,
    cowboyY: 150,
    indianX: -100,
    indianY: 150,
    
    cowboyTargetX: 0.25, // percentage of screen width
    indianTargetX: 0.75, // percentage of screen width
    
    phase: 'entrance' as 'entrance' | 'chase_entrance' | 'chasing' | 'hit_sequence' | 'done',
    
    groundScroll: 0,
    time: 0,
    
    projectiles: [] as Projectile[],
    sparks: [] as Spark[],
    
    cowboyShootCooldown: 0,
    indianShootCooldown: 0,
    
    cowboyMounted: true,
    cowboyFallAngle: 0,
    cowboyFallX: 0,
    cowboyFallY: 0,
    
    horseRunAwayX: 0,
    
    completeTriggered: false,
    onFinishedTriggered: false,
    frameId: 0
  });

  // Watch complete flags
  const actualComplete = interactiveDemo ? simulatedComplete : isComplete;

  useEffect(() => {
    stateRef.current.completeTriggered = actualComplete;
  }, [actualComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 800;
    let height = 300;

    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        width = containerRef.current.clientWidth;
        // Keep a neat 16:6 aspect ratio for a wide cinematic vista
        height = Math.max(180, Math.min(300, width * 0.35));
        canvasRef.current.width = width * window.devicePixelRatio;
        canvasRef.current.height = height * window.devicePixelRatio;
        canvasRef.current.style.width = `${width}px`;
        canvasRef.current.style.height = `${height}px`;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);

    // Initial state setup
    const state = stateRef.current;
    state.cowboyX = width + 100; // Start off-screen right
    state.indianX = width + 100; // Start off-screen right
    state.phase = 'entrance';
    state.projectiles = [];
    state.sparks = [];
    state.cowboyMounted = true;
    state.cowboyFallAngle = 0;
    state.cowboyFallX = 0;
    state.cowboyFallY = 0;
    state.horseRunAwayX = 0;
    state.onFinishedTriggered = false;
    state.cowboyShootCooldown = 30;
    state.indianShootCooldown = 70;

    const getColors = () => {
      return {
        amber: '#ff3333',         // Bright neon red
        retroRed: '#e50914',      // Zita deep red
        glowGreen: '#ff5555',     // Light rose/coral red for cactus
        neonBlue: '#ff2222',      // Hot red
        magenta: '#990000',       // Deep crimson
        textWhite: '#ffffff',     // Neutral white for high-contrast sparks & text
        shadowColor: 'rgba(229, 9, 20, 0.35)'
      };
    };

    const colors = getColors();

    const drawCowboySilhouette = (
      c: CanvasRenderingContext2D,
      rx: number,
      ry: number,
      time: number,
      color: string,
      isMounted = true,
      sway = 0
    ) => {
      c.save();
      c.translate(rx, ry);
      c.rotate(sway);

      // 1. Head (Slim minimalist block)
      c.fillStyle = '#ff8888'; // Light coral skin tone
      c.fillRect(-2, -23, 4, 4);
      c.strokeStyle = color;
      c.lineWidth = 1;
      c.strokeRect(-2, -23, 4, 4);

      // 2. Cowboy Hat (Slim Red)
      c.fillStyle = colors.retroRed; 
      // Brim of hat - thin line-art
      c.fillRect(-6, -24, 12, 1);
      c.strokeRect(-6, -24, 12, 1);
      // Crown of hat - small block
      c.fillRect(-3, -28, 6, 4);
      c.strokeRect(-3, -28, 6, 4);

      // 3. Torso (Slim stickman-style torso)
      c.fillStyle = colors.magenta; 
      c.fillRect(-2, -18, 4, 10);
      c.strokeStyle = color;
      c.lineWidth = 1;
      c.strokeRect(-2, -18, 4, 10);

      // Simple belt line
      c.fillStyle = colors.amber;
      c.fillRect(-2, -9, 4, 1.5);

      // 4. Arms & Colt Six-Shooter
      const cycle = time * 0.18;
      c.strokeStyle = color;
      c.lineWidth = 1.5; // Slimmer limbs
      c.lineCap = 'round';

      if (isMounted) {
        // Left arm holding reins (frontwards)
        c.beginPath();
        c.moveTo(-1, -14);
        c.lineTo(3, -11);
        c.lineTo(7, -11);
        c.stroke();

        // Right arm aiming six-shooter backward towards the Indian (rightwards)
        const shotWave = Math.sin(cycle) * 0.1;
        const handX = -10;
        const handY = -12 + shotWave * 5;
        
        c.beginPath();
        c.moveTo(-1, -14);
        c.lineTo(-5, -13);
        c.lineTo(handX, handY);
        c.stroke();

        // Pistol (Slim retro pixel pistol)
        c.fillStyle = colors.amber; 
        c.fillRect(handX - 3, handY - 0.5, 3.5, 1.5);
        c.fillStyle = '#ffffff';
        c.fillRect(handX - 1.5, handY + 1, 1.5, 2);
      } else {
        // Waving arms wildly in the air during fall state
        c.beginPath();
        c.moveTo(-1, -14);
        c.lineTo(-8, -20 + Math.sin(time * 0.4) * 4);
        c.moveTo(-1, -14);
        c.lineTo(8, -17 + Math.cos(time * 0.4) * 4);
        c.stroke();
      }

      // 5. Legs (Slim legs)
      if (isMounted) {
        c.strokeStyle = '#ffffff';
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(-1, -8);
        c.lineTo(2, -1);
        c.lineTo(1, 4);
        c.stroke();

        // Boot
        c.fillStyle = colors.magenta;
        c.fillRect(0.5, 3.5, 2.5, 1.5);
      } else {
        // Kicking legs during dramatic fall
        c.strokeStyle = '#ffffff';
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(-1, -8);
        c.lineTo(-6, 2 + Math.sin(time * 0.4) * 4);
        c.moveTo(-1, -8);
        c.lineTo(3, 1 + Math.cos(time * 0.4) * 4);
        c.stroke();
      }

      c.restore();
    };

    const drawIndianSilhouette = (
      c: CanvasRenderingContext2D,
      rx: number,
      ry: number,
      time: number,
      color: string,
      sway = 0
    ) => {
      c.save();
      c.translate(rx, ry);
      c.rotate(sway);

      // 1. Head (Slim minimalist block)
      c.fillStyle = '#ff8888'; // Coral skin
      c.fillRect(-2, -23, 4, 4);
      c.strokeStyle = color;
      c.lineWidth = 1;
      c.strokeRect(-2, -23, 4, 4);

      // 2. Feathers (Sleek minimalist feathers)
      c.fillStyle = colors.retroRed; 
      c.fillRect(-1.5, -29, 1, 6);
      c.fillStyle = '#ffffff'; 
      c.fillRect(-1.5, -31, 1, 2);

      c.fillStyle = colors.retroRed;
      c.fillRect(0.5, -27, 1, 4);
      c.fillStyle = '#ffffff';
      c.fillRect(0.5, -29, 1, 2);

      // 3. Torso (Slim stickman-style torso)
      c.fillStyle = colors.magenta; 
      c.fillRect(-2, -18, 4, 10);
      c.strokeStyle = color;
      c.lineWidth = 1;
      c.strokeRect(-2, -18, 4, 10);

      // Beaded strap (Diagonal slim line)
      c.fillStyle = '#ffffff';
      c.fillRect(-1.5, -15, 1, 1);
      c.fillRect(-0.5, -12, 1, 1);
      c.fillRect(0.5, -9, 1, 1);

      // 4. Bow & Arrow drawing (Slim style, flipped correct direction)
      c.strokeStyle = color;
      c.lineWidth = 1.5;
      
      // bow arm
      c.beginPath();
      c.moveTo(0, -13);
      c.lineTo(5, -11);
      c.lineTo(10, -10);
      c.stroke();

      // string pulling arm
      c.beginPath();
      c.moveTo(0, -13);
      c.lineTo(3, -13);
      c.lineTo(4, -10);
      c.stroke();

      // Bow arc (slim, curving outwards towards the left/target! Center at x=5, apex at x=10.5)
      c.strokeStyle = colors.retroRed; 
      c.lineWidth = 1.2;
      c.beginPath();
      c.arc(5, -10, 5.5, -Math.PI * 0.35, Math.PI * 0.35, false);
      c.stroke();

      // White string from bow tips (7.5, -14.9) and (7.5, -5.1), pulled to (4, -10)
      c.strokeStyle = '#ffffff';
      c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(7.5, -14.9);
      c.lineTo(4, -10);
      c.lineTo(7.5, -5.1);
      c.stroke();

      // Aimed arrow starting from pulled string point (4, -10) and extending past bow hand (10.5) to (13, -10)
      const drawArrowCycle = time % 100;
      if (drawArrowCycle > 40) {
        c.strokeStyle = '#ffffff';
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(4, -10);
        c.lineTo(13, -10);
        c.stroke();
        
        // Red arrow arrowhead pixel
        c.fillStyle = colors.retroRed;
        c.fillRect(13, -10.5, 1.5, 1);
      }

      // 5. Legs wrapping around horse (slim)
      c.strokeStyle = color;
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(0, -8);
      c.lineTo(-2, -1);
      c.lineTo(-1, 4);
      c.stroke();

      // Moccasins boot
      c.fillStyle = colors.magenta;
      c.fillRect(-1.5, 3.5, 2.5, 1.5);

      c.restore();
    };

    const drawStarflightHorse = (
      c: CanvasRenderingContext2D,
      hx: number,
      hy: number,
      time: number,
      color: string,
      speedMultiplier = 1,
      riderType: 'cowboy' | 'indian' | 'none' = 'none',
      riderSway = 0
    ) => {
      // Gallop with pleasant rhythmic frequency
      const cycle = time * 0.18 * speedMultiplier;
      
      c.save();
      c.translate(hx, hy);
      c.scale(-1, 1); // Face leftwards (moving from right to left)

      // Real horse gallop pitch/rotation rocking forward and backward!
      const pitch = Math.sin(cycle) * 0.10;
      c.rotate(pitch);

      // Starflight EGA styling - shadow glow and slim elegant contours
      c.shadowBlur = 3;
      c.shadowColor = colors.retroRed;

      // Draw Main Slim Horse Body (Elegant thin silhouette)
      c.fillStyle = colors.magenta; // Deep crimson
      c.strokeStyle = color;
      c.lineWidth = 1.0;
      
      // Slimmer body rectangle
      c.beginPath();
      c.rect(-14, -2, 28, 5);
      c.fill();
      c.stroke();

      // Small details removed: saddle blanket is now a small accent stripe
      c.fillStyle = colors.retroRed;
      c.fillRect(-3, -3, 6, 2);

      // Neck and head - slim line-art style
      c.beginPath();
      c.moveTo(10, -1);
      c.lineTo(16, -11);
      c.lineTo(21, -9);
      c.lineTo(13, 1);
      c.closePath();
      c.fill();
      c.stroke();

      // Horse Head (Slim head nozzle)
      c.fillRect(15, -13, 7, 3.5);
      c.strokeRect(15, -13, 7, 3.5);

      // Simple tiny Ears
      c.fillStyle = color;
      c.fillRect(15, -16, 1.5, 3);
      c.fillRect(17, -15, 1.5, 2);

      // Horse Tail (Thin elegant single-stroke line)
      c.beginPath();
      c.moveTo(-14, -1);
      c.quadraticCurveTo(-20, -3 + Math.sin(cycle) * 2, -24, Math.sin(cycle) * 3);
      c.strokeStyle = colors.amber;
      c.lineWidth = 1.0;
      c.stroke();

      // Legs - Galloping slim lines (thickness reduced)
      c.strokeStyle = color;
      c.lineWidth = 1.5;
      c.lineCap = 'round';

      // Left Front Leg
      const lfJointAngle = Math.sin(cycle) * 0.6;
      const lfKneeX = 11 + Math.sin(lfJointAngle) * 6;
      const lfKneeY = 3 + 6;
      const lfHoofX = lfKneeX + Math.sin(lfJointAngle - 0.4) * 6;
      const lfHoofY = lfKneeY + 5;
      c.beginPath();
      c.moveTo(11, 2);
      c.lineTo(lfKneeX, lfKneeY);
      c.lineTo(lfHoofX, lfHoofY);
      c.stroke();
      // Draw Slim Hoof
      c.fillStyle = colors.amber;
      c.fillRect(lfHoofX - 1, lfHoofY - 1, 2.5, 1.5);

      // Right Front Leg
      const rfJointAngle = Math.sin(cycle + Math.PI) * 0.6;
      const rfKneeX = 11 + Math.sin(rfJointAngle) * 6;
      const rfKneeY = 3 + 6;
      const rfHoofX = rfKneeX + Math.sin(rfJointAngle - 0.4) * 6;
      const rfHoofY = rfKneeY + 5;
      c.beginPath();
      c.moveTo(11, 2);
      c.lineTo(rfKneeX, rfKneeY);
      c.lineTo(rfHoofX, rfHoofY);
      c.stroke();
      c.fillRect(rfHoofX - 1, rfHoofY - 1, 2.5, 1.5);

      // Left Back Leg
      const lbJointAngle = Math.sin(cycle + 0.5) * 0.6;
      const lbKneeX = -10 + Math.sin(lbJointAngle) * 6;
      const lbKneeY = 3 + 6;
      const lbHoofX = lbKneeX + Math.sin(lbJointAngle - 0.3) * 6;
      const lbHoofY = lbKneeY + 5;
      c.beginPath();
      c.moveTo(-10, 2);
      c.lineTo(lbKneeX, lbKneeY);
      c.lineTo(lbHoofX, lbHoofY);
      c.stroke();
      c.fillRect(lbHoofX - 1, lbHoofY - 1, 2.5, 1.5);

      // Right Back Leg
      const rbJointAngle = Math.sin(cycle + Math.PI + 0.5) * 0.6;
      const rbKneeX = -10 + Math.sin(rbJointAngle) * 6;
      const rbKneeY = 3 + 6;
      const rbHoofX = rbKneeX + Math.sin(rbJointAngle - 0.3) * 6;
      const rbHoofY = rbKneeY + 5;
      c.beginPath();
      c.moveTo(-10, 2);
      c.lineTo(rbKneeX, rbKneeY);
      c.lineTo(rbHoofX, rbHoofY);
      c.stroke();
      c.fillRect(rbHoofX - 1, rbHoofY - 1, 2.5, 1.5);

      // Draw rider mounted onto the horse saddle, perfectly nested in the pitch rotation of the horse body!
      if (riderType === 'indian') {
        drawIndianSilhouette(c, -1, -2, time, color, riderSway);
      } else if (riderType === 'cowboy') {
        drawCowboySilhouette(c, -1, -2, time, color, true, riderSway);
      }

      c.restore();
    };

    const drawStarflightCowboy = (
      c: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      time: number,
      color: string,
      isMounted = true,
      fallAngle = 0,
      sway = 0
    ) => {
      c.save();
      c.translate(cx, cy);
      if (!isMounted) {
        c.rotate(fallAngle);
      }
      c.scale(-1, 1);
      drawCowboySilhouette(c, 0, 0, time, color, isMounted, sway);
      c.restore();
    };

    const drawStarflightIndian = (
      c: CanvasRenderingContext2D,
      ix: number,
      iy: number,
      time: number,
      color: string,
      sway = 0
    ) => {
      c.save();
      c.translate(ix, iy);
      c.scale(-1, 1);
      drawIndianSilhouette(c, 0, 0, time, color, sway);
      c.restore();
    };

    const spawnSparkCascade = (sx: number, sy: number, num = 8, sparkColor = colors.amber) => {
      for (let i = 0; i < num; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 3.5;
        state.sparks.push({
          x: sx,
          y: sy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.2,
          life: 0,
          maxLife: 15 + Math.random() * 20,
          color: sparkColor
        });
      }
    };

    // Main Draw & Physics update loop
    const tick = () => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      state.time += 1;
      const horizonY = height - 50;

      // Make sure characters Y values are computed based on dynamic horizon Y and gallop wave
      const cowboyCycleVal = state.time * 0.18 * 1.0;
      const cowboyBounceYVal = Math.sin(cowboyCycleVal * 2) * 3.5;
      state.cowboyY = horizonY - 12 + (state.cowboyMounted ? cowboyBounceYVal : 0);

      const indianCycleVal = state.time * 0.18 * 1.15;
      const indianBounceYVal = Math.sin(indianCycleVal * 2) * 3.5;
      state.indianY = horizonY - 12 + indianBounceYVal;

      // Process manual user inputs from sandbox actions
      if (inputRef.current.fireArrow) {
        inputRef.current.fireArrow = false;
        if (state.phase === 'chasing') {
          state.projectiles.push({
            x: state.indianX - 22, // Bow tip/arrowhead muzzle x
            y: state.indianY - 15, // Bow tip/arrowhead muzzle y
            vx: -7.0,              // High speed arrow but adjusted for professional feel
            vy: -1.0,
            type: 'arrow',
            width: 12,
            height: 2,
            angle: Math.PI
          });
          spawnSparkCascade(state.indianX - 22, state.indianY - 15, 4, colors.textWhite);
        }
      }

      if (inputRef.current.fireColt) {
        inputRef.current.fireColt = false;
        if (state.phase === 'chasing') {
          state.projectiles.push({
            x: state.cowboyX + 17, // Gun muzzle x (gun aiming backwards right)
            y: state.cowboyY - 16, // Gun muzzle y
            vx: 9.0,               // Adjusted bullet speed
            vy: 0.3,
            type: 'bullet',
            width: 5,
            height: 1,
            angle: 0.03
          });
          spawnSparkCascade(state.cowboyX + 17, state.cowboyY - 16, 6, colors.amber);
        }
      }

      // Draw Grid Line Ground scrolling right (illusion of forward leftwards motion)
      ctx.strokeStyle = '#33080c'; // Subtle dark red horizon line
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      ctx.lineTo(width, horizonY);
      ctx.stroke();

      // Scroll background items (Cacti & Mountains) to the RIGHT!
      state.groundScroll = (state.groundScroll + 2.5) % width;

      // Draw horizontal speed vectors representing 80s movement grids
      ctx.strokeStyle = 'rgba(229, 9, 20, 0.08)'; // Zita red speed grids
      ctx.lineWidth = 1;
      const startGridX = (state.groundScroll % 120) - 120;
      for (let x = startGridX; x < width + 120; x += 120) {
        ctx.beginPath();
        ctx.moveTo(x, horizonY);
        // Perspective slant lines down
        ctx.lineTo(x - 60, height);
        ctx.stroke();
      }

      // Draw classic minimalist Cactus (rolling scenery in thematic Red)
      const drawCactus = (cx: number) => {
        ctx.strokeStyle = colors.glowGreen; // Custom coral-red
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Trunk
        ctx.moveTo(cx, horizonY);
        ctx.lineTo(cx, horizonY - 24);
        // Left arm
        ctx.moveTo(cx, horizonY - 14);
        ctx.lineTo(cx - 6, horizonY - 14);
        ctx.lineTo(cx - 6, horizonY - 22);
        // Right arm
        ctx.moveTo(cx, horizonY - 10);
        ctx.lineTo(cx + 6, horizonY - 10);
        ctx.lineTo(cx + 6, horizonY - 18);
        ctx.stroke();
      };

      // Vector background mountain ranges (very low poly representation in deep red accent)
      ctx.strokeStyle = '#1b0204';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      ctx.lineTo(width * 0.1, horizonY - 30);
      ctx.lineTo(width * 0.2, horizonY);
      ctx.lineTo(width * 0.3, horizonY - 45);
      ctx.lineTo(width * 0.5, horizonY);
      ctx.lineTo(width * 0.7, horizonY - 20);
      ctx.lineTo(width * 0.85, horizonY - 40);
      ctx.lineTo(width, horizonY);
      ctx.stroke();

      // Cacti spawn algorithm at fixed spatial intervals scrolling left
      const firstCactusX = (width * 0.4 + state.groundScroll * 1.0) % width;
      const secondCactusX = (width * 0.85 + state.groundScroll * 1.0) % width;
      drawCactus(firstCactusX);
      drawCactus(secondCactusX);

      // Progress animation state machine phase (Right-to-Left entrance)
      if (state.phase === 'entrance') {
        const targetCowboyX = width * state.cowboyTargetX; // width * 0.25
        if (state.cowboyX > targetCowboyX) {
          state.cowboyX -= 4.0; // Moderate speed coming in from the right
        }
        
        // Trigger Indian appearance once cowboy reaches almost his target position
        if (state.cowboyX <= targetCowboyX + 15) {
          state.phase = 'chase_entrance';
          state.indianX = width + 100; // spawn off-screen right
        }
      } else if (state.phase === 'chase_entrance') {
        const targetCowboyX = width * state.cowboyTargetX;
        if (state.cowboyX > targetCowboyX) {
          state.cowboyX -= 3.0;
        } else {
          state.cowboyX = targetCowboyX;
        }

        const targetIndianX = width * state.indianTargetX; // width * 0.75
        if (state.indianX > targetIndianX) {
          state.indianX -= 5.0; // Indian chases at a moderate, pleasant speed
        } else {
          state.indianX = targetIndianX;
        }

        if (state.cowboyX <= targetCowboyX && state.indianX <= targetIndianX) {
          state.phase = 'chasing';
        }
      } else if (state.phase === 'chasing') {
        // Continuous state where horses gallop & exchange shots while being chased
        
        // Complete indicator has been triggered, let's launch the final dramatic strike!
        if (state.completeTriggered) {
          state.phase = 'hit_sequence';
          // Force fire of fatal arrow! Balanced with lower angle & speed
          const angle = Math.atan2((state.cowboyY - 13) - (state.indianY - 15), state.cowboyX - state.indianX);
          state.projectiles.push({
            x: state.indianX - 22, // From Bow tip/arrowhead
            y: state.indianY - 15,
            vx: Math.cos(angle) * 7.5,
            vy: Math.sin(angle) * 7.5,
            type: 'fatal_arrow',
            width: 14,
            height: 2,
            angle
          });
          // Spontaneous muzzle/arrow release spark
          spawnSparkCascade(state.indianX - 22, state.indianY - 15, 5, colors.retroRed);
        } else {
          // Indian fires arrows periodically
          state.indianShootCooldown -= 1;
          if (state.indianShootCooldown <= 0) {
            state.indianShootCooldown = 70 + Math.random() * 50; // pleasant frequency
            // Aim arrow upwards slightly to perform arc
            const dX = state.cowboyX - state.indianX;
            const dY = (state.cowboyY - 10) - (state.indianY - 15);
            const dist = Math.sqrt(dX * dX + dY * dY);
            const angle = Math.atan2(dY - 15, dX); 
            state.projectiles.push({
              x: state.indianX - 22, // From Bow tip/arrowhead
              y: state.indianY - 15,
              vx: Math.cos(angle) * 6.5,
              vy: Math.sin(angle) * 6.5,
              type: 'arrow',
              width: 12,
              height: 2,
              angle
            });
            spawnSparkCascade(state.indianX - 22, state.indianY - 15, 4, colors.textWhite);
          }

          // Cowboy shoots back periodically
          state.cowboyShootCooldown -= 1;
          if (state.cowboyShootCooldown <= 0) {
            state.cowboyShootCooldown = 60 + Math.random() * 40; // pleasant frequency
            // Aim at Indian pelvis
            const angle = Math.atan2((state.indianY - 8) - (state.cowboyY - 16), state.indianX - state.cowboyX);
            state.projectiles.push({
              x: state.cowboyX + 17, // From Gun tip (cowboy facing left, aims right backward)
              y: state.cowboyY - 16,
              vx: Math.cos(angle) * 9.0,
              vy: Math.sin(angle) * 9.0,
              type: 'bullet',
              width: 5,
              height: 1,
              angle
            });
            spawnSparkCascade(state.cowboyX + 17, state.cowboyY - 16, 6, colors.amber);
          }
        }
      } else if (state.phase === 'hit_sequence') {
        // Handled via arrow strike detection inside projectile update
      }

      // ------------------------------------
      // UPDATE PROJECTILES
      // ------------------------------------
      for (let i = state.projectiles.length - 1; i >= 0; i--) {
        const p = state.projectiles[i];
        p.x += p.vx;
        p.y += p.vy;
        
        // Gravity effect on arrows
        if (p.type === 'arrow') {
          p.vy += 0.08; 
          p.angle = Math.atan2(p.vy, p.vx);
        }

        // Draw projectile
        ctx.strokeStyle = p.type === 'bullet' ? colors.amber : colors.textWhite;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        
        if (p.type === 'bullet') {
          ctx.moveTo(-p.width * 0.5, 0);
          ctx.lineTo(p.width * 0.5, 0);
        } else {
          // Arrow drawing
          ctx.moveTo(-p.width * 0.5, 0);
          ctx.lineTo(p.width * 0.5, 0);
          // arrow wings
          ctx.moveTo(-p.width * 0.5, -2);
          ctx.lineTo(-p.width * 0.5 - 2, 0);
          ctx.lineTo(-p.width * 0.5, 2);
        }
        ctx.stroke();
        ctx.restore();

        // Check arrow collision on Cowboy chest during final strike sequence
        if (p.type === 'fatal_arrow') {
          const distToCowboy = Math.hypot(p.x - state.cowboyX, p.y - (state.cowboyY - 13));
          if (distToCowboy < 15 && state.cowboyMounted) {
            // WHAM! Arrow strikes cowboy chest
            state.cowboyMounted = false;
            state.cowboyFallX = state.cowboyX;
            state.cowboyFallY = state.cowboyY - 10;
            state.cowboyFallAngle = -0.15;
            
            // Remove the projectile
            state.projectiles.splice(i, 1);
            
            // Spawn mega feedback elements (glorious crimson spray)
            spawnSparkCascade(state.cowboyX, state.cowboyY - 13, 25, colors.retroRed);
            continue;
          }
        }

        // Out of bounds check
        if (p.x < -100 || p.x > width + 100 || p.y < -50 || p.y > height + 50) {
          state.projectiles.splice(i, 1);
        }
      }

      // ------------------------------------
      // UPDATE SPARKS
      // ------------------------------------
      for (let i = state.sparks.length - 1; i >= 0; i--) {
        const s = state.sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life += 1;
        
        // draw spark as retro square/pixel
        ctx.fillStyle = s.color;
        ctx.fillRect(s.x - 1, s.y - 1, 2, 2);

        if (s.life >= s.maxLife) {
          state.sparks.splice(i, 1);
        }
      }

      // Cowboy falling motion sequence
      if (!state.cowboyMounted && state.phase === 'hit_sequence') {
        state.cowboyFallAngle += 0.08;
        state.cowboyFallX -= 3.2; // flies back faster
        if (state.cowboyFallY < horizonY + 5) {
          state.cowboyFallY += 3.5; // fall to ground
        } else {
          // ground hit sparks
          if (state.cowboyFallAngle > 0.3) {
            spawnSparkCascade(state.cowboyFallX, horizonY, 8, colors.textWhite);
            state.cowboyFallAngle = Math.PI * 0.45; // resting state flat
            
            // Finish animation trigger timeout
            if (!state.onFinishedTriggered) {
              state.onFinishedTriggered = true;
              setTimeout(() => {
                cancelAnimationFrame(state.frameId);
                onFinishedAnimation?.();
              }, 1200);
            }
          }
        }
        
        // Reroute riderless horse galloping ahead rapidly
        state.horseRunAwayX += 4.5;
      }

      // ------------------------------------
      // DRAW CHARACTERS
      // ------------------------------------
      if (state.phase !== 'entrance' && state.phase !== 'done') {
        // Indian horse and rider
        const indianHorseX = state.indianX;
        const indianHorseY = horizonY - 12;
        const indianCycle = state.time * 0.18 * 1.15;
        const indianBounceY = Math.sin(indianCycle * 2) * 3.5;
        const indianSway = Math.sin(indianCycle) * 0.08;

        drawStarflightHorse(ctx, indianHorseX, indianHorseY + indianBounceY, state.time, colors.textWhite, 1.15, 'indian', indianSway);
      }

      // Cowboy horse and rider
      if (state.cowboyX < width + 120) {
        const cowboyHorseX = state.cowboyX + (state.cowboyMounted ? 0 : state.horseRunAwayX);
        const cowboyHorseY = horizonY - 12;
        const cowboyCycle = state.time * 0.18 * 1.0;
        const cowboyBounceY = Math.sin(cowboyCycle * 2) * 3.5;
        const cowboySway = Math.sin(cowboyCycle) * 0.09;
        
        // draw horse and rider
        if (state.cowboyMounted) {
          drawStarflightHorse(ctx, cowboyHorseX, cowboyHorseY + cowboyBounceY, state.time, colors.textWhite, 1.0, 'cowboy', cowboySway);
        } else {
          drawStarflightHorse(ctx, cowboyHorseX, cowboyHorseY + Math.sin(state.time * 0.18 * 1.15 * 2) * 3.5, state.time, colors.textWhite, 1.15, 'none');
          drawStarflightCowboy(ctx, state.cowboyFallX, state.cowboyFallY, state.time, colors.textWhite, false, state.cowboyFallAngle, 0);
        }
      }

      state.frameId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(stateRef.current.frameId);
      observer.disconnect();
    };
  }, [isLoading]);

  // Demo play manual triggers
  const handleFireArrow = () => {
    inputRef.current.fireArrow = true;
  };

  const handleFireColt = () => {
    inputRef.current.fireColt = true;
  };

  const handleTriggerAPIComplete = () => {
    setSimulatedComplete(true);
  };

  const handleResetDemo = () => {
    setSimulatedComplete(false);
    setDemoState('running');
    const s = stateRef.current;
    s.cowboyX = 1000; // Start off-screen right
    s.indianX = 1000; // Start off-screen right
    s.phase = 'entrance';
    s.projectiles = [];
    s.sparks = [];
    s.cowboyMounted = true;
    s.cowboyFallAngle = 0;
    s.cowboyFallX = 0;
    s.cowboyFallY = 0;
    s.horseRunAwayX = 0;
    s.onFinishedTriggered = false;
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div 
        ref={containerRef} 
        className="w-full bg-black relative overflow-hidden group shadow-[inset_0_0_30px_rgba(229,9,20,0.15)]"
      >
        <canvas 
          ref={canvasRef} 
          className="block w-full outline-none h-[220px]"
        />
        
        {/* CRT Overlay scanlines */}
        <div className="absolute inset-0 pointer-events-none opacity-15 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.25)_50%),_linear-gradient(90deg,_rgba(255,0,0,0.06),_rgba(0,255,0,0.02),_rgba(0,0,255,0.06))] bg-[size:100%_4px,_6px_100%]" />
      </div>

      {interactiveDemo && (
        <div className="mt-4 flex flex-wrap justify-center gap-3 w-full">
          <button
            onClick={handleResetDemo}
            className="px-3 py-1.5 bg-neutral-900 text-zita-onbg border border-white/20 rounded hover:border-zita-primary transition-all font-mono text-[10px] uppercase font-bold tracking-wider"
          >
            🔄 Reset Scenario
          </button>
          <button
            onClick={handleFireArrow}
            className="px-3 py-1.5 bg-neutral-950 text-white border border-white/10 rounded hover:border-white/40 transition-all font-mono text-[10px] uppercase tracking-wider"
          >
            🏹 Fire Arrow
          </button>
          <button
            onClick={handleFireColt}
            className="px-3 py-1.5 bg-neutral-950 text-zita-amber border border-zita-amber/20 rounded hover:border-zita-amber transition-all font-mono text-[10px] uppercase tracking-wider"
          >
            🔫 Shoot Six-Shooter
          </button>
          {!simulatedComplete ? (
            <button
              onClick={handleTriggerAPIComplete}
              className="px-3 py-1.5 bg-zita-primary/20 text-zita-primary border border-zita-primary/50 rounded hover:bg-zita-primary hover:text-white transition-all font-mono text-[10px] uppercase font-bold tracking-wider"
            >
              🎯 Test Fatal Arrow Finish
            </button>
          ) : (
            <span className="px-3 py-1.5 font-mono text-[10px] uppercase text-green-500 font-bold bg-green-500/10 rounded">
              Finish Sequence Active!
            </span>
          )}
        </div>
      )}
    </div>
  );
}
