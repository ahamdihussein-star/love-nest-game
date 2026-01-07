import React, { useState, useEffect, useRef, useCallback } from 'react';

const App = () => {
  // Game flow: start -> selectP1 -> selectP2 -> outside
  const [gameState, setGameState] = useState('start');
  
  // Player character assignments
  const [player1Char, setPlayer1Char] = useState(null); // 'ahmed' or 'roro'
  const [player2Char, setPlayer2Char] = useState(null);
  
  // Delete mode for removing items
  const [deleteMode, setDeleteMode] = useState(false);
  const [movingItem, setMovingItem] = useState(null); // {type: 'plant'/'furniture', data: item, room: 'livingRoom'}
  
  const [ahmedPos, setAhmedPos] = useState({ x: 20, y: 85 });
  const [roroPos, setRoroPos] = useState({ x: 30, y: 85 });
  const [ahmedDir, setAhmedDir] = useState('right');
  const [roroDir, setRoroDir] = useState('right');
  const [ahmedMoving, setAhmedMoving] = useState(false);
  const [roroMoving, setRoroMoving] = useState(false);
  
  const [animFrame, setAnimFrame] = useState(0);
  
  const [paintMode, setPaintMode] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#FFB6C1');
  const [houseOverlay, setHouseOverlay] = useState('none');
  
  const [plants, setPlants] = useState([]);
  const [plantMode, setPlantMode] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState('tulips');
  
  const [furniture, setFurniture] = useState({
    livingRoom: [],
    bedroom: [],
    kitchen: []
  });
  const [placingFurniture, setPlacingFurniture] = useState(null);
  const [hearts, setHearts] = useState([]);
  
  // Refs for keyboard handler
  const gameStateRef = useRef(gameState);
  const ahmedPosRef = useRef(ahmedPos);
  const roroPosRef = useRef(roroPos);
  const paintModeRef = useRef(paintMode);
  const plantModeRef = useRef(plantMode);
  const deleteModeRef = useRef(deleteMode);
  const selectedColorRef = useRef(selectedColor);
  const selectedPlantRef = useRef(selectedPlant);
  const placingFurnitureRef = useRef(placingFurniture);
  const plantsRef = useRef(plants);
  const furnitureRef = useRef(furniture);
  const movingItemRef = useRef(movingItem);
  
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { ahmedPosRef.current = ahmedPos; }, [ahmedPos]);
  useEffect(() => { roroPosRef.current = roroPos; }, [roroPos]);
  useEffect(() => { paintModeRef.current = paintMode; }, [paintMode]);
  useEffect(() => { plantModeRef.current = plantMode; }, [plantMode]);
  useEffect(() => { deleteModeRef.current = deleteMode; }, [deleteMode]);
  useEffect(() => { selectedColorRef.current = selectedColor; }, [selectedColor]);
  useEffect(() => { selectedPlantRef.current = selectedPlant; }, [selectedPlant]);
  useEffect(() => { placingFurnitureRef.current = placingFurniture; }, [placingFurniture]);
  useEffect(() => { plantsRef.current = plants; }, [plants]);
  useEffect(() => { furnitureRef.current = furniture; }, [furniture]);
  useEffect(() => { movingItemRef.current = movingItem; }, [movingItem]);
  
  const keysPressed = useRef(new Set());
  
  useEffect(() => {
    const interval = setInterval(() => setAnimFrame(f => (f + 1) % 60), 50);
    return () => clearInterval(interval);
  }, []);
  
  const addHeart = useCallback((pos) => {
    const id = Date.now() + Math.random();
    setHearts(prev => [...prev, { id, x: pos.x, y: pos.y }]);
    setTimeout(() => setHearts(prev => prev.filter(h => h.id !== id)), 2000);
  }, []);
  
  // Find nearby item to pick up
  const findNearbyItem = (pos, state) => {
    const threshold = 10;
    
    if (state === 'outside') {
      // Check plants
      const plantIndex = plantsRef.current.findIndex(p => 
        Math.abs(p.x - pos.x) < threshold && Math.abs(p.y - pos.y) < threshold
      );
      if (plantIndex !== -1) return { type: 'plant', index: plantIndex, data: plantsRef.current[plantIndex] };
    } else {
      // Check furniture
      const room = state;
      const items = furnitureRef.current[room] || [];
      const itemIndex = items.findIndex(item =>
        Math.abs(item.x - pos.x) < threshold && Math.abs(item.y - pos.y) < threshold
      );
      if (itemIndex !== -1) return { type: 'furniture', room, index: itemIndex, data: items[itemIndex] };
    }
    return null;
  };
  
  // Pick up item to move
  const pickupItem = (pos, state) => {
    const item = findNearbyItem(pos, state);
    if (item) {
      // Remove from original position
      if (item.type === 'plant') {
        setPlants(prev => prev.filter((_, i) => i !== item.index));
        setMovingItem({ type: 'plant', data: item.data });
      } else if (item.type === 'furniture') {
        setFurniture(prev => ({
          ...prev,
          [item.room]: prev[item.room].filter((_, i) => i !== item.index)
        }));
        setMovingItem({ type: 'furniture', data: item.data, room: item.room });
      }
      addHeart(pos);
      return true;
    }
    return false;
  };
  
  // Place moving item at new position
  const placeItem = (pos, state) => {
    const item = movingItemRef.current;
    if (!item) return false;
    
    if (item.type === 'plant' && state === 'outside') {
      setPlants(prev => [...prev, { ...item.data, x: pos.x, y: pos.y + 2 }]);
      setMovingItem(null);
      addHeart(pos);
      return true;
    } else if (item.type === 'furniture' && state !== 'outside') {
      setFurniture(prev => ({
        ...prev,
        [state]: [...prev[state], { ...item.data, x: pos.x, y: pos.y }]
      }));
      setMovingItem(null);
      addHeart(pos);
      return true;
    }
    return false;
  };
  
  const handleInteraction = useCallback((char) => {
    const pos = char === 'ahmed' ? ahmedPosRef.current : roroPosRef.current;
    const state = gameStateRef.current;
    
    // Move mode - pick up or place items
    if (deleteModeRef.current) {
      // If already holding something, place it
      if (movingItemRef.current) {
        if (placeItem(pos, state)) return;
      } else {
        // Try to pick up nearby item
        if (pickupItem(pos, state)) return;
      }
    }
    
    if (state === 'outside') {
      const nearHouse = pos.x > 35 && pos.x < 65 && pos.y < 75;
      
      if (paintModeRef.current && nearHouse) {
        setHouseOverlay(selectedColorRef.current);
        addHeart(pos);
        return;
      }
      
      if (nearHouse && !paintModeRef.current && !plantModeRef.current && !deleteModeRef.current) {
        setGameState('livingRoom');
        setAhmedPos({ x: 30, y: 80 });
        setRoroPos({ x: 70, y: 80 });
        addHeart(pos);
        return;
      }
      
      if (plantModeRef.current) {
        setPlants(prev => [...prev, {
          id: Date.now() + Math.random(),
          x: pos.x,
          y: pos.y + 2,
          type: selectedPlantRef.current
        }]);
        addHeart(pos);
        return;
      }
    }
    
    if (state === 'livingRoom') {
      if (pos.y > 85 && !deleteModeRef.current) {
        setGameState('outside');
        setAhmedPos({ x: 45, y: 80 });
        setRoroPos({ x: 55, y: 80 });
        return;
      }
      if (pos.x < 12 && !deleteModeRef.current) {
        setGameState('bedroom');
        setAhmedPos({ x: 85, y: 75 });
        setRoroPos({ x: 75, y: 75 });
        return;
      }
      if (pos.x > 88 && !deleteModeRef.current) {
        setGameState('kitchen');
        setAhmedPos({ x: 15, y: 75 });
        setRoroPos({ x: 25, y: 75 });
        return;
      }
      if (placingFurnitureRef.current && !deleteModeRef.current) {
        setFurniture(prev => ({
          ...prev,
          livingRoom: [...prev.livingRoom, { type: placingFurnitureRef.current, x: pos.x, y: pos.y }]
        }));
        setPlacingFurniture(null);
        addHeart(pos);
        return;
      }
    }
    
    if (state === 'bedroom') {
      if (pos.x > 88 && !deleteModeRef.current) {
        setGameState('livingRoom');
        setAhmedPos({ x: 15, y: 75 });
        setRoroPos({ x: 25, y: 75 });
        return;
      }
      if (placingFurnitureRef.current && !deleteModeRef.current) {
        setFurniture(prev => ({
          ...prev,
          bedroom: [...prev.bedroom, { type: placingFurnitureRef.current, x: pos.x, y: pos.y }]
        }));
        setPlacingFurniture(null);
        addHeart(pos);
        return;
      }
    }
    
    if (state === 'kitchen') {
      if (pos.x < 12 && !deleteModeRef.current) {
        setGameState('livingRoom');
        setAhmedPos({ x: 85, y: 75 });
        setRoroPos({ x: 75, y: 75 });
        return;
      }
      if (placingFurnitureRef.current && !deleteModeRef.current) {
        setFurniture(prev => ({
          ...prev,
          kitchen: [...prev.kitchen, { type: placingFurnitureRef.current, x: pos.x, y: pos.y }]
        }));
        setPlacingFurniture(null);
        addHeart(pos);
        return;
      }
    }
  }, [addHeart]);
  
  useEffect(() => {
    if (!['outside', 'livingRoom', 'bedroom', 'kitchen'].includes(gameState)) return;
    
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      keysPressed.current.add(key);
      
      // Player 1 interaction
      if (player1Char === 'ahmed' && key === 'e') {
        e.preventDefault();
        handleInteraction('ahmed');
      } else if (player1Char === 'roro' && key === 'e') {
        e.preventDefault();
        handleInteraction('roro');
      }
      
      // Player 2 interaction
      if (player2Char === 'ahmed' && (e.key === ' ' || e.code === 'Space')) {
        e.preventDefault();
        handleInteraction('ahmed');
      } else if (player2Char === 'roro' && (e.key === ' ' || e.code === 'Space')) {
        e.preventDefault();
        handleInteraction('roro');
      }
    };
    
    const handleKeyUp = (e) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };
    
    const moveInterval = setInterval(() => {
      const keys = keysPressed.current;
      const speed = 2;
      
      const state = gameStateRef.current;
      let minY = state === 'outside' ? 68 : 55;
      let maxY = state === 'outside' ? 95 : 90;
      
      // Player 1 controls: WASD
      const p1SetPos = player1Char === 'ahmed' ? setAhmedPos : setRoroPos;
      const p1SetDir = player1Char === 'ahmed' ? setAhmedDir : setRoroDir;
      const p1SetMoving = player1Char === 'ahmed' ? setAhmedMoving : setRoroMoving;
      
      let p1Moving = false;
      if (keys.has('w')) { p1SetPos(p => ({ ...p, y: Math.max(minY, p.y - speed) })); p1Moving = true; }
      if (keys.has('s')) { p1SetPos(p => ({ ...p, y: Math.min(maxY, p.y + speed) })); p1Moving = true; }
      if (keys.has('a')) { p1SetDir('left'); p1SetPos(p => ({ ...p, x: Math.max(5, p.x - speed) })); p1Moving = true; }
      if (keys.has('d')) { p1SetDir('right'); p1SetPos(p => ({ ...p, x: Math.min(95, p.x + speed) })); p1Moving = true; }
      p1SetMoving(p1Moving);
      
      // Player 2 controls: Arrows
      const p2SetPos = player2Char === 'ahmed' ? setAhmedPos : setRoroPos;
      const p2SetDir = player2Char === 'ahmed' ? setAhmedDir : setRoroDir;
      const p2SetMoving = player2Char === 'ahmed' ? setAhmedMoving : setRoroMoving;
      
      let p2Moving = false;
      if (keys.has('arrowup')) { p2SetPos(p => ({ ...p, y: Math.max(minY, p.y - speed) })); p2Moving = true; }
      if (keys.has('arrowdown')) { p2SetPos(p => ({ ...p, y: Math.min(maxY, p.y + speed) })); p2Moving = true; }
      if (keys.has('arrowleft')) { p2SetDir('left'); p2SetPos(p => ({ ...p, x: Math.max(5, p.x - speed) })); p2Moving = true; }
      if (keys.has('arrowright')) { p2SetDir('right'); p2SetPos(p => ({ ...p, x: Math.min(95, p.x + speed) })); p2Moving = true; }
      p2SetMoving(p2Moving);
    }, 30);
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearInterval(moveInterval);
    };
  }, [gameState, handleInteraction, player1Char, player2Char]);
  
  // Mobile controls now use touch gestures instead of buttons
  
  const Character = ({ type, position, direction, isMoving, playerNum }) => {
    const bounce = isMoving ? Math.sin(animFrame * 0.5) * 5 : 0;
    const breathe = !isMoving ? Math.sin(animFrame * 0.1) * 2 : 0;
    const controlKey = playerNum === 1 ? 'E' : 'Space';
    
    return (
      <div style={{
        position: 'absolute',
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -100%)',
        zIndex: Math.floor(position.y) + 10,
        transition: 'left 0.1s, top 0.1s',
      }}>
        <div style={{
          position: 'absolute',
          bottom: '0',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '180px',
          height: '45px',
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.3) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        
        <div style={{
          position: 'absolute',
          top: '-45px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: type === 'ahmed' ? '#FF8F00' : '#D81B60',
          color: 'white',
          padding: '6px 16px',
          borderRadius: '15px',
          fontSize: '15px',
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
        }}>
          {playerNum === 1 ? '🎮1' : '🎮2'} {type === 'ahmed' ? 'أحمد' : 'رورو'} ({controlKey})
        </div>
        
        <div style={{
          transform: `scaleX(${direction === 'left' ? -1 : 1}) translateY(${-bounce + breathe}px)`,
          transformOrigin: 'bottom center',
        }}>
          <img src={`/assets/${type === 'ahmed' ? 'Ahmed' : 'Roro'}.png`} alt={type} style={{ height: '500px' }} />
        </div>
      </div>
    );
  };
  
  const Plant = ({ plant }) => (
    <div style={{
      position: 'absolute',
      left: `${plant.x}%`,
      top: `${plant.y}%`,
      transform: 'translate(-50%, -100%)',
      zIndex: Math.floor(plant.y),
      border: deleteMode ? '3px dashed #FF9800' : 'none',
      borderRadius: '8px',
      padding: deleteMode ? '4px' : '0',
      background: deleteMode ? 'rgba(255,152,0,0.1)' : 'transparent',
      cursor: deleteMode ? 'pointer' : 'default',
    }}>
      <img src={`/assets/${plant.type}.png`} alt={plant.type} style={{ height: '180px' }} />
    </div>
  );
  
  const FurnitureItem = ({ item }) => {
    const sizes = { sofa: '500px', table: '380px', lamp: '450px', bed: '550px', fridge: '500px', stove: '420px' };
    return (
      <div style={{
        position: 'absolute',
        left: `${item.x}%`,
        top: `${item.y}%`,
        transform: 'translate(-50%, -100%)',
        zIndex: Math.floor(item.y),
        border: deleteMode ? '3px dashed #FF9800' : 'none',
        borderRadius: '8px',
        padding: deleteMode ? '4px' : '0',
        background: deleteMode ? 'rgba(255,152,0,0.1)' : 'transparent',
        cursor: deleteMode ? 'pointer' : 'default',
      }}>
        <img src={`/assets/${item.type}.png`} alt={item.type} style={{ height: sizes[item.type] || '80px' }} />
      </div>
    );
  };
  
  const MobileCtrl = ({ playerNum, side }) => {
    // Touch controls are now handled by the main game area
    return null;
  };
  
  const mobBtn = {}; // No longer needed
  
  // Touch handling state
  const lastTapRef = useRef({ time: 0, x: 0, y: 0 });
  const touchStartRef = useRef({ x: 0, y: 0, player: null });
  
  const handleTouchStart = (e) => {
    if (!['outside', 'livingRoom', 'bedroom', 'kitchen'].includes(gameState)) return;
    
    const touch = e.touches[0];
    const screenWidth = window.innerWidth;
    const isLeftSide = touch.clientX < screenWidth / 2;
    const playerNum = isLeftSide ? 1 : 2;
    
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      player: playerNum
    };
    
    // Check for double tap
    const now = Date.now();
    const timeDiff = now - lastTapRef.current.time;
    const distance = Math.sqrt(
      Math.pow(touch.clientX - lastTapRef.current.x, 2) +
      Math.pow(touch.clientY - lastTapRef.current.y, 2)
    );
    
    if (timeDiff < 300 && distance < 50) {
      // Double tap - interact!
      const char = playerNum === 1 ? player1Char : player2Char;
      handleInteraction(char);
      lastTapRef.current = { time: 0, x: 0, y: 0 };
    } else {
      lastTapRef.current = { time: now, x: touch.clientX, y: touch.clientY };
    }
  };
  
  const handleTouchMove = (e) => {
    if (!touchStartRef.current.player) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const playerNum = touchStartRef.current.player;
    const char = playerNum === 1 ? player1Char : player2Char;
    
    const setPos = char === 'ahmed' ? setAhmedPos : setRoroPos;
    const setDir = char === 'ahmed' ? setAhmedDir : setRoroDir;
    const setMoving = char === 'ahmed' ? setAhmedMoving : setRoroMoving;
    
    // Calculate movement
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    
    // Update direction
    if (Math.abs(deltaX) > 5) {
      setDir(deltaX > 0 ? 'right' : 'left');
    }
    
    // Convert to percentage movement
    const moveX = (deltaX / window.innerWidth) * 100;
    const moveY = (deltaY / window.innerHeight) * 100;
    
    const state = gameStateRef.current;
    const minY = state === 'outside' ? 68 : 55;
    const maxY = state === 'outside' ? 95 : 90;
    
    setPos(p => ({
      x: Math.max(5, Math.min(95, p.x + moveX)),
      y: Math.max(minY, Math.min(maxY, p.y + moveY))
    }));
    
    setMoving(true);
    
    // Update start position for continuous movement
    touchStartRef.current.x = touch.clientX;
    touchStartRef.current.y = touch.clientY;
  };
  
  const handleTouchEnd = () => {
    if (touchStartRef.current.player) {
      const char = touchStartRef.current.player === 1 ? player1Char : player2Char;
      const setMoving = char === 'ahmed' ? setAhmedMoving : setRoroMoving;
      setMoving(false);
    }
    touchStartRef.current = { x: 0, y: 0, player: null };
  };
  
  // Start Screen
  if (gameState === 'start') {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea, #764ba2, #f093fb)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'Cairo, sans-serif',
        padding: '20px',
        textAlign: 'center',
      }}>
        <h1 style={{ fontSize: '32px', margin: '0 0 10px' }}>🏠 عش الحب 💕</h1>
        <p style={{ margin: '0 0 15px' }}>ابنوا بيت أحلامكم سوا!</p>
        
        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
          <img src="/assets/Ahmed.png" alt="Ahmed" style={{ height: '100px' }} />
          <img src="/assets/Roro.png" alt="Roro" style={{ height: '100px' }} />
        </div>
        
        <button onClick={() => setGameState('selectP1')} style={{
          background: 'linear-gradient(135deg, #E91E63, #FF5722)',
          color: 'white',
          border: 'none',
          padding: '15px 50px',
          borderRadius: '25px',
          fontSize: '20px',
          fontWeight: 'bold',
          cursor: 'pointer',
        }}>
          يلا نبدأ! 🎉
        </button>
      </div>
    );
  }
  
  // Player 1 Selection
  if (gameState === 'selectP1') {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        background: 'linear-gradient(135deg, #1a237e, #4a148c)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'Cairo, sans-serif',
        padding: '20px',
        textAlign: 'center',
      }}>
        <h2 style={{ fontSize: '24px', margin: '0 0 5px' }}>🎮 اللاعب الأول</h2>
        <p style={{ margin: '0 0 20px', opacity: 0.8 }}>اختار شخصيتك (WASD + E)</p>
        
        <div style={{ display: 'flex', gap: '30px' }}>
          <div 
            onClick={() => { setPlayer1Char('ahmed'); setGameState('selectP2'); }}
            style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '20px 30px',
              borderRadius: '20px',
              cursor: 'pointer',
              transition: 'all 0.3s',
              border: '3px solid transparent',
            }}
            onMouseEnter={e => e.target.style.border = '3px solid #FF8F00'}
            onMouseLeave={e => e.target.style.border = '3px solid transparent'}
          >
            <img src="/assets/Ahmed.png" alt="Ahmed" style={{ height: '150px' }} />
            <p style={{ margin: '10px 0 0', fontSize: '18px', fontWeight: 'bold' }}>⭐ أحمد</p>
          </div>
          
          <div 
            onClick={() => { setPlayer1Char('roro'); setGameState('selectP2'); }}
            style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '20px 30px',
              borderRadius: '20px',
              cursor: 'pointer',
              transition: 'all 0.3s',
              border: '3px solid transparent',
            }}
            onMouseEnter={e => e.target.style.border = '3px solid #D81B60'}
            onMouseLeave={e => e.target.style.border = '3px solid transparent'}
          >
            <img src="/assets/Roro.png" alt="Roro" style={{ height: '150px' }} />
            <p style={{ margin: '10px 0 0', fontSize: '18px', fontWeight: 'bold' }}>💖 رورو</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Player 2 Selection
  if (gameState === 'selectP2') {
    const otherChar = player1Char === 'ahmed' ? 'roro' : 'ahmed';
    
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        background: 'linear-gradient(135deg, #4a148c, #880e4f)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'Cairo, sans-serif',
        padding: '20px',
        textAlign: 'center',
      }}>
        <h2 style={{ fontSize: '24px', margin: '0 0 5px' }}>🎮 اللاعب الثاني</h2>
        <p style={{ margin: '0 0 20px', opacity: 0.8 }}>شخصيتك (⬆️⬇️⬅️➡️ + Space)</p>
        
        <div 
          onClick={() => { setPlayer2Char(otherChar); setGameState('outside'); }}
          style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '20px 30px',
            borderRadius: '20px',
            cursor: 'pointer',
            border: `3px solid ${otherChar === 'ahmed' ? '#FF8F00' : '#D81B60'}`,
          }}
        >
          <img src={`/assets/${otherChar === 'ahmed' ? 'Ahmed' : 'Roro'}.png`} alt={otherChar} style={{ height: '150px' }} />
          <p style={{ margin: '10px 0 0', fontSize: '18px', fontWeight: 'bold' }}>
            {otherChar === 'ahmed' ? '⭐ أحمد' : '💖 رورو'}
          </p>
        </div>
        
        <p style={{ marginTop: '20px', opacity: 0.7, fontSize: '14px' }}>
          🎮1 اختار {player1Char === 'ahmed' ? 'أحمد' : 'رورو'}
        </p>
        
        <button onClick={() => { setPlayer2Char(otherChar); setGameState('outside'); }} style={{
          marginTop: '20px',
          background: 'linear-gradient(135deg, #E91E63, #FF5722)',
          color: 'white',
          border: 'none',
          padding: '12px 40px',
          borderRadius: '25px',
          fontSize: '18px',
          fontWeight: 'bold',
          cursor: 'pointer',
        }}>
          ابدأ اللعب! 🚀
        </button>
      </div>
    );
  }
  
  // Main Game
  const nearHouse = (ahmedPos.x > 35 && ahmedPos.x < 65 && ahmedPos.y < 75) ||
                    (roroPos.x > 35 && roroPos.x < 65 && roroPos.y < 75);
  
  const p1Char = player1Char;
  const p2Char = player2Char;
  
  return (
    <div 
      style={{
        width: '100%',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Cairo, sans-serif',
        touchAction: 'none',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {gameState === 'outside' && (
        <div style={{ position: 'absolute', width: '100%', height: '100%' }}>
          <img src="/assets/landscape.png" alt="Landscape"
            style={{ position: 'absolute', width: '100%', height: '60%', objectFit: 'cover', top: 0 }} />
          <div style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
            height: '45%',
            background: 'linear-gradient(180deg, #4CAF50 0%, #388E3C 100%)',
          }} />
        </div>
      )}
      
      {gameState === 'livingRoom' && (
        <img src="/assets/living_room.png" alt="Living Room"
          style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }} />
      )}
      {gameState === 'bedroom' && (
        <img src="/assets/bedroom.png" alt="Bedroom"
          style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }} />
      )}
      {gameState === 'kitchen' && (
        <img src="/assets/Kitchen.png" alt="Kitchen"
          style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }} />
      )}
      
      {gameState === 'outside' && (
        <div style={{
          position: 'absolute',
          left: '50%',
          bottom: '40%',
          transform: 'translateX(-50%)',
          zIndex: 30,
        }}>
          <img src="/assets/Home.png" alt="House" style={{ height: '400px' }} />
          {houseOverlay !== 'none' && (
            <div style={{
              position: 'absolute',
              top: '10%',
              left: '8%',
              width: '84%',
              height: '60%',
              background: houseOverlay,
              opacity: 0.35,
              borderRadius: '5px',
              pointerEvents: 'none',
            }} />
          )}
        </div>
      )}
      
      {gameState === 'outside' && plants.map(p => <Plant key={p.id} plant={p} />)}
      
      {gameState !== 'outside' && furniture[gameState]?.map((item, i) => (
        <FurnitureItem key={i} item={item} />
      ))}
      
      <Character type="ahmed" position={ahmedPos} direction={ahmedDir} isMoving={ahmedMoving} 
        playerNum={p1Char === 'ahmed' ? 1 : 2} />
      <Character type="roro" position={roroPos} direction={roroDir} isMoving={roroMoving}
        playerNum={p1Char === 'roro' ? 1 : 2} />
      
      {hearts.map(h => (
        <div key={h.id} style={{
          position: 'absolute',
          left: `${h.x}%`,
          top: `${h.y}%`,
          fontSize: '25px',
          zIndex: 500,
          animation: 'floatUp 2s forwards',
          pointerEvents: 'none',
        }}>💕</div>
      ))}
      
      {/* Moving item indicator - follows first character */}
      {movingItem && (
        <div style={{
          position: 'absolute',
          left: `${ahmedPos.x + 5}%`,
          top: `${ahmedPos.y - 25}%`,
          zIndex: 600,
          animation: 'bounce 0.5s infinite',
          pointerEvents: 'none',
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
        }}>
          {movingItem.type === 'plant' ? (
            <img src={`/assets/${movingItem.data.type}.png`} alt="moving" style={{ height: '100px', opacity: 0.9 }} />
          ) : (
            <img src={`/assets/${movingItem.data.type}.png`} alt="moving" style={{ height: '120px', opacity: 0.9 }} />
          )}
        </div>
      )}
      
      {/* Instructions */}
      {gameState === 'outside' && nearHouse && !paintMode && !plantMode && !deleteMode && (
        <div style={{
          position: 'absolute',
          top: '8%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.85)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: 'bold',
          zIndex: 100,
        }}>
          🚪 اضغط E أو Space لدخول البيت
        </div>
      )}
      
      {deleteMode && (
        <div style={{
          position: 'absolute',
          top: '8%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: movingItem ? '#FF9800' : '#f44336',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: 'bold',
          zIndex: 100,
        }}>
          {movingItem ? (
            <>📦 شايل {movingItem.type === 'plant' ? 'نبات' : 'أثاث'} - روح للمكان الجديد واضغط E أو Space</>
          ) : (
            <>🔄 وضع النقل - روح للعنصر واضغط E أو Space لشيله</>
          )}
        </div>
      )}
      
      {/* Room navigation */}
      {gameState === 'livingRoom' && (
        <>
          <div style={{ position: 'absolute', left: '10px', top: '50%', fontSize: '14px', color: '#333', zIndex: 50 }}>🛏️ ←</div>
          <div style={{ position: 'absolute', right: '10px', top: '50%', fontSize: '14px', color: '#333', zIndex: 50 }}>→ 🍳</div>
          <div style={{ position: 'absolute', bottom: '5%', left: '50%', transform: 'translateX(-50%)', fontSize: '12px', color: '#333', zIndex: 50 }}>↓ خروج</div>
        </>
      )}
      {gameState === 'bedroom' && (
        <div style={{ position: 'absolute', right: '10px', top: '50%', fontSize: '14px', color: '#333', zIndex: 50 }}>→ 🛋️</div>
      )}
      {gameState === 'kitchen' && (
        <div style={{ position: 'absolute', left: '10px', top: '50%', fontSize: '14px', color: '#333', zIndex: 50 }}>🛋️ ←</div>
      )}
      
      {/* Location */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: gameState === 'outside' ? '#43A047' : '#1976D2',
        color: 'white',
        padding: '5px 12px',
        borderRadius: '10px',
        fontWeight: 'bold',
        fontSize: '12px',
        zIndex: 100,
      }}>
        📍 {gameState === 'outside' ? 'الحديقة' : gameState === 'livingRoom' ? 'الصالون' : gameState === 'bedroom' ? 'غرفة النوم' : 'المطبخ'}
      </div>
      
      {/* Control Panel */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'rgba(255,255,255,0.95)',
        borderRadius: '12px',
        padding: '10px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
        maxWidth: '150px',
        zIndex: 100,
        fontSize: '11px',
      }}>
        {/* Delete mode button - always visible */}
        <button onClick={() => { 
          setDeleteMode(!deleteMode); 
          setPaintMode(false); 
          setPlantMode(false); 
          setPlacingFurniture(null);
          if (deleteMode) setMovingItem(null); // Cancel moving when exiting mode
        }} style={{
          width: '100%',
          padding: '8px',
          marginBottom: '5px',
          borderRadius: '8px',
          border: 'none',
          background: deleteMode ? (movingItem ? '#FF9800' : '#f44336') : '#ffebee',
          color: deleteMode ? 'white' : '#c62828',
          fontWeight: 'bold',
          cursor: 'pointer',
          fontFamily: 'Cairo',
        }}>
          {deleteMode ? (movingItem ? '📦 شايل عنصر...' : '🗑️ وضع النقل ✓') : '🔄 نقل/حذف'}
        </button>
        
        {deleteMode && (
          <p style={{ fontSize: '9px', color: '#666', margin: '0 0 5px', textAlign: 'center' }}>
            {movingItem ? 'روح للمكان الجديد واضغط ✓' : 'روح للعنصر واضغط ✓ لشيله'}
          </p>
        )}
        
        {gameState === 'outside' && (
          <>
            <button onClick={() => { setPaintMode(!paintMode); setPlantMode(false); setDeleteMode(false); }} style={{
              width: '100%',
              padding: '8px',
              marginBottom: '5px',
              borderRadius: '8px',
              border: 'none',
              background: paintMode ? '#E91E63' : '#EEE',
              color: paintMode ? 'white' : '#333',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontFamily: 'Cairo',
            }}>
              🎨 {paintMode ? 'دهان ✓' : 'دهان البيت'}
            </button>
            
            {paintMode && (
              <div style={{ marginBottom: '8px', padding: '5px', background: '#fafafa', borderRadius: '6px' }}>
                <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {['#FFEFD5', '#FFB6C1', '#87CEEB', '#98FB98', '#DDA0DD', '#F0E68C', '#FF6B6B', '#4ECDC4'].map(c => (
                    <div key={c} onClick={() => setSelectedColor(c)} style={{
                      width: '22px',
                      height: '22px',
                      background: c,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      border: selectedColor === c ? '3px solid #333' : '2px solid #ddd',
                    }} />
                  ))}
                </div>
              </div>
            )}
            
            <button onClick={() => { setPlantMode(!plantMode); setPaintMode(false); setDeleteMode(false); }} style={{
              width: '100%',
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: plantMode ? '#4CAF50' : '#EEE',
              color: plantMode ? 'white' : '#333',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontFamily: 'Cairo',
            }}>
              🌱 {plantMode ? 'زراعة ✓' : 'زراعة'}
            </button>
            
            {plantMode && (
              <div style={{ display: 'flex', gap: '3px', marginTop: '5px', justifyContent: 'center' }}>
                {['tulips', 'roses', 'sunflower', 'bush'].map(p => (
                  <div key={p} onClick={() => setSelectedPlant(p)} style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    border: selectedPlant === p ? '2px solid #4CAF50' : '1px solid #ddd',
                    background: selectedPlant === p ? '#E8F5E9' : 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}>
                    <img src={`/assets/${p}.png`} alt={p} style={{ height: '25px' }} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        
        {gameState !== 'outside' && !deleteMode && (
          <>
            <p style={{ fontWeight: 'bold', margin: '0 0 5px' }}>🪑 أثاث:</p>
            <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {(gameState === 'livingRoom' ? ['sofa', 'table', 'lamp'] :
                gameState === 'bedroom' ? ['bed', 'lamp'] :
                ['fridge', 'stove', 'table']).map(f => (
                <div key={f} onClick={() => setPlacingFurniture(f)} style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '6px',
                  border: placingFurniture === f ? '2px solid #E91E63' : '1px solid #ddd',
                  background: placingFurniture === f ? '#FCE4EC' : 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  <img src={`/assets/${f}.png`} alt={f} style={{ height: '30px' }} />
                </div>
              ))}
            </div>
            {placingFurniture && <p style={{ fontSize: '10px', color: '#E91E63', margin: '5px 0 0', textAlign: 'center' }}>حرك واضغط ✓</p>}
          </>
        )}
      </div>
      
      {/* Touch zone indicators for mobile */}
      <div style={{
        position: 'absolute',
        bottom: '60px',
        left: '10px',
        background: player1Char === 'ahmed' ? 'rgba(255,143,0,0.2)' : 'rgba(216,27,96,0.2)',
        border: `2px dashed ${player1Char === 'ahmed' ? '#FF8F00' : '#D81B60'}`,
        borderRadius: '15px',
        padding: '10px 15px',
        zIndex: 150,
      }}>
        <div style={{ fontWeight: 'bold', fontSize: '12px', color: player1Char === 'ahmed' ? '#FF8F00' : '#D81B60' }}>
          🎮1 {player1Char === 'ahmed' ? 'أحمد' : 'رورو'}
        </div>
        <div style={{ fontSize: '10px', color: '#666' }}>اسحب للتحريك</div>
        <div style={{ fontSize: '10px', color: '#666' }}>انقر مرتين للتفاعل</div>
      </div>
      
      <div style={{
        position: 'absolute',
        bottom: '60px',
        right: '10px',
        background: player2Char === 'ahmed' ? 'rgba(255,143,0,0.2)' : 'rgba(216,27,96,0.2)',
        border: `2px dashed ${player2Char === 'ahmed' ? '#FF8F00' : '#D81B60'}`,
        borderRadius: '15px',
        padding: '10px 15px',
        zIndex: 150,
      }}>
        <div style={{ fontWeight: 'bold', fontSize: '12px', color: player2Char === 'ahmed' ? '#FF8F00' : '#D81B60' }}>
          🎮2 {player2Char === 'ahmed' ? 'أحمد' : 'رورو'}
        </div>
        <div style={{ fontSize: '10px', color: '#666' }}>اسحب للتحريك</div>
        <div style={{ fontSize: '10px', color: '#666' }}>انقر مرتين للتفاعل</div>
      </div>
      
      {/* Screen divider line */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        height: '60%',
        width: '2px',
        background: 'rgba(0,0,0,0.1)',
        zIndex: 5,
        pointerEvents: 'none',
      }} />
      
      <div style={{
        position: 'absolute',
        bottom: '8px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.75)',
        color: 'white',
        padding: '8px 20px',
        borderRadius: '20px',
        fontSize: '11px',
        zIndex: 100,
        textAlign: 'center',
      }}>
        📱 الشمال: 🎮1 | اليمين: 🎮2 | اسحب = تحريك | نقرتين = تفاعل
      </div>
      
      <style>{`
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-50px) scale(1.3); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        /* Touch-friendly buttons */
        button {
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          user-select: none;
        }
        
        /* Prevent zoom on double tap */
        * {
          touch-action: manipulation;
        }
      `}</style>
    </div>
  );
};

export default App;
