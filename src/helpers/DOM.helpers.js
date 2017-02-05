import {
  moveTo,
  getDistanceBetween,
  checkForCollinearPoints,
} from './math.helpers';

export const buildLinearPath = data => (
  data.reduce((path, { x, y }, index) => {
    // The very first instruction needs to be a "move".
    // The rest will be a "line".
    const isFirstInstruction = index === 0;
    const instruction = isFirstInstruction ? 'M' : 'L';

    return `${path}${instruction} ${x},${y}\n`;
  }, '')
);

export const buildSmoothPath = (data, { radius }) => {
  const [firstPoint, ...otherPoints] = data;

  return otherPoints.reduce((path, point, index) => {
    const next = otherPoints[index + 1];
    const prev = otherPoints[index - 1] || firstPoint;

    const isCollinear = next && checkForCollinearPoints(prev, point, next);

    if (!next || isCollinear) {
      // The very last line in the sequence can just be a regular line.
      return `${path}\nL ${point.x},${point.y}`;
    }

    const distanceFromPrev = getDistanceBetween(prev, point);
    const distanceFromNext = getDistanceBetween(next, point);
    const threshold = Math.min(distanceFromPrev, distanceFromNext);

    const isTooCloseForRadius = (threshold / 2 < radius);

    if (isTooCloseForRadius) {
      // eslint-disable-next-line no-param-reassign
      radius = threshold / 2;
    }

    const before = moveTo(prev, point, radius);
    const after = moveTo(next, point, radius);

    return [
      path,
      `L ${before.x},${before.y}`,
      `S ${point.x},${point.y} ${after.x},${after.y}`,
    ].join('\n');
  }, `M ${firstPoint.x},${firstPoint.y}`);
};

// Modified from Modernizr
export function getSupportedAnimationEndName() {
  const animations = {
    animation: 'animationend',
    oAnimation: 'oAnimationEnd',
    WebkitAnimation: 'webkitAnimationEnd',
  };

  // If we're running in a browserless environment (eg. SSR), it doesn't apply.
  // Return a placeholder string, for consistent type return.
  if (typeof document === 'undefined') return '';

  const el = document.createElement('fakeelement');

  const match = Object.keys(animations).find(animationName => (
    el.style[animationName] !== undefined
  ));

  // If no `transition` is found, we must be running in a browser so ancient,
  // React itself won't run. Return an empty string, for consistent type return
  return match ? animations[match] : '';
}

// Taken from Khan Academy's Aphrodite
// https://github.com/Khan/aphrodite/blob/master/src/inject.js
let styleTag;
export const injectStyleTag = (cssContents) => {
  if (styleTag == null) {
    // Try to find a style tag with the `data-react-trend` attribute first.
    styleTag = document.querySelector('style[data-react-trend]');

    // If that doesn't work, generate a new style tag.
    if (styleTag == null) {
      // Taken from
      // http://stackoverflow.com/questions/524696/how-to-create-a-style-tag-with-javascript
      const head = document.head || document.getElementsByTagName('head')[0];
      styleTag = document.createElement('style');

      styleTag.type = 'text/css';
      styleTag.setAttribute('data-react-trend', '');
      head.appendChild(styleTag);
    }
  }

  styleTag.appendChild(document.createTextNode(cssContents));
};
