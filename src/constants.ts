// Port of GFCONSTANT from the old plugin
export const GFCONSTANT = {
  // Draw.io lib
  CONF_FILE_DRAWIOLIB: 'static/libs/viewer-static.min.js',
  CONF_FILE_DEFAULTDIO: 'static/defaultGraph.drawio',

  // Tooltips
  CONF_TOOLTIPS_DELAY: 200,

  // Colors animation
  CONF_COLORS_STEPS: 10,
  CONF_COLORS_MS: 50,

  // Animations
  CONF_ANIMS_STEP: 20,
  CONF_ANIMS_MS: 50,

  // Editor
  CONF_EDITOR_URL: 'https://embed.diagrams.net',

  // mxGraph style keys that support animation (gradual transitions)
  MXGRAPH_STYLES_ANIM: ['barPos', 'gaugePos', 'fontSize', 'opacity', 'textOpacity', 'rotation'] as const,

  // mxGraph style keys that are static (instant change)
  MXGRAPH_STYLES_STATIC: ['shape', 'endArrow', 'startArrow', 'flipH', 'flipV', 'gradientDirection', 'image'] as const,

  // All mxGraph style keys
  MXGRAPH_STYLES: [
    'fillColor',
    'strokeColor',
    'gradientColor',
    'fontColor',
    'labelBackgroundColor',
    'labelBorderColor',
    'imageBorder',
    'imageBackground',
    'barPos',
    'gaugePos',
    'fontSize',
    'opacity',
    'textOpacity',
    'rotation',
    'shape',
    'endArrow',
    'startArrow',
    'flipH',
    'flipV',
    'gradientDirection',
    'image',
  ] as const,

  // Default colors for thresholds (level 0, 1, 2)
  CONF_COLORS_DEFAULT: ['#73BF69', '#FADE2A', '#F2495C'] as const,
} as const;
