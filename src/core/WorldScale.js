// Global size multipliers. Characters, NPCs and fixtures are drawn ENTITY_SCALE times their base
// height; the road (and therefore the player's lane range) is ROAD_SCALE times its base width.
// Side-to-side hitboxes follow ROAD_SCALE so dodging difficulty stays relative to the road.
export const ENTITY_SCALE = 1.5;
export const ROAD_SCALE = 1.2;
