// Puzzle Game JavaScript

const GRID_SIZE = 6;
const TOTAL_PIECES = GRID_SIZE * GRID_SIZE;
const IMAGE_PATH = 'jungle.png';

let pieces = [];
let draggedPiece = null;
let draggedIndex = null;

// Initialize the puzzle when the page loads
document.addEventListener('DOMContentLoaded', function() {
    initializePuzzle();
    setupEventListeners();
});

function initializePuzzle() {
    const puzzleBoard = document.getElementById('puzzleBoard');
    puzzleBoard.innerHTML = '';
    pieces = [];

    // Create pieces array with their correct positions
    for (let i = 0; i < TOTAL_PIECES; i++) {
        pieces.push({
            id: i,
            currentPosition: i,
            correctPosition: i
        });
    }

    // Shuffle the pieces
    shufflePieces();

    // Render the puzzle
    renderPuzzle();
}

function shufflePieces() {
    // Fisher-Yates shuffle algorithm
    for (let i = pieces.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        // Swap current positions
        const tempPos = pieces[i].currentPosition;
        pieces[i].currentPosition = pieces[j].currentPosition;
        pieces[j].currentPosition = tempPos;
    }
}

function renderPuzzle() {
    const puzzleBoard = document.getElementById('puzzleBoard');
    puzzleBoard.innerHTML = '';

    // Sort pieces by current position for rendering
    const sortedPieces = [...pieces].sort((a, b) => a.currentPosition - b.currentPosition);

    sortedPieces.forEach((piece, index) => {
        const pieceElement = createPieceElement(piece);
        puzzleBoard.appendChild(pieceElement);
    });

    checkCompletion();
}

function createPieceElement(piece) {
    const pieceElement = document.createElement('div');
    pieceElement.className = 'puzzle-piece';
    pieceElement.dataset.id = piece.id;
    pieceElement.dataset.correctPosition = piece.correctPosition;
    pieceElement.draggable = true;

    // Calculate background position based on the piece's correct position (original position in image)
    const correctRow = Math.floor(piece.correctPosition / GRID_SIZE);
    const correctCol = piece.correctPosition % GRID_SIZE;
    
    // Background position percentage for 6x6 grid
    const bgX = (correctCol / (GRID_SIZE - 1)) * 100;
    const bgY = (correctRow / (GRID_SIZE - 1)) * 100;

    pieceElement.style.backgroundImage = `url('${IMAGE_PATH}')`;
    pieceElement.style.backgroundPosition = `${bgX}% ${bgY}%`;

    // Check if piece is in correct position
    if (piece.currentPosition === piece.correctPosition) {
        pieceElement.classList.add('correct');
    }

    // Add drag event listeners
    pieceElement.addEventListener('dragstart', handleDragStart);
    pieceElement.addEventListener('dragend', handleDragEnd);
    pieceElement.addEventListener('dragover', handleDragOver);
    pieceElement.addEventListener('dragenter', handleDragEnter);
    pieceElement.addEventListener('dragleave', handleDragLeave);
    pieceElement.addEventListener('drop', handleDrop);

    // Touch support for mobile
    pieceElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    pieceElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    pieceElement.addEventListener('touchend', handleTouchEnd);

    return pieceElement;
}

// Drag and Drop Handlers
function handleDragStart(e) {
    draggedPiece = e.target;
    draggedIndex = getPieceCurrentPosition(e.target.dataset.id);
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', e.target.dataset.id);
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedPiece = null;
    draggedIndex = null;
    
    // Remove drag-over class from all pieces
    document.querySelectorAll('.puzzle-piece').forEach(piece => {
        piece.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    e.preventDefault();
    if (e.target.classList.contains('puzzle-piece') && e.target !== draggedPiece) {
        e.target.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    e.target.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.target.classList.remove('drag-over');

    if (e.target.classList.contains('puzzle-piece') && e.target !== draggedPiece) {
        const targetId = e.target.dataset.id;
        const draggedId = draggedPiece.dataset.id;
        
        swapPieces(draggedId, targetId);
        renderPuzzle();
    }
}

// Touch handlers for mobile support
let touchStartX, touchStartY;
let touchedPiece = null;
let touchedPieceClone = null;

function handleTouchStart(e) {
    e.preventDefault();
    touchedPiece = e.target;
    touchedPiece.classList.add('dragging');
    
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    
    // Create a clone for visual feedback
    touchedPieceClone = touchedPiece.cloneNode(true);
    touchedPieceClone.style.position = 'fixed';
    touchedPieceClone.style.pointerEvents = 'none';
    touchedPieceClone.style.zIndex = '1000';
    touchedPieceClone.style.width = touchedPiece.offsetWidth + 'px';
    touchedPieceClone.style.height = touchedPiece.offsetHeight + 'px';
    touchedPieceClone.style.left = (touch.clientX - touchedPiece.offsetWidth / 2) + 'px';
    touchedPieceClone.style.top = (touch.clientY - touchedPiece.offsetHeight / 2) + 'px';
    document.body.appendChild(touchedPieceClone);
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!touchedPieceClone) return;
    
    const touch = e.touches[0];
    touchedPieceClone.style.left = (touch.clientX - touchedPieceClone.offsetWidth / 2) + 'px';
    touchedPieceClone.style.top = (touch.clientY - touchedPieceClone.offsetHeight / 2) + 'px';
}

function handleTouchEnd(e) {
    if (touchedPiece) {
        touchedPiece.classList.remove('dragging');
    }
    
    if (touchedPieceClone) {
        document.body.removeChild(touchedPieceClone);
        touchedPieceClone = null;
    }
    
    if (!touchedPiece) return;
    
    const touch = e.changedTouches[0];
    const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (dropTarget && dropTarget.classList.contains('puzzle-piece') && dropTarget !== touchedPiece) {
        swapPieces(touchedPiece.dataset.id, dropTarget.dataset.id);
        renderPuzzle();
    }
    
    touchedPiece = null;
}

// Helper functions
function getPieceCurrentPosition(id) {
    const piece = pieces.find(p => p.id === parseInt(id));
    return piece ? piece.currentPosition : -1;
}

function swapPieces(id1, id2) {
    const piece1 = pieces.find(p => p.id === parseInt(id1));
    const piece2 = pieces.find(p => p.id === parseInt(id2));
    
    if (piece1 && piece2) {
        const tempPos = piece1.currentPosition;
        piece1.currentPosition = piece2.currentPosition;
        piece2.currentPosition = tempPos;
    }
}

function checkCompletion() {
    const isComplete = pieces.every(piece => piece.currentPosition === piece.correctPosition);
    const completionMessage = document.getElementById('completionMessage');
    
    if (isComplete) {
        completionMessage.classList.add('show');
        celebrateCompletion();
    } else {
        completionMessage.classList.remove('show');
    }
}

function celebrateCompletion() {
    // Add confetti-like hearts effect
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            createFloatingHeart();
        }, i * 100);
    }
}

function createFloatingHeart() {
    const heart = document.createElement('div');
    heart.innerHTML = ['❤️', '💕', '💖', '💗', '💝'][Math.floor(Math.random() * 5)];
    heart.style.position = 'fixed';
    heart.style.left = Math.random() * 100 + 'vw';
    heart.style.top = '100vh';
    heart.style.fontSize = (Math.random() * 20 + 20) + 'px';
    heart.style.pointerEvents = 'none';
    heart.style.zIndex = '2000';
    heart.style.transition = 'all 3s ease-out';
    document.body.appendChild(heart);
    
    setTimeout(() => {
        heart.style.top = '-50px';
        heart.style.opacity = '0';
    }, 50);
    
    setTimeout(() => {
        heart.remove();
    }, 3000);
}

// Event listeners for buttons
function setupEventListeners() {
    document.getElementById('shuffleBtn').addEventListener('click', function() {
        shufflePieces();
        renderPuzzle();
    });

    document.getElementById('hintBtn').addEventListener('click', function() {
        showHint();
    });
}

function showHint() {
    document.getElementById('hintOverlay').classList.add('show');
}

function hideHint() {
    document.getElementById('hintOverlay').classList.remove('show');
}

// Make hideHint available globally for the onclick handler
window.hideHint = hideHint;
