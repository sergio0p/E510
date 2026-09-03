# Tenniel's Alice + Rive Animations for Game Theory

**Concept:** Using John Tenniel's original *Alice in Wonderland* illustrations (1865) with Rive animations to create sophisticated, Victorian-aesthetic game theory teaching tools.

---

## Why Tenniel's Illustrations Are Superior

### Artistic Mastery
- Victorian wood engraving with incredible detail and precision
- Perfect cross-hatching creates depth without color
- Every compositional element serves the narrative
- Timeless aesthetic that doesn't age

### Authentic to Carroll's Vision
- Tenniel worked directly with Lewis Carroll
- These ARE the definitive Alice characters
- Victorian formality creates surreal contrast with absurdity
- Dark undertones that Disney sanitized

### Technical Brilliance
- Every line is intentional
- Readable at any size
- Works perfectly in black and white
- Still crisp 160 years later

### What Disney Ruined
- Made everything cute and colorful
- Removed melancholy and darkness
- Simplified designs to basic shapes
- Lost Victorian satirical edge and class commentary
- Made it a "children's story" instead of social commentary

---

## Public Domain Status

### ✅ Free to Use (Public Domain)
- Lewis Carroll's text (published 1865)
- John Tenniel's original illustrations (1865)
- Characters, dialogue, plot, descriptions
- Published before 1928 = public domain in US
- Author died 1898 = public domain worldwide (life + 70 years)

### ❌ Still Under Copyright
- Disney's character designs (1951)
- Tim Burton's versions (2010)
- Any modern adaptations or illustrations

### Where to Get High-Res Scans
- Wikimedia Commons
- Project Gutenberg
- Archive.org
- British Library
- Library of Congress

---

## Why Tenniel + Game Theory = Perfect Match

1. **Victorian formality** matches mathematical rigor
2. **Black & white aesthetic** focuses attention on concepts
3. **Absurdist logic** of Wonderland mirrors game theory paradoxes
4. **Intellectual credibility** - signals serious content
5. **Distinctive aesthetic** - stands out from modern apps
6. **Public domain** - free to use
7. **Timeless ≠ dated** - works in modern minimalist design

---

## Character → Game Theory Concept Mappings

### Mad Hatter (Circular Reasoning / Infinite Games)
**Tea Party Scene:**
- Infinite repetition (moving seats around table)
- No dominant strategy (everyone keeps moving)
- Circular reasoning (why is a raven like a writing desk?)
- Time stuck at 6 o'clock = discount factor of 1

**Visual:** Mad Hatter at tea table, gesturing to game tree nodes

### Cheshire Cat (Mixed Strategies)
**Appearing/Disappearing:**
- Randomization (unpredictable appearance)
- Mixed strategy equilibrium
- Probabilistic outcomes
- "We're all mad here" = everyone randomizes

**Visual:** Grin appears first, body fades in/out

### White Rabbit (Time Preferences / Discounting)
**"I'm late!":**
- Time preferences and urgency
- Discount factors
- Present bias
- Sequential rationality

**Visual:** Pocket watch prominently displayed, anxious gestures

### Queen of Hearts (Punishment / Enforcement)
**"Off with their heads!":**
- Grim trigger strategies
- Punishment in repeated games
- Credible threats
- Subgame perfection

**Visual:** Commanding gestures, pointing dramatically

### Caterpillar (Information Sets / Questioning)
**"Who are you?":**
- Identity uncertainty
- Information revelation
- Bayesian updating
- Perfect vs imperfect information

**Visual:** Seated on mushroom, smoke rings with question marks

### Tweedledee & Tweedledum (Coordination Games)
**Mirror images:**
- Coordination problems
- Multiple equilibria
- Battle of the sexes
- Common knowledge

**Visual:** Symmetrical positioning, mirrored gestures

---

## Rive Animation Approach

### Design Principle: Victorian Formality
**DO:**
- Subtle, slow movements
- Dignified, deliberate gestures
- Hold poses (not constant motion)
- Slow easing (ease-in-out, not bouncy)
- Minimal overshoot
- Preserve line integrity

**DON'T:**
- Bouncy or cartoony movements
- Squash and stretch
- Rapid motion
- Over-animation
- Break Victorian stiffness

### Animation Techniques

#### Option 1: Rigged Character Animation (Most Work)
**Process:**
1. Vectorize Tenniel engravings
2. Separate body parts into layers
3. Add bones/rigging in Rive
4. Animate with inverse kinematics

**Best for:** Full character movements (gesturing, pointing, leaning)

#### Option 2: Mesh Deformation (Medium Work)
**Process:**
1. Import as vector
2. Use mesh deformation
3. Animate specific parts stretching/bending
4. Keep most illustration static

**Best for:** Cheshire Cat appearing/disappearing, facial expressions

#### Option 3: Cutout/Puppet (Easiest)
**Process:**
1. Cut illustration into pieces
2. Layer in Rive
3. Simple rotation/translation
4. Add subtle movements

**Best for:** Blinking, objects moving, background elements

### Recommended Hybrid Approach
**Mostly Static + Subtle Animation**
- Keep Victorian formality
- Animation for emphasis only
- Let Tenniel's artwork shine
- Characters are dignified, not performers

---

## Technical Workflow

### Step 1: Prepare Assets
1. Download high-res Tenniel scans (4000+ px)
2. Trace in Adobe Illustrator or Inkscape (free)
3. Separate elements into layers:
   - Body
   - Head
   - Arms (left, right)
   - Legs (if needed)
   - Props (watch, teacup, etc.)
   - Eyes (for blinking)
4. Export as SVG

### Step 2: Import to Rive
1. Open Rive Editor (rive.app)
2. Import SVG layers
3. Create artboards for different states
4. Add bones if rigging (for arms, head tilt)
5. Set up state machines

### Step 3: Animate
**State Machine Example (Mad Hatter):**
```
States:
- Idle: Very subtle breathing, occasional blink
- Pointing: Arm raises to gesture at node
- Thinking: Hand moves to chin
- Excited: Slight lean forward
- Explaining: Hand traces along path

Transitions: Slow, deliberate
Easing: ease-in-out (no bounce)
Duration: 0.5-1.0 seconds per gesture
```

### Step 4: Integrate
```javascript
const madHatter = new Rive({
  src: 'mad_hatter.riv',
  canvas: document.getElementById('character-canvas'),
  stateMachines: 'Explanations',
  autoplay: false
});

// When explaining backward induction
madHatter.play('explaining');

// Point to specific node
madHatter.setNumberValue('pointingAngle', calculateAngleToNode(nodeId));

// Return to idle after 3 seconds
setTimeout(() => madHatter.play('idle'), 3000);
```

---

## Specific Character Implementations

### Mad Hatter (Primary Explainer)

**Rive States:**
- `idle`: Slight breathing, blink every 3-5 seconds
- `greeting`: Head nods once, slow
- `pointing`: Right arm raises 45°, index finger extends
- `explaining`: Left hand gestures in small arc
- `thinking`: Right hand to chin
- `excited`: Leans forward 10°, eyes widen slightly

**Props:**
- Hat with 10/6 price tag (can tilt independently)
- Teacup on table (subtle steam animation)

**Integration:**
```javascript
// When user reaches frontier node
madHatter.play('pointing');
showSpeechBubble("This is a decision node. Choose wisely!");

// When user clicks correct edge
madHatter.play('excited');
showSpeechBubble("Excellent! That's the optimal choice!");

// When user clicks wrong edge
madHatter.play('thinking');
showSpeechBubble("Not quite. Consider Player " + player + "'s payoff...");
```

### Cheshire Cat (Mixed Strategy Adviser)

**Rive States:**
- `hidden`: Fully transparent (opacity: 0)
- `grin_appearing`: Grin fades in first (1s)
- `body_appearing`: Body mesh deforms into view (1s)
- `idle`: Tail subtle sway, eyes blink slowly
- `disappearing`: Body fades, grin lingers (1.5s)

**Animation Details:**
- Grin always appears/disappears last/first
- Body uses mesh deform for ethereal effect
- Tail has independent slow sway (3s period)

**Integration:**
```javascript
// When explaining randomization
cheshireCat.play('grin_appearing');
setTimeout(() => cheshireCat.play('body_appearing'), 1000);
showSpeechBubble("Sometimes the best strategy is unpredictable...");

// After explanation
cheshireCat.play('disappearing');
```

### White Rabbit (Time-Sensitive Games)

**Rive States:**
- `idle_anxious`: Slight body bounce (0.5s period), ears up
- `checking_watch`: Pocket watch raises to face
- `panicking`: Faster bounce, ears twitch
- `relieved`: Shoulders drop, ears relax

**Props:**
- Pocket watch (swings slightly on chain)
- Waistcoat buttons (can highlight for countdown)

**Integration:**
```javascript
// For timed challenges
whiteRabbit.play('panicking');
whiteRabbit.setNumberValue('timeRemaining', seconds);

// Update watch face with remaining time
whiteRabbit.setTextRunValue('watchTime', formatTime(seconds));
```

### Queen of Hearts (Punishment Mechanism)

**Rive States:**
- `idle_commanding`: Arms crossed, head high
- `pointing`: Right arm extends dramatically
- `angry`: Slight vibrate (0.1s shake)
- `judging`: Head tilts, eyes narrow
- `sentencing`: Both arms raise, dramatic pose

**Integration:**
```javascript
// When explaining punishment strategies
queen.play('pointing');
showSpeechBubble("Deviate from cooperation, and OFF WITH YOUR PAYOFFS!");

// When player makes suboptimal choice repeatedly
queen.play('angry');
```

---

## Speech Bubble Design

### Victorian Aesthetic
- White background with thick black border (2-3px)
- Serif font (Georgia, Garamond)
- Formal language (no contractions, proper grammar)
- Tail points to character's mouth

### SVG Implementation
```javascript
function createVictorianSpeechBubble(x, y, text, tailDirection) {
  const bubble = document.createElementNS("http://www.w3.org/2000/svg", "g");

  // Rounded rectangle
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("x", x);
  rect.setAttribute("y", y);
  rect.setAttribute("width", "300");
  rect.setAttribute("height", "100");
  rect.setAttribute("rx", "10");
  rect.setAttribute("fill", "white");
  rect.setAttribute("stroke", "black");
  rect.setAttribute("stroke-width", "3");

  // Tail (triangle)
  const tail = document.createElementNS("http://www.w3.org/2000/svg", "path");
  tail.setAttribute("d", `M ${x + 50} ${y + 100} L ${x + 30} ${y + 130} L ${x + 70} ${y + 100} Z`);
  tail.setAttribute("fill", "white");
  tail.setAttribute("stroke", "black");
  tail.setAttribute("stroke-width", "3");

  // Text (serif font, proper formatting)
  const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
  textEl.setAttribute("x", x + 20);
  textEl.setAttribute("y", y + 50);
  textEl.setAttribute("font-family", "Georgia, serif");
  textEl.setAttribute("font-size", "16");
  textEl.setAttribute("fill", "black");
  textEl.textContent = text;

  bubble.appendChild(tail);
  bubble.appendChild(rect);
  bubble.appendChild(textEl);

  // GSAP animation: subtle fade-in with slight scale
  gsap.from(bubble, {
    opacity: 0,
    scale: 0.95,
    duration: 0.4,
    ease: "power2.out"
  });

  return bubble;
}
```

---

## File Size Benefits

**Why Tenniel Line Art is Perfect for Rive:**
- Simple B&W vectors = tiny file sizes
- No color gradients = minimal data
- Clean lines compress beautifully
- Cross-hatching preserved in vector form
- Entire character: **5-15 KB** (vs. 100+ KB video)

**Comparison:**
- Lottie (After Effects): 50-500 KB per character
- Rive (Tenniel vector): 5-15 KB per character
- 10-50x smaller file size

---

## Layout and Integration

### Positioning Options

#### Option 1: Side Panel
```
+----------------+------------------------+
|                |                        |
|  Mad Hatter    |    Game Tree           |
|  (explaining)  |    (interactive)       |
|                |                        |
|  [speech       |                        |
|   bubble]      |                        |
|                |                        |
+----------------+------------------------+
```

#### Option 2: Corner Adviser
```
+------------------------------------------+
|                                          |
|           Game Tree                      |
|           (full width)                   |
|                                          |
|                                   [Cat]  |
|                              [speech]    |
+------------------------------------------+
```

#### Option 3: Context-Sensitive Pop-in
```
Character appears near relevant nodes:
- Mad Hatter near decision nodes
- Cheshire Cat for randomization
- White Rabbit for time-sensitive
- Queen for punishment explanations
```

### Recommended: Context-Sensitive + Minimal

**Design Principles:**
- Characters appear **only when needed**
- Fade in near relevant concepts
- Brief explanation (5-10 seconds)
- Fade out after message delivered
- **Don't occupy permanent screen space**

---

## Example: Full Interaction Sequence

### Backward Induction Tutorial

**Scene 1: Introduction**
```
[Mad Hatter fades in at left side of screen]
State: greeting
Speech: "Welcome to the Tea Party of Backward Induction!
         Shall we solve this rather curious game?"
[After 3 seconds, transitions to idle]
```

**Scene 2: Identifying Frontier**
```
[Mad Hatter transitions to pointing]
[Arm points toward frontier nodes highlighted in tree]
Speech: "Observe these decision nodes. Their children are
         all terminal. We begin here."
[Holds pose for 5 seconds]
```

**Scene 3: User Clicks Edge**
```
If correct:
  [Mad Hatter transitions to excited]
  Speech: "Capital! Player {n} indeed prefers that outcome!"
  [Edge turns red]

If wrong:
  [Mad Hatter transitions to thinking]
  Speech: "Pray reconsider. What payoff does Player {n} receive?"
  [Edge shakes]
```

**Scene 4: Contraction Animation**
```
[Mad Hatter transitions to explaining]
[Hand gestures follow contracting branch]
Speech: "Now witness the resolution. The optimal branch
         contracts, and we proceed backward."
[Animation plays]
```

**Scene 5: New Frontier**
```
[Mad Hatter transitions to pointing again]
Speech: "A new frontier emerges. Continue your reasoning."
[Returns to idle]
```

**Scene 6: SPNE Reveal (End)**
```
[Mad Hatter transitions to excited]
[Cheshire Cat fades in on opposite side]
Speech (Hatter): "Splendid! The subgame perfect equilibrium!"
Speech (Cat): "And now you see... everyone was quite mad
               to play anything else."
[Both fade out]
```

---

## Implementation Checklist

### Phase 1: Single Character Prototype
- [ ] Download high-res Tenniel Mad Hatter scan
- [ ] Vectorize in Illustrator/Inkscape
- [ ] Separate into layers (body, head, arms, hat)
- [ ] Import to Rive Editor
- [ ] Create basic state machine (idle, pointing, thinking)
- [ ] Export .riv file
- [ ] Integrate into game tree app
- [ ] Test state transitions
- [ ] Add speech bubble system

### Phase 2: Refinement
- [ ] Add subtle animations (breathing, blinking)
- [ ] Fine-tune easing curves (Victorian stiffness)
- [ ] Implement context-sensitive triggering
- [ ] Test timing with game flow
- [ ] Optimize file size

### Phase 3: Additional Characters
- [ ] Cheshire Cat (mesh deform for fade)
- [ ] White Rabbit (with pocket watch prop)
- [ ] Queen of Hearts (commanding gestures)
- [ ] Test multi-character coordination

### Phase 4: Polish
- [ ] Victorian typography for speech bubbles
- [ ] Formal language in all dialogue
- [ ] Smooth transitions between states
- [ ] Performance optimization
- [ ] Cross-browser testing

---

## Alternative: Static Tenniel with Minimal Animation

**If Rive is too complex:**

Use **GSAP alone** with static Tenniel illustrations:
- Characters fade in/out
- Speech bubbles appear with typing effect
- Subtle highlighting (glow around character)
- Pointing arrows from character to nodes

**Advantages:**
- Much simpler implementation
- Still captures Victorian aesthetic
- Faster development
- Smaller file sizes

**Example:**
```javascript
// Simple fade-in with GSAP
gsap.to("#mad-hatter", {
  opacity: 1,
  duration: 0.8,
  ease: "power2.out"
});

// Speech bubble with typing effect
typeText("#speech-bubble", "Consider the payoffs carefully...", 50);
```

---

## Resources

### Tenniel Illustrations
- **Wikimedia Commons:** High-res scans, public domain
- **Project Gutenberg:** Full book with illustrations
- **British Library:** Digitized collections
- **Archive.org:** Multiple editions

### Rive
- **Website:** rive.app
- **Editor:** Free download (Mac/Windows/Linux)
- **Docs:** help.rive.app
- **Community:** Free character rigs and templates

### Fonts (Victorian Style)
- **Georgia** (pre-installed, good serif)
- **Garamond** (classic, elegant)
- **Baskerville** (18th century, formal)
- **Caslon** (Victorian era)

---

## Future Possibilities

### Extended Wonderland Game Theory Universe

**More Characters:**
- **Dormouse** (Sleep = outside option)
- **Humpty Dumpty** (Language games / cheap talk)
- **Walrus & Carpenter** (Adverse selection)
- **Playing Cards** (Anonymous players)

**More Concepts:**
- **Looking Glass** (Reflection = symmetric games)
- **Red Queen Race** (Evolutionary dynamics)
- **Jabberwocky** (Nonsense = dominated strategies)
- **Chess Game** (Perfect information)

**Expanded Formats:**
- Full curriculum with multiple modules
- Interactive textbook chapters
- Exportable problem sets
- Student practice mode vs. presentation mode

---

## Key Takeaway

**Tenniel's Alice + Rive + Game Theory = Sophisticated, Timeless Educational Tool**

The Victorian aesthetic:
- Adds intellectual weight
- Creates memorable visual metaphors
- Stands apart from modern "edutainment"
- Appeals to adult learners and academics
- Public domain = free to use
- Proven staying power (160 years and counting)

The animation should serve the pedagogy, not distract from it.
Keep it elegant, formal, and Victorian.

---

*"Curiouser and curiouser!" cried Alice (she was so much surprised, that for the moment she quite forgot how to speak good English).*

— Lewis Carroll, *Alice's Adventures in Wonderland*, 1865
