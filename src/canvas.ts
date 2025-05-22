// @ts-ignore
import { Noise } from 'noisejs';

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;

const GRID_WIDTH = 37;
const GRID_HEIGHT = 18;
const GRID_GAP = 1;
const NODE_SIZE = 7;
const PLAYER_SIZE = 2;

let startPos = { x: Math.floor(GRID_WIDTH / 2), y: Math.floor(GRID_HEIGHT / 2) };
let goalPos = { x: 0, y: 0 };
let nodes: Cell[][] = [];


export const init = () => {
  canvas = document.getElementById('canvas') as HTMLCanvasElement;
  ctx = canvas.getContext('2d')!;
  nodes = [];
  const noise = new Noise(Math.random());

  for (let y = 0; y < GRID_HEIGHT; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      const value = noise.perlin2(x / 5, y / 5);
      const type = value > 0 ? 'Floor' : 'Wall';
      row.push({ x, y, g: Infinity, h: Infinity, f: Infinity, parent: null, type });

      ctx.fillStyle = type === 'Floor' ? '#535353' : '#171717';
      ctx.fillRect(x * (NODE_SIZE + GRID_GAP), y * (NODE_SIZE + GRID_GAP), NODE_SIZE, NODE_SIZE);
    }
    nodes.push(row);
  }

  startPos = getRandomWalkableNode();
  goalPos = getRandomWalkableNode();
  const path = findPath(startPos, goalPos);
  if (path.length === 0) init();
  travelPath(path);

  // Draw goal
  ctx.fillStyle = 'yellow';
  ctx.beginPath();
  const { x, y } = toCanvasCoords(goalPos.x, goalPos.y);
  ctx.arc(x, y, PLAYER_SIZE, 0, 2 * Math.PI);
  ctx.fill();
};

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min)) + min;

const isValidNode = (nx: number, ny: number) => nx >= 0 && ny >= 0 && nx < GRID_WIDTH && ny < GRID_HEIGHT && nodes[ny][nx].type !== 'Wall';

const toCanvasCoords = (x: number, y: number): Vec => ({
  x: x * (NODE_SIZE + GRID_GAP) + NODE_SIZE / 2,
  y: y * (NODE_SIZE + GRID_GAP) + NODE_SIZE / 2,
});

const getRandomWalkableNode = (): Cell => {
  let node = nodes[getRandomInt(0, nodes.length)][getRandomInt(0, nodes[0].length)];
  while (node.type === 'Wall') {
    node = nodes[getRandomInt(0, nodes.length)][getRandomInt(0, nodes[0].length)];
  }
  return node;
};

const findPath = (startPos: Vec, endPos: Vec): Vec[] => {
  const start = nodes[startPos.y][startPos.x];
  const end = nodes[endPos.y][endPos.x];

  for (const row of nodes) {
    for (const node of row) {
      node.g = Infinity;
      node.h = Infinity;
      node.f = Infinity;
      node.parent = null;
    }
  }

  const openSet: Cell[] = [start];
  const closedSet: Set<Cell> = new Set();
  start.g = 0;
  start.h = heuristic(start, end);
  start.f = start.g + start.h;

  while (openSet.length > 0) {
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!;
    if (current === end) {
      return reconstructPath(current).map((n) => toCanvasCoords(n.x, n.y));
    }

    closedSet.add(current);
    for (const neighbor of getNeighbors(current)) {
      if (closedSet.has(neighbor)) continue;
      const dx = Math.abs(neighbor.x - current.x);
      const dy = Math.abs(neighbor.y - current.y);
      const stepCost = (dx === 1 && dy === 1) ? 1.41 : 1;
      const tentativeG = current.g + stepCost;

      if (tentativeG < neighbor.g) {
        neighbor.parent = current;
        neighbor.g = tentativeG;
        neighbor.h = heuristic(neighbor, end);
        neighbor.f = neighbor.g + neighbor.h;
        if (!openSet.includes(neighbor)) openSet.push(neighbor);
      }
    }
  }
  return [];
};

const heuristic = (a: Vec, b: Vec): number => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

const getNeighbors = (node: Cell): Cell[] => {
  const dirs = [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: -1, y: -1 },
    { x: 1, y: -1 },
    { x: -1, y: 1 },
    { x: 1, y: 1 },
  ];
  const neighbors: Cell[] = [];

  for (const d of dirs) {
    const nx = node.x + d.x;
    const ny = node.y + d.y;
    if (!isValidNode(nx, ny)) continue;

    if (Math.abs(d.x) === 1 && Math.abs(d.y) === 1) {
      const neighborHorizontal = nodes[node.y][node.x + d.x];
      const neighborVertical = nodes[node.y + d.y]?.[node.x];
      if (neighborHorizontal?.type === 'Wall' && neighborVertical?.type === 'Wall') continue;
    }
    neighbors.push(nodes[ny][nx]);
  }
  return neighbors;
};

const reconstructPath = (endNode: Cell): Cell[] => {
  const path: Cell[] = [];
  let current: Cell | null = endNode;
  while (current) {
    path.unshift(current);
    current = current.parent;
  }
  return path;
};

const travelPath = (path: Vec[]) => {
  for (let i = 0; i < path.length; i++) {
    const { x, y } = path[i];
    drawPlayer(x, y);
  }
};

const drawPlayer = (x: number, y: number) => {
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(x, y, PLAYER_SIZE, 0, 2 * Math.PI);
  ctx.fill();
};
