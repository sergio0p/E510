# Backward Induction Game Tree Visualizer

An interactive educational tool for teaching and learning backward induction in game theory. Students solve randomly generated game trees by identifying optimal moves, with animated feedback showing the step-by-step resolution process and final Subgame Perfect Nash Equilibrium.

## Features

### 1. Dynamic Tree Generation
- Random game trees with 2-3 players
- Period-based probabilistic branching (1-3 periods)
- 2-3 children per decision node
- Unique payoffs for each player (-20 to +20 range)
- Player progression rules (Player 1 → Player 2 → Player 3)
- Adaptive perpendicular leaf placement to minimize vertical space

### 2. Interactive Solving
- Click edges to identify optimal moves
- Visual feedback:
  - ✓ Correct: Edge turns red
  - ✗ Wrong: Edge shakes
- Hover effects on frontier edges
- Phase-based interaction (only frontier nodes are clickable)

### 3. Animated Resolution
- **Black ink marking**: Non-optimal branches marked for elimination
- **Particle explosions**: Black particles scatter from eliminated nodes/edges
- **Dynamic contraction**: Optimal leaf contracts along shrinking red edge
- **Sequential processing**: One frontier node at a time
- **Multi-round flow**: Process repeats until root is reached

### 4. Growth Replay
- After completion, tree grows back in reverse order
- **SPNE path highlighted in red**
- Non-optimal paths shown in grey
- Level-by-level animation with pauses
- Full tree structure restored (including all branches)

### 5. Infinite Canvas
- ViewBox-based scaling
- Auto-adjusts to tree size
- No node cutoff regardless of tree complexity
- Responsive container sizing

## Technology Stack

- **Vanilla JavaScript** (ES6 modules)
- **GSAP** (GreenSock Animation Platform) for animations
- **D3.js hierarchical layout** for tree positioning
- **SVG** for rendering
- **CSS3** for styling

## Project Structure

```
/backward-induction/
  index.html                 Main HTML file
  style.css                  Styles and animations
  js/
    main.js                  Game orchestration, state management
    tree-generator.js        Random tree generation
    tree-renderer.js         SVG rendering, layout algorithms
    game-logic.js            Backward induction logic
    animations.js            GSAP animation sequences
  LAYOUT-ALGORITHM.md        Phase 1: Tree layout documentation
  PHASE2-INTERACTION.md      Phase 2: User interaction documentation
  PHASE3-ANIMATIONS.md       Phase 3: Animations documentation
  README.md                  This file
```

## How to Use

### Local Development

1. Start a local web server (required for ES6 modules):
   ```bash
   python -m http.server 8000
   ```

2. Open browser to:
   ```
   http://localhost:8000
   ```

3. Reload page for new random tree

### Playing the Game

1. **Identify frontier nodes**: Look for colored decision nodes whose children are all terminal (grey) nodes

2. **Click optimal edges**: For each frontier node, click the edge leading to the child with the highest payoff for that player
   - Player 1 (red): Maximize payoff[0]
   - Player 2 (green): Maximize payoff[1]
   - Player 3 (blue): Maximize payoff[2]

3. **Watch animations**: After solving a frontier:
   - Non-optimal branches explode
   - Optimal leaf contracts to parent
   - New frontier appears

4. **Continue until root**: Repeat until only root node remains

5. **View SPNE**: Watch growth replay showing the complete solution path

## Game Rules

### Tree Structure
- **Root**: Always Player 1
- **Depth**: 1-3 decision periods + terminal nodes at depth 4
- **Branching**: 2-3 children per decision node
- **Players**: 2-3 players (progression rule enforced)

### Payoff Dimensions
- 2-player games: 2-dimensional payoffs
- 3-player games: 3-dimensional payoffs
- Values are unique per player across all leaves

### Constraints
- No consecutive same-player nodes
- At least one child of root must be a decision node (not leaf)
- Minimum 108px spacing for perpendicular leaf placement

## Animation Timing

All timings calibrated for educational clarity (0.2x playback speed):

- **Black fill**: 0.3s
- **Explosion**: 2.5s
- **Contraction**: 1.0s
- **Pause between nodes**: 2.0s
- **Growth per level**: 0.5s
- **Pause between levels**: 1.0s

## Key Algorithms

### Backward Induction
```javascript
function getBestResponseIndex(node) {
  const playerIndex = node.player - 1;
  let bestIndex = 0;
  let bestPayoff = node.children[0].payoffs[playerIndex];

  for (let i = 1; i < node.children.length; i++) {
    if (node.children[i].payoffs[playerIndex] > bestPayoff) {
      bestPayoff = node.children[i].payoffs[playerIndex];
      bestIndex = i;
    }
  }
  return bestIndex;
}
```

### Adaptive Perpendicular Placement
- Calculates available space between obstacles
- Places leaf at midpoint of available space
- Falls back to default offset if insufficient space
- Prevents cramped vertical layouts

### Dynamic Edge Contraction
- Frame-by-frame path recalculation
- Maintains quadratic Bézier curve shape
- Arrowhead follows moving leaf
- Edge physically shrinks during animation

## Browser Compatibility

- Modern browsers with ES6 module support
- Tested on Chrome, Firefox, Safari
- Requires JavaScript enabled
- SVG rendering required

## Educational Use

Designed for:
- Game theory courses (undergraduate/graduate)
- Economics and decision theory
- Algorithm visualization
- Interactive problem-solving practice

## Future Enhancements

Potential additions:
- Custom tree configuration
- Step-by-step solution mode
- Payoff value editing
- Tree export/import
- Performance analytics
- Accessibility improvements

## License

Educational use permitted. Contact course instructor for details.

## Credits

Developed for E510 Game Theory course.
