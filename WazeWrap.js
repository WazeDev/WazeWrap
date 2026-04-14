// ==UserScript==
// @name         WazeWrap
// @namespace    https://greasyfork.org/users/30701-justins83-waze
// @version      3.0.0
// @description  Lightweight alerts and update monitoring for WME scripts
// @author       JustinS83/MapOMatic/JS55CT
// @include      https://beta.waze.com/*editor*
// @include      https://www.waze.com/*editor*
// @exclude      https://www.waze.com/*user/editor/*
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// ==/UserScript==

/* global WazeWrap */
/* global $ */

var WazeWrap;

(function() {
  'use strict';

  /**
   * Configuration - Change REPO to point to your fork for testing
   * Examples:
   *   'wazedev'     - Official (https://wazedev.github.io/WazeWrap/WazeWrapLib.js)
   *   'yourname'    - Your fork (https://yourname.github.io/WazeWrap/WazeWrapLib.js)
   */
  const REPO = 'wazedev';
  const WW_LIB_URL = 'https://' + REPO + '.github.io/WazeWrap/WazeWrapLib.js';
 
  /**
   * Load WazeWrap library
   * Features: Alerts, Script Update Monitoring, Update Dashboard
   * No Waze W object or OpenLayers dependencies required
   */

  function init() {
    // Handle sandboxed Tampermonkey environment
    const sandboxed = typeof unsafeWindow !== 'undefined';
    const pageWindow = sandboxed ? unsafeWindow : window;

    // Check if WazeWrap is already loading or initialized
    // (Repo is set synchronously before $.getScript, so it acts as a loading flag)
    if (pageWindow.WazeWrap && pageWindow.WazeWrap.Repo) {
      console.log('WazeWrap already loading or initialized, skipping library load');
      WazeWrap = pageWindow.WazeWrap;
      if (sandboxed) window.WazeWrap = pageWindow.WazeWrap;
      return;
    }

    // Create WazeWrap object and expose to both contexts
    if (!pageWindow.WazeWrap) pageWindow.WazeWrap = {};
    WazeWrap = pageWindow.WazeWrap;  // Assign to global
    if (sandboxed) window.WazeWrap = pageWindow.WazeWrap;

    // Set repo IMMEDIATELY (synchronously before async $.getScript)
    // This signals other loaders that WazeWrap is loading
    pageWindow.WazeWrap.Repo = REPO;
    console.log('WazeWrap: Loading library');
    $.getScript(WW_LIB_URL).fail(function(error) {
      console.error('Failed to load WazeWrap library:', error);
    });
  }

  /**
   * Bootstrap - wait for jQuery, then initialize
   */
  function bootstrap(tries = 1) {
    if (typeof $ !== 'undefined') {
      init();
    } else if (tries < 1000) {
      setTimeout(function () { bootstrap(tries++); }, 100);
    }
  }

  bootstrap();
})();
