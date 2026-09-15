/*
 * Night Float — Proprietary public demonstration · source-visible · no reuse licence. Copyright (c) 2026 Maku Pauline Mazakpe. All rights reserved.
 * Unauthorized use, copying, modification, or distribution is prohibited without written permission.
 * Contact: https://startuptribunal.com/maku | LinkedIn: https://www.linkedin.com/in/maku-mazakpe/ | GitHub: https://github.com/ma-za-kpe
 * X: https://x.com/makumazakpe | StartupTribunal X: https://x.com/startuptribunal
 */

export function pathGeometry(from, to, progress, reducedMotion = false) {
  const bend = Math.max(28, Math.abs(to.x - from.x) * 0.25);
  const first = { x: from.x, y: from.y + (to.y > from.y ? bend : -bend) };
  const second = { x: to.x, y: to.y - (to.y > from.y ? bend : -bend) };
  const time = reducedMotion ? 1 : progress % 1;
  const inverse = 1 - time;
  return {
    first,
    second,
    point: {
      x:
        inverse ** 3 * from.x +
        3 * inverse ** 2 * time * first.x +
        3 * inverse * time ** 2 * second.x +
        time ** 3 * to.x,
      y:
        inverse ** 3 * from.y +
        3 * inverse ** 2 * time * first.y +
        3 * inverse * time ** 2 * second.y +
        time ** 3 * to.y,
    },
  };
}
