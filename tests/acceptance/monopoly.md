# Monopoly — browser acceptance test cases

Manual/automated browser cases for the Monopoly game added to the multi-game app.
These cover what the unit, room and render suites cannot: that the pieces are
wired together end to end, over a real WebSocket, across two clients.

**Environment**

- Client `http://localhost:5173`, server `ws://localhost:8787` (already running).
- Two browser tabs act as two players, referred to as **P1** and **P2**.
- P1 hosts; P2 joins with the 4-character room code shown in P1's lobby.
- Fresh `localStorage` per run where possible — identity is a token kept there,
  and one socket per token, so two tabs must be distinct browser contexts/tabs.

**Result key:** PASS / FAIL / BLOCKED (a prior case's failure prevented running it).
Every FAIL must quote the exact console error or the observed text.

---

## MON-01 — Monopoly appears on the landing screen

**Steps**
1. Open `http://localhost:5173`.

**Expected**
- A game card labelled **Monopoly** is present alongside the other seven
  (Samurai, Halli Galli, Coup, Carnivals, Snake, Snakes & Ladders, COP).
- Its seal shows a house emoji (🏠).
- Its blurb mentions buying tech giants and charging rent.
- Its meta line reads `2–8 players · property trading`.

## MON-02 — The card leads to the Monopoly home screen

**Steps**
1. From MON-01, click the Monopoly card.

**Expected**
- The home screen appears with the title **Monopoly** (rendered upper-case).
- The tagline mentions twenty-two tech companies, four data centres and one bank.
- A name field and a create/join form are present.

## MON-03 — The home artwork renders

**Steps**
1. On the Monopoly home screen, inspect the artwork column behind the masthead.
2. Check the Network panel (or console) for the artwork request.

**Expected**
- An image actually renders — a dusk street scene, not a blank or broken area.
- The request for `monopoly*.svg` returns 200; no 404 and no broken-image icon.
- The `<img>` element has a non-zero rendered width and height.

## MON-04 — Creating a room opens the Monopoly lobby

**Steps**
1. Enter a name (`Ada`) as P1 and create the room.

**Expected**
- The Monopoly lobby appears.
- A 4-character room code is shown.
- `Ada` is listed as a seat.
- A numbered **How to play** list is present with **7** rules, covering: throwing
  and moving, buying/auction, rent and sectors, building evenly, antitrust
  review, selling/mortgaging/trading, and the win condition.
- The rules use the board's own vocabulary — **IPO**, **company**, **data
  centre**, **sector**, **antitrust** — with no leftover travel wording
  (Departures, country, airport, region, Customs).
- The start button is present but the lobby indicates two players are needed.

## MON-05 — A second player joins

**Steps**
1. Open a second tab as P2, enter name `Bo`, join with P1's room code.

**Expected**
- P2 lands in the Monopoly lobby (not another game's lobby).
- **Both** tabs list two seats, `Ada` and `Bo`.
- Only P1 (the host) is offered a usable start button.

## MON-06 — Starting the game shows the table

**Steps**
1. P1 starts the game.

**Expected, in both tabs**
- The board renders as a square ring of **40** spaces (`.space` elements).
- **Company** names are legible on the spaces (e.g. `Apple`, `NVIDIA`, `TSMC`).
- The four corners read `IPO`, `Antitrust`, `Sandbox`, `Go to Antitrust`.
- Coloured sector bands appear on the company spaces.
- The left panel lists both players, each showing cash of **1500**.
- A right-hand **Your property** panel is present, saying nothing is owned yet.
- A play log is present.

## MON-07 — The throw is offered to exactly one seat

This is the central per-viewer behaviour: the server computes each viewer's
affordances, and the client must not offer a control the engine would refuse.

**Steps**
1. Compare the two tabs immediately after the game starts.

**Expected**
- Exactly **one** tab shows a **Throw the dice** button.
- The other tab shows `<name> to play` and has **no** throw button.
- The player list marks the same seat as current in both tabs.

## MON-08 — Throwing moves the token and writes to the log

**Steps**
1. In the tab whose turn it is, click **Throw the dice**.

**Expected**
- A dice result is announced (`<name> threw <a> and <b>`), visible in both tabs.
- That player's token moves off Go to a new space; the player list and board
  agree on where it is.
- A new entry appears in the play log naming the space landed on.
- The board updates in the **other** tab too, without a reload.

## MON-09 — The landing offers the right next decision

**Steps**
1. Observe the centre panel after MON-08.

**Expected — one of these, and report which**
- **Unowned property:** a `Buy for <price>` button and a `Send to auction`
  button, shown **only** to the seat that landed; the other tab shows
  `<name> is deciding whether to buy <space>`.
- **Card space:** a Fortune / Parish Fund card text is shown, and play continues.
- **Otherwise:** an **End turn** button, shown only to the current seat.

## MON-10 — Declining a purchase opens an auction to the table

**Steps**
1. If MON-09 produced a buy prompt, click **Send to auction**.
   (If it did not, roll on until one appears, or mark BLOCKED and say why.)

**Expected**
- An auction panel appears in **both** tabs, naming the space.
- Both tabs show a bid input and a **Drop out** button (both seats are eligible).
- `No bids yet` is shown before anyone bids.

## MON-11 — Bidding and closing the auction

**Steps**
1. P1 enters a bid above the minimum and submits it.
2. P2 clicks **Drop out**.

**Expected**
- After P1's bid, both tabs show `Standing bid <amount> from <name>`.
- When P2 drops out, the auction closes and the space is marked as owned by P1:
  the board cell gains an owner marking, and the space appears in P1's
  **Your property** panel.
- P1's cash falls by exactly the winning bid.
- The auction panel disappears in both tabs.

## MON-12 — Buying outright

**Steps**
1. Play on until a seat lands on an unowned property, and click **Buy for <price>**.

**Expected**
- That space becomes theirs on the board in both tabs.
- Their cash falls by exactly the listed price.
- The space is listed in their **Your property** panel, with a **Mortgage**
  action offered.

## MON-13 — The turn passes

**Steps**
1. Settle whatever is pending, then click **End turn**.

**Expected**
- The current-seat marker moves to the other player in **both** tabs.
- The **Throw the dice** button moves to the other tab.
- The tab that just ended its turn no longer has a throw button.

## MON-14 — Property management offers only legal actions

**Steps**
1. With at least one property owned, inspect the **Your property** panel.

**Expected**
- A part-owned colour group offers **Mortgage** but **not** **Build** — building
  needs the whole group, and the panel must not offer what the engine refuses.
- The panel shows only the viewer's own property; the opponent's tab does not
  list it.

## MON-15 — Pause is shared

**Steps**
1. Either player clicks the pause control.

**Expected**
- Both tabs show the table as paused.
- Action buttons (the throw) are no longer usable while paused.
- Resuming restores them.

## MON-16 — Each company shows its logo

The 22 company spaces each carry that company's logo, drawn in its real brand
colours, as an actual `<svg class="company-logo">` element — **not** a
background image. They are inline markup, so there is no network request to
watch; check the elements and the pixels.

**Steps**
1. Zoom in on the board (or screenshot it at a large viewport).
2. Compare several company spaces against one another. Counting
   `svg.company-logo` elements works too — there should be exactly 22, each with
   an `aria-label` naming its company.
3. Mortgage one company (buy it, then use **Mortgage** in the property panel)
   and look at its space again.

**Expected**
- Every company space shows a logo above its name, at full strength — not a
  faded wash behind the text.
- The logos are **recognisable**: Microsoft's four coloured squares, Google's
  four-colour G, Apple's apple, Spotify's green roundel, Netflix's red N,
  Tesla's T, X's X.
- They are in **brand colours**, not one flat ink — Microsoft's squares are red,
  green, blue and yellow; Google's G is four-colour.
- The logo is **not distorted** — the ring cells are taller than they are wide,
  and a stretched roundel is a bug.
- The company name and price remain readable below the logo.
- Corners and card spaces (`Market`, `Venture Fund`) have **no** logo — they
  carry a glyph instead.
- A mortgaged company's logo greys out.

## MON-17 — Two 3D dice, and the throw is animated

**Steps**
1. Take a turn and watch the centre of the board closely from the click.
2. Watch the **other** tab at the same time.

**Expected**
- **Two** dice are shown in the middle of the board (Monopoly moves on a pair),
  rendered in 3D, not two flat numbers.
- Clicking the throw makes both dice **tumble** for about two seconds.
- The two faces they settle on match the throw narrated in the topbar
  (`<name> threw <a> and <b>`) and the play log.
- While they tumble, the topbar reads `<name> is moving…` and the board dims.
- After the dice settle, the player's token **walks space by space** round the
  board to where it landed — it does not teleport.
- The same animation plays in the **other** tab, not just the one that clicked.
- Only after the walk finishes does the buy / end-turn prompt appear.

## MON-18 — Doubles throw again, and animate again

**Steps**
1. Play until someone throws a double (both dice equal).

**Expected**
- The dice show the same face on both.
- That player is given **another** throw rather than the turn passing.
- The second throw animates too — the dice tumble again and the token walks
  again. (This is the case that would silently break if the animation keyed on
  the turn number, which does not change between a player's two throws.)

## MON-19 — A drawn card is dealt onto the table with an animation

**Steps**
1. Play until someone lands on a `Market` or `Venture Fund` space. (Landing on
   one takes a few turns — keep playing, or mark BLOCKED and say how many turns
   you tried.)
2. Watch the middle of the board at the moment of the draw, in **both** tabs.

**Expected**
- A card appears in the centre of the board, showing the deck name, the card's
  text, and whose draw it was.
- It **animates in** — it flips up and settles rather than simply appearing.
- The two decks are distinguishable: `Market` and `Venture Fund` carry different
  coloured edges.
- The same card and animation appear in the other tab, not just the drawer's.
- On a **second** draw later in the game, the animation plays again — it is not a
  one-off on the first card only.

## MON-20 — No console noise

**Steps**
1. Review the console in both tabs across the whole run.

**Expected**
- No uncaught JavaScript errors.
- No Vue warnings (missing keys, failed prop type checks, unresolved components).
- No failed network requests (404/500) for assets or the WebSocket.
- No `three.js` or `cannon-es` errors from the dice (they load lazily with the
  table, so a failure shows only once a game has started).

## MON-21 — The whole board fits without scrolling

This is the regression that prompted the layout change: the board used to size
itself to the full viewport height rather than to the space left under the
topbar, so it ran off the bottom of the page.

**Steps**
1. At a 1440×900 window, look at the board without scrolling.
2. Repeat at a deliberately short window (roughly 1440×700).
3. Repeat at a narrow one (roughly 900×800).

**Expected**
- All four sides of the ring — including the bottom row and both corners on it —
  are visible without scrolling the page, at every size.
- `document.documentElement.scrollHeight` is not greater than its
  `clientHeight` (no vertical page scrollbar).
- The board stays square and never overflows its column horizontally.
- Company names stay legible as the board shrinks; they get smaller, not clipped.

## MON-22 — Reconnection keeps the seat

**Steps**
1. Reload P2's tab mid-game.

**Expected**
- P2 returns to the same Monopoly table in the same seat, not to the landing
  screen and not as a new seat.
- The board, both cash figures and the current-seat marker are intact.
- P1's tab shows P2 as connected again.
