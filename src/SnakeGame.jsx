import {useCallback, useEffect, useRef, useState} from 'react';
import SwipeHandler from "./SwipeHandler.jsx";

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{x: 10, y: 10}];
const INITIAL_FOOD = {x: 15, y: 15};
const INITIAL_DIRECTION = {x: 0, y: -1};

const SPEED_SETTINGS = {
    slow: {name: 'SLOW', interval: 300},
    normal: {name: 'NORMAL', interval: 200},
    fast: {name: 'FAST', interval: 150},
    insane: {name: 'INSANE', interval: 100}
};

const SnakeGame = () => {
    const [snake, setSnake] = useState(INITIAL_SNAKE);
    const [food, setFood] = useState(INITIAL_FOOD);
    const [direction, setDirection] = useState(INITIAL_DIRECTION);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [gameSpeed, setGameSpeed] = useState('normal');
    const [showSettings, setShowSettings] = useState(false);
    const [gameState, setGameState] = useState('waiting') // waiting, playing, paused, gameOver

    const arrowKeyProcessingRef = useRef(null);

    const generateFood = useCallback(() => {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE)
            };
        } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
        return newFood;
    }, [snake]);

    const resetGame = () => {
        setSnake(INITIAL_SNAKE);
        setFood(INITIAL_FOOD);
        setDirection(INITIAL_DIRECTION);
        setScore(0);
        setGameState('waiting');
    };

    const startGame = () => {
        resetGame();
        setGameState('playing');
    };

    const togglePause = useCallback(() => {
        if (gameState === 'playing') {
            setGameState('paused');
        }
        if (gameState === 'paused') {
            setGameState('playing');
        }
    }, [gameState]);

    const moveSnake = useCallback(() => {
        if (gameState !== 'playing') return;

        setSnake(currentSnake => {
            const newSnake = [...currentSnake];
            const head = {...newSnake[0]};

            head.x += direction.x;
            head.y += direction.y;

            // Check wall collision
            if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
                setGameState('gameOver');
                if (score > highScore) {
                    setHighScore(score);
                }
                return currentSnake;
            }

            // Check self collision
            if (newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
                setGameState('gameOver');
                if (score > highScore) {
                    setHighScore(score);
                }
                return currentSnake;
            }

            newSnake.unshift(head);

            // Check food collision
            if (head.x === food.x && head.y === food.y) {
                setScore(prev => prev + 1);
                setFood(generateFood());
            } else {
                newSnake.pop();
            }

            return newSnake;
        });
        arrowKeyProcessingRef.current = null;
    }, [gameState, direction.x, direction.y, food.x, food.y, score, highScore, generateFood]);

    const changeDirection = useCallback((key) => {
        switch (key) {
            case 'ArrowUp':
                if (direction.y !== 1) setDirection({x: 0, y: -1});
                break;
            case 'ArrowDown':
                if (direction.y !== -1) setDirection({x: 0, y: 1});
                break;
            case 'ArrowLeft':
                if (direction.x !== 1) setDirection({x: -1, y: 0});
                break;
            case 'ArrowRight':
                if (direction.x !== -1) setDirection({x: 1, y: 0});
                break;
        }
    }, [direction.x, direction.y]);

    const handleKeyDown = useCallback((e) => {
        // Handle pause with spacebar
        if (e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
            togglePause();
            return;
        }

        if (gameState !== 'playing') return;

        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        if (arrowKeyProcessingRef.current) return;
        arrowKeyProcessingRef.current = e.key;
        changeDirection(e.key);
    }, [changeDirection, gameState, togglePause]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    useEffect(() => {
        const gameInterval = setInterval(moveSnake, SPEED_SETTINGS[gameSpeed].interval);
        return () => clearInterval(gameInterval);
    }, [moveSnake, gameSpeed]);

    const renderGrid = () => {
        const grid = [];
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                let cellClass = 'w-4 h-4 border border-gray-800 ';

                // Check if cell is snake head
                if (snake[0] && snake[0].x === col && snake[0].y === row) {
                    cellClass += 'bg-lime-400 shadow-inner relative';
                }
                // Check if cell is snake body
                else if (snake.some((segment, index) => index > 0 && segment.x === col && segment.y === row)) {
                    cellClass += 'bg-green-500 shadow-inner';
                }
                // Check if cell is food
                else if (food.x === col && food.y === row) {
                    cellClass += 'bg-red-500 shadow-inner relative';
                }
                // Empty cell
                else {
                    cellClass += 'bg-gray-900';
                }

                grid.push(
                    <div key={`${row}-${col}`} className={cellClass}>
                        {snake[0] && snake[0].x === col && snake[0].y === row && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-1 h-1 bg-black rounded-full mr-1"></div>
                                <div className="w-1 h-1 bg-black rounded-full"></div>
                            </div>
                        )}
                        {food.x === col && food.y === row && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full opacity-80"></div>
                            </div>
                        )}
                    </div>
                );
            }
        }
        return grid;
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4"
             style={{fontFamily: 'monospace'}}>

            {/* Title */}
            <h1 className="text-4xl font-bold mb-4 text-lime-400 tracking-wider pixel-text">
                🐍 SNAKE
            </h1>

            {/* Score Display */}
            <div className="flex gap-8 mb-4 text-xl">
                <div className="text-white">SCORE: <span
                    className="text-lime-400">{score.toString().padStart(4, '0')}</span></div>
                <div className="text-white">HIGH: <span
                    className="text-yellow-400">{highScore.toString().padStart(4, '0')}</span></div>
                <div className="text-white">SPEED: <span
                    className="text-cyan-400">{SPEED_SETTINGS[gameSpeed].name}</span></div>
            </div>

            {/* Settings Button */}
            <button
                onClick={() => setShowSettings(!showSettings)}
                className="mb-4 px-4 py-2 bg-gray-700 text-white border-2 border-gray-500 hover:bg-gray-600 transition-colors"
            >
                SETTINGS
            </button>

            {/* Settings Panel */}
            {showSettings && (
                <div className="mb-4 p-4 bg-gray-800 border-2 border-gray-600 rounded">
                    <div className="text-center text-white mb-3 font-bold">GAME SPEED</div>
                    <div className="flex gap-2 justify-center">
                        {Object.entries(SPEED_SETTINGS).map(([key, setting]) => (
                            <button
                                key={key}
                                onClick={() => setGameSpeed(key)}
                                className={`px-3 py-1 border-2 font-bold transition-colors ${
                                    gameSpeed === key
                                        ? 'bg-lime-400 text-black border-lime-600'
                                        : 'bg-gray-700 text-white border-gray-500 hover:bg-gray-600'
                                }`}
                            >
                                {setting.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Game Board */}
            <SwipeHandler
                onSwipeUp={() => changeDirection('ArrowUp')}
                onSwipeDown={() => changeDirection('ArrowDown')}
                onSwipeLeft={() => changeDirection('ArrowLeft')}
                onSwipeRight={() => changeDirection('ArrowRight')}
                onDoubleTap={togglePause}
            >
                <div className="relative mb-6">
                    <div
                        className="grid gap-0 border-4 border-lime-400 bg-gray-900 shadow-2xl"
                        style={{
                            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                            imageRendering: 'pixelated'
                        }}
                    >
                        {renderGrid()}
                    </div>

                    {/* Pause Overlay */}
                    {gameState === 'paused' && (
                        <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-yellow-400 mb-2">PAUSED</div>
                                <div className="text-lg text-white mb-4">Press SPACE or click PAUSE to resume</div>
                                <button
                                    onClick={togglePause}
                                    className="px-6 py-2 bg-yellow-400 text-black font-bold hover:bg-yellow-300 transition-colors border-2 border-yellow-600 shadow-lg"
                                >
                                    RESUME
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Game Over Overlay */}
                    {gameState === 'gameOver' && (
                        <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-red-500 mb-2">GAME OVER</div>
                                <div className="text-lg text-white mb-4">Final Score: {score}</div>
                                <button
                                    onClick={startGame}
                                    className="px-6 py-2 bg-lime-400 text-black font-bold hover:bg-lime-300 transition-colors border-2 border-lime-600 shadow-lg"
                                >
                                    PLAY AGAIN
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Start Screen */}
                    {gameState === 'waiting' && (
                        <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-lime-400 mb-4">READY TO PLAY?</div>
                                <button
                                    onClick={startGame}
                                    className="px-6 py-2 bg-lime-400 text-black font-bold hover:bg-lime-300 transition-colors border-2 border-lime-600 shadow-lg mb-4"
                                >
                                    START GAME
                                </button>
                                <div className="text-sm text-gray-400">Use arrow keys to control the snake</div>
                            </div>
                        </div>
                    )}
                </div>
            </SwipeHandler>

            {/* Controls */}
            <div className="text-center">
                <div className="text-gray-400 mb-4">
                    Use <span className="text-white">ARROW KEYS</span> to move • Press <span
                    className="text-white">SPACE</span> to pause
                </div>
                <div className="flex gap-2 justify-center">
                    <button
                        onClick={togglePause}
                        className={`px-4 py-2 border-2 font-bold transition-colors ${
                            gameState === 'playing' ? 'bg-blue-600 text-white border-blue-800 hover:bg-blue-500' :
                                gameState === 'paused' ? 'bg-yellow-400 text-black border-yellow-600 hover:bg-yellow-300' :
                                    'bg-gray-600 text-gray-400 border-gray-700 cursor-not-allowed'
                        }`}
                        disabled={gameState === 'waiting' || gameState === 'gameOver'}
                    >
                        {gameState === 'paused' ? 'RESUME' : 'PAUSE'}
                    </button>
                    <button
                        onClick={resetGame}
                        className="px-4 py-2 bg-gray-700 text-white border-2 border-gray-500 hover:bg-gray-600 transition-colors"
                    >
                        RESET
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SnakeGame;