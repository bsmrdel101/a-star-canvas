type Vec = {
  x: number
  y: number
};

type CellType = 'Floor' | 'Wall';
type Cell = {
  x: number
  y: number
  g: number
  h: number
  f: number
  parent: Cell | null
  type: CellType
};
