/**
 * The logo for every company on the Monopoly board, drawn as inline SVG.
 *
 * These are hand-drawn approximations of each company's real mark, at the
 * user's explicit direction. They are trademarks of their owners and this app
 * is an unofficial hobby project with no affiliation to any of them — worth
 * knowing before this board is shown anywhere public, since it is the one place
 * the repo departs from its own "all artwork is original" rule.
 *
 * Each is drawn on a 100×100 canvas and rendered by `CompanyLogo.vue` as a real
 * element in the space, not as a background wash — a logo at 40% opacity behind
 * text stops looking like the logo. `tint` is the brand colour, used only for a
 * light plate behind the space so the sector still reads at a glance.
 */

export interface CompanyLogo {
  /** Brand colour, for the space's plate. */
  tint: string
  /** Inner SVG markup on a `0 0 100 100` canvas. */
  svg: string
}

/** A sans stack for the handful of logos that genuinely are wordmarks. */
const SANS = "Helvetica,Arial,sans-serif"

export const COMPANY_LOGOS: Record<string, CompanyLogo> = {
  // --- social ---------------------------------------------------------------
  Snap: {
    tint: '#FFFC00',
    svg: `
      <rect x="12" y="12" width="76" height="76" rx="20" fill="#FFFC00"/>
      <path d="M50 26c-9 0-15 6-15 15 0 5 0 8-1 10-2 3-7 4-7 6s4 2 6 4c1 1 1 3 2 4 2 2 5 1 8 2 3 1 4 4 7 4s4-3 7-4c3-1 6 1 8-2 1-1 1-3 2-4 2-2 6-2 6-4s-5-3-7-6c-1-2-1-5-1-10 0-9-6-15-15-15z" fill="#fff"/>
    `,
  },
  Reddit: {
    tint: '#FF4500',
    svg: `
      <circle cx="50" cy="50" r="34" fill="#FF4500"/>
      <circle cx="26" cy="48" r="7" fill="#fff"/>
      <circle cx="74" cy="48" r="7" fill="#fff"/>
      <ellipse cx="50" cy="56" rx="22" ry="17" fill="#fff"/>
      <circle cx="42" cy="54" r="4" fill="#FF4500"/>
      <circle cx="58" cy="54" r="4" fill="#FF4500"/>
      <path d="M41 63c5 4 13 4 18 0" fill="none" stroke="#FF4500" stroke-width="3" stroke-linecap="round"/>
      <circle cx="63" cy="27" r="5" fill="#fff"/>
      <path d="M50 39V29h11" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
    `,
  },

  // --- consumer apps --------------------------------------------------------
  Spotify: {
    tint: '#1DB954',
    svg: `
      <circle cx="50" cy="50" r="34" fill="#1DB954"/>
      <g fill="none" stroke="#fff" stroke-linecap="round">
        <path d="M31 40c13-4 27-2 38 5" stroke-width="8"/>
        <path d="M34 52c11-3 22-1 31 5" stroke-width="6.5"/>
        <path d="M37 63c8-2 17-1 24 4" stroke-width="5"/>
      </g>
    `,
  },
  Uber: {
    tint: '#000000',
    svg: `
      <rect x="12" y="12" width="76" height="76" rx="12" fill="#000000"/>
      <text x="50" y="60" text-anchor="middle" font-size="25" font-weight="700" fill="#fff" font-family="${SANS}">Uber</text>
    `,
  },
  PayPal: {
    tint: '#003087',
    svg: `
      <path d="M30 20h23c13 0 20 7 18 19-2 13-12 20-25 20h-9l-3 21H20z" fill="#003087"/>
      <path d="M44 32h20c12 0 18 7 16 18-2 12-11 19-23 19h-9l-3 19H34z" fill="#009CDE"/>
    `,
  },

  // --- creative and enterprise software -------------------------------------
  Adobe: {
    tint: '#FA0F00',
    svg: `
      <path d="M40 16L14 84h16l10-26 6 15h-6l6 11h26L48 16z" fill="#FA0F00"/>
      <path d="M62 16h24v68z" fill="#FA0F00"/>
    `,
  },
  Oracle: {
    tint: '#C74634',
    svg: `
      <rect x="12" y="33" width="76" height="34" rx="17" fill="none" stroke="#C74634" stroke-width="10"/>
    `,
  },
  Salesforce: {
    tint: '#00A1E0',
    svg: `
      <path d="M50 28a20 20 0 0 1 20 20H30a20 20 0 0 1 20-20z" fill="#00A1E0"/>
      <circle cx="29" cy="58" r="15" fill="#00A1E0"/>
      <circle cx="71" cy="58" r="15" fill="#00A1E0"/>
      <rect x="29" y="46" width="42" height="27" fill="#00A1E0"/>
    `,
  },

  // --- media and devices ----------------------------------------------------
  X: {
    tint: '#000000',
    svg: `
      <path d="M22 20h17l14 19 16-19h10L58 46l23 34H64L48 57 29 80H19l25-29z" fill="#000000"/>
    `,
  },
  Netflix: {
    tint: '#E50914',
    svg: `
      <path d="M32 14h15l21 52V14h14v72H67L46 32v54H32z" fill="#E50914"/>
    `,
  },
  Samsung: {
    tint: '#1428A0',
    svg: `
      <ellipse cx="50" cy="50" rx="38" ry="17" fill="#1428A0"/>
      <text x="50" y="56" text-anchor="middle" font-size="13" font-weight="700" fill="#fff" font-family="${SANS}">SAMSUNG</text>
    `,
  },

  // --- semiconductors -------------------------------------------------------
  Intel: {
    tint: '#0068B5',
    svg: `
      <rect x="10" y="34" width="80" height="32" rx="16" fill="#0068B5"/>
      <text x="50" y="59" text-anchor="middle" font-size="22" font-weight="700" fill="#fff" font-family="${SANS}">intel</text>
    `,
  },
  AMD: {
    tint: '#231F20',
    svg: `
      <path d="M18 18h42l22 22v42H64V46H36L18 28z" fill="#231F20"/>
      <path d="M26 26h26l-26 26z" fill="#fff"/>
    `,
  },
  TSMC: {
    tint: '#E4002B',
    svg: `
      <text x="50" y="63" text-anchor="middle" font-size="31" font-weight="700" fill="#E4002B" font-family="${SANS}">tsmc</text>
    `,
  },

  // --- EV and AI ------------------------------------------------------------
  Tesla: {
    tint: '#CC0000',
    svg: `
      <path d="M50 20c-11 0-22 3-31 8l5 9c8-4 17-6 26-6s18 2 26 6l5-9c-9-5-20-8-31-8z" fill="#CC0000"/>
      <path d="M50 34c-7 0-13 1-19 4l5 9h10v33h8V47h10l5-9c-6-3-12-4-19-4z" fill="#CC0000"/>
    `,
  },
  Meta: {
    tint: '#0064E1',
    svg: `
      <path d="M26 52c0-12 7-22 15-22 6 0 10 4 14 12l6 12c4 8 7 12 13 12 8 0 14-9 14-20s-6-20-14-20c-6 0-9 4-13 12l-6 12c-4 8-8 12-14 12-8 0-15-10-15-22z"
            fill="none" stroke="#0064E1" stroke-width="10" stroke-linecap="round"/>
    `,
  },
  OpenAI: {
    tint: '#0D0D0D',
    svg: `
      <g fill="none" stroke="#0D0D0D" stroke-width="8" stroke-linejoin="round" stroke-linecap="round">
        <path d="M50 18l28 16v32L50 82 22 66V34z"/>
        <path d="M50 18v32L22 66M78 34L50 50v32"/>
      </g>
    `,
  },

  // --- the cloud giants -----------------------------------------------------
  Amazon: {
    tint: '#FF9900',
    svg: `
      <text x="50" y="52" text-anchor="middle" font-size="26" font-weight="700" fill="#232F3E" font-family="${SANS}">amazon</text>
      <path d="M20 60c11 9 26 14 41 12 7-1 13-3 19-6" fill="none" stroke="#FF9900" stroke-width="8" stroke-linecap="round"/>
      <path d="M76 60l12 4-9 9z" fill="#FF9900"/>
    `,
  },
  Microsoft: {
    tint: '#00A4EF',
    svg: `
      <rect x="19" y="19" width="28" height="28" fill="#F25022"/>
      <rect x="53" y="19" width="28" height="28" fill="#7FBA00"/>
      <rect x="19" y="53" width="28" height="28" fill="#00A4EF"/>
      <rect x="53" y="53" width="28" height="28" fill="#FFB900"/>
    `,
  },
  Google: {
    tint: '#4285F4',
    svg: `
      <g fill="none" stroke-width="15">
        <path d="M76 32A31 31 0 0 0 27 37" stroke="#EA4335"/>
        <path d="M27 37A31 31 0 0 0 27 63" stroke="#FBBC05"/>
        <path d="M27 63A31 31 0 0 0 76 68" stroke="#34A853"/>
        <path d="M76 68A31 31 0 0 0 81 52" stroke="#4285F4"/>
      </g>
      <rect x="50" y="45" width="31" height="14" fill="#4285F4"/>
    `,
  },

  // --- the two largest ------------------------------------------------------
  NVIDIA: {
    tint: '#76B900',
    svg: `
      <path d="M36 34c13-7 29-6 40 3-9-4-20-3-28 2-10 5-15 15-12 24 3 10 13 15 24 13-14 7-31 3-37-9-6-12 1-26 13-33z" fill="#76B900"/>
      <path d="M50 44c7-4 15-2 19 4-4-2-9-2-13 1-5 3-7 8-5 13-6-4-7-13-1-18z" fill="#76B900"/>
    `,
  },
  Apple: {
    tint: '#1D1D1F',
    svg: `
      <path d="M63 34c-5 0-9 3-13 3s-8-3-13-3c-8 0-16 7-16 20 0 15 10 32 18 32 3 0 6-2 11-2s8 2 11 2c8 0 18-17 18-32 0-13-8-20-16-20z" fill="#1D1D1F"/>
      <path d="M53 28c0-7 6-13 12-13 1 7-5 13-12 13z" fill="#1D1D1F"/>
    `,
  },
}

/** The names on the board that have a logo. */
export const LOGOED = Object.keys(COMPANY_LOGOS)

/** One company's logo, or null for the corners and card spaces. */
export function companyLogo(name: string): CompanyLogo | null {
  return COMPANY_LOGOS[name] ?? null
}
