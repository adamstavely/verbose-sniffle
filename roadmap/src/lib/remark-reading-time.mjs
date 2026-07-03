import getReadingTime from 'reading-time';
import { toString } from 'mdast-util-to-string';

/**
 * Remark plugin: compute an estimated reading time from the document text and
 * inject it into the page frontmatter as `minutesRead` (e.g. "3 min read").
 * Wired into the MDX integration, so it applies to the .mdx content pages
 * (About / User Guide / Developer Guide) and is read by MdxDocLayout.
 */
export function remarkReadingTime() {
  return function (tree, { data }) {
    const textOnPage = toString(tree);
    const readingTime = getReadingTime(textOnPage);
    data.astro.frontmatter.minutesRead = readingTime.text;
  };
}
