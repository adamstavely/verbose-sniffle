/** Shared options for rehype-external-links (MDX external link icon + new-tab behavior). */
export const rehypeExternalLinkOptions = {
  target: '_blank',
  rel: ['nofollow', 'noopener', 'noreferrer'],
  contentProperties: {
    class: 'external-link-icon',
    'aria-hidden': 'true',
  },
  content: {
    type: 'element',
    tagName: 'svg',
    properties: {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '14',
      height: '14',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    },
    children: [
      {
        type: 'element',
        tagName: 'path',
        properties: { d: 'M15 3h6v6' },
        children: [],
      },
      {
        type: 'element',
        tagName: 'path',
        properties: { d: 'M10 14 21 3' },
        children: [],
      },
      {
        type: 'element',
        tagName: 'path',
        properties: { d: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' },
        children: [],
      },
    ],
  },
};
