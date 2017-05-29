// ==UserScript==
// @name         Feedly image downloader
// @version      0.1.2
// @description  Download saved images from Feedly
// @author       Nico Barry
// @match        https://feedly.com/i/tag/user/*/tag/z*
// @require      http://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js
// @run-at       document-idle
// ==/UserScript==
/* jshint -W097 */
'use strict';

this.$ = this.jQuery = jQuery.noConflict(true);

const minimizedArticleClass = '.u0';
const expandedArticleClass = '.u100Entry';

function downloadFile(sUrl) {
  // Download via virtual link click
  // Creating new link node.
  var link = window.document.createElement('a');
  link.href = sUrl;

  if (link.download !== undefined) {
    //Set HTML5 download attribute. This will prevent file from opening if supported.
    var fileName = sUrl.substring(sUrl.lastIndexOf('/') + 1, sUrl.length);
    link.download = fileName;
  }

  // Dispatching click event.
  if (window.document.createEvent) {
    var e = window.document.createEvent('MouseEvents');
    e.initEvent('click', true, true);
    link.dispatchEvent(e);
    return true;
  }

  // Force file download (whether supported by server).
  if (sUrl.indexOf('?') === -1) {
    sUrl += '?download';
  }

  window.open(sUrl, '_self');
  return true;
}

function scrollToBottom(cbWhenFinished, scrolls = 0) {
  window.scrollTo(0, window.document.body.scrollHeight);

  window.setTimeout(() => {
    const $fullyLoaded = $('#fullyLoadedFollowing');
    if ($fullyLoaded && $fullyLoaded.css('display') !== 'none') { // todo: detect if we're at the end
      cbWhenFinished();
    } else { // We're not at the bottom yet; scroll again.
      scrollToBottom(cbWhenFinished, scrolls);
    }
  }, 200);
}

function iterateSlowlyThroughEls(selector, delay, cb) {
  let i = 0;
  const elements = $(selector);
  console.log(elements)

  // If no els, exit early
  if (!elements.length) {
    return;
  }

  function handleOneEl() {
    cb($(elements[i]));

    // Todo: remove `false` to iterate through all elements
    if (++i < elements.length) { // We're not done iterating through all the elements
      window.setTimeout(handleOneEl, delay);
    }
  }

  handleOneEl();
}

function downloadImagesFromEntry($entry) {
  const $divContent = $entry.find('div.content');
  const $images = $divContent
    ? $divContent.find('img')
    : null;

  if ($images) {
    $images.each((i, img) => {
      const src = $(img).attr('src');
      const originalSrc = $(img).data('original');
      if (src !== originalSrc) {
        console.log('src was different from original src: ', src, originalSrc);
      }
      downloadFile(src);
    });
    return true;
  } else {
    console.log('Failed to find div.content for entry: \n', $entry);
    return false;
  }
}

function entryHasVideos($entry) {
  return !!$entry.find('div.content').find('video').length;
}

function removeTag($entry) {
  $entry.find('span.board-tag[title=z]').click();
}

function downloadAndClearPost($entryTitle) {
  // Click to open the entry and find the fully-open entry
  $entryTitle.click();

  // Wait for the entry to load
  window.setTimeout(() => {
    const $entry = $(expandedArticleClass);

    const didDownloadImages = downloadImagesFromEntry($entry);

    if (didDownloadImages && !entryHasVideos($entry)) {
      removeTag($entry);
    }
  }, 300);
}

$(() => {
  window.setTimeout(() => {
    scrollToBottom(() => iterateSlowlyThroughEls(minimizedArticleClass, 500, downloadAndClearPost));
  }, 2000);
});
