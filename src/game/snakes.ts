import cobra from '../../assets/snakes/cobra.webp'
import coral from '../../assets/snakes/coral.webp'
import corn from '../../assets/snakes/corn.webp'
import mangrove from '../../assets/snakes/mangrove.webp'
import python from '../../assets/snakes/python.webp'
import rattler from '../../assets/snakes/rattler.webp'
import tree from '../../assets/snakes/tree.webp'
import viper from '../../assets/snakes/viper.webp'

/**
 * The snakes on the Snakes & Ladders board: original generated artwork, each
 * seen from above with its head at the top and its tail at the bottom. `head`
 * and `tail` are where those sit in the image, as fractions of its size, so the
 * board can pin the head to the snake's head square and the tail tip to where
 * it drops you. Like the cloths, it lives here rather than in `shared/`
 * because the server has no asset pipeline to resolve the imports.
 */
export interface SnakeArt {
  src: string
  width: number
  height: number
  head: [number, number]
  tail: [number, number]
}

export const SNAKE_ART: SnakeArt[] = [
  { src: tree, width: 178, height: 900, head: [0.48, 0.05], tail: [0.59, 0.98] },
  { src: coral, width: 167, height: 900, head: [0.54, 0.05], tail: [0.33, 0.98] },
  { src: python, width: 106, height: 900, head: [0.44, 0.05], tail: [0.58, 0.98] },
  { src: rattler, width: 242, height: 900, head: [0.53, 0.05], tail: [0.58, 0.98] },
  { src: viper, width: 94, height: 900, head: [0.4, 0.05], tail: [0.53, 0.98] },
  { src: corn, width: 195, height: 900, head: [0.51, 0.05], tail: [0.47, 0.98] },
  { src: cobra, width: 99, height: 900, head: [0.42, 0.05], tail: [0.69, 0.98] },
  { src: mangrove, width: 113, height: 900, head: [0.49, 0.05], tail: [0.51, 0.98] },
]
