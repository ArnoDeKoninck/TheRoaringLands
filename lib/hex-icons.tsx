export const HEX_ICON_MAP: Record<string, string> = {
  // Terrain
  GR: '/hex-icons/nature/grass.svg',
  FR: '/hex-icons/nature/forest.svg',
  MT: '/hex-icons/nature/mountain.svg',
  DS: '/hex-icons/nature/desert.svg',
  JG: '/hex-icons/nature/jungle.svg',
  SW: '/hex-icons/nature/swamp.svg',
  WF: '/hex-icons/nature/waterfall.svg',
  // Settlements
  CS: '/hex-icons/buildings/castle.svg',
  VL: '/hex-icons/buildings/village.svg',
  HV: '/hex-icons/buildings/huts-village.svg',
  // Encounters
  GC: '/hex-icons/buildings/goblin-camp.svg',
  WT: '/hex-icons/misc/wolf-trap.svg',
  TU: '/hex-icons/buildings/tumulus.svg',
  CT: '/hex-icons/buildings/camping-tent.svg',
  AH: '/hex-icons/buildings/airtight-hatch.svg',
  // Military
  DW: '/hex-icons/buildings/defensive-wall.svg',
  PA: '/hex-icons/buildings/palisade.svg',
}

export const HEX_ICON_CODES = new Set(Object.keys(HEX_ICON_MAP))

export const RESOURCE_ICON_MAP: Record<string, string> = {
  GD: '/hex-icons/resources/two-coins.svg',
  WD: '/hex-icons/resources/wood-pile.svg',
  ST: '/hex-icons/resources/brick-pile.svg',
  FD: '/hex-icons/resources/wheat.svg',
  IR: '/hex-icons/resources/metal-bar.svg',
}

// Kept for import compatibility — no longer renders anything
export function HexIconDefs() { return null }
