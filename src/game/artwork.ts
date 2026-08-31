import type { GameKind } from '@shared/types'
import samurai from '../../assets/games/samurai.webp'
import halligalli from '../../assets/games/halligalli.webp'
import coup from '../../assets/games/coup.webp'
import carnivals from '../../assets/games/carnivals.webp'
import cop from '../../assets/games/cop.webp'
import snake from '../../assets/games/snake.webp'
import ladders from '../../assets/games/ladders.webp'
import monopoly from '../../assets/games/monopoly.svg'

/**
 * The painting behind each game's home and lobby column. All eight are wide
 * landscapes with their subject right of centre and their lower half in
 * shadow, because the column crops them tall and the masthead sits in that
 * bottom corner. The per-game gradient stays under the image as the backdrop
 * a slow connection sees. Monopoly's is drawn rather than painted, so it is an
 * SVG; Vite hands it over as a URL exactly like the rest.
 */
export const GAME_ART: Record<GameKind, string> = {
  samurai,
  halligalli,
  coup,
  carnivals,
  cop,
  snake,
  ladders,
  monopoly,
}
