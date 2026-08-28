import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * The browser's own fullscreen mode.
 *
 * A phone spends thirty-odd pixels of a short screen on the address bar, and a
 * board game wants them. This asks for the whole document rather than the board
 * alone — fullscreening the board would take the hand and the turn away with
 * the browser's chrome, which is the opposite of the point.
 *
 * `supported` is answered once, when the composable is called, and is false on
 * an iPhone: Safari there offers the API for video only. Nothing else in the
 * app depends on it, so the button simply does not appear; a home-screen
 * install is that browser's answer instead (see the meta tags in index.html).
 */
export function useFullscreen() {
  const supported = typeof document !== 'undefined' && document.fullscreenEnabled === true

  const active = ref(false)
  const sync = () => (active.value = document.fullscreenElement !== null)

  async function toggle() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      // `navigationUI` is a request, not a promise the browser has to keep.
      else await document.documentElement.requestFullscreen({ navigationUI: 'hide' })
    } catch {
      // Refused — a gesture the browser did not trust, or a policy that forbids
      // it. There is nothing to tell the player that they cannot already see.
    }
    sync()
  }

  // Leaving by the browser's own means — the Escape key, a system gesture, the
  // back button — has to be heard, or the button would go on offering an exit
  // from somewhere nobody is any more.
  onMounted(() => {
    sync()
    document.addEventListener('fullscreenchange', sync)
  })

  onBeforeUnmount(() => document.removeEventListener('fullscreenchange', sync))

  return { supported, active, toggle }
}
