// ==UserScript==
// @name         WazeWrap Light
// @namespace    https://greasyfork.org/users/30701-justins83-waze
// @version      2025.04.06.00
// @description  Lightweight WazeWrap with settings, alerts, and update monitoring
// @author       JustinS83/MapOMatic/JS55CT
// @include      https://beta.waze.com/*editor*
// @include      https://www.waze.com/*editor*
// @exclude      https://www.waze.com/*user/editor/*
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// ==/UserScript==

var WazeWrap;

(function() {
  'use strict';

  /**
   * Configuration - Change REPO to point to your fork for testing
   * Examples:
   *   'wazedev'     - Official (https://wazedev.github.io/WazeWrap/WazeWrapLightLib.js)
   *   'yourname'    - Your fork (https://yourname.github.io/WazeWrap/WazeWrapLightLib.js)
   */
  const REPO = 'wazeDev';
  const WW_LIGHT_URL = 'https://' + REPO + '.github.io/WazeWrap/WazeWrapLightLib.js';

  /**
   * Load WazeWrap Light library
   * No Waze W object or OpenLayers dependencies required
   */

  function initLight() {
    // Handle sandboxed Tampermonkey environment
    const sandboxed = typeof unsafeWindow !== 'undefined';
    const pageWindow = sandboxed ? unsafeWindow : window;

    // If Full version is present, set LightReady as stub and exit
    if (pageWindow.WazeWrap?.Ready) {
      pageWindow.WazeWrap.LightReady = true;
      if (sandboxed) window.WazeWrap = pageWindow.WazeWrap;
      WazeWrap = pageWindow.WazeWrap;  // Assign to global
      return;
    }

    // If Light already loaded, exit
    if (pageWindow.WazeWrap?.LightReady) {
      WazeWrap = pageWindow.WazeWrap;  // Assign to global
      return;
    }

    // Create WazeWrap object and expose to both contexts
    if (!pageWindow.WazeWrap) pageWindow.WazeWrap = {};
    WazeWrap = pageWindow.WazeWrap;  // Assign to global
    if (sandboxed) window.WazeWrap = pageWindow.WazeWrap;

    // Set repo and load library
    pageWindow.WazeWrap.Repo = REPO;
    console.log('WazeWrap Light: Loading standalone library');
    $.getScript(WW_LIGHT_URL).fail(function(error) {
      console.error('Failed to load WazeWrap Light:', error);
    });
  }

  /**
   * Bootstrap - wait for jQuery, then check for Full version or initialize Light
   */
  function bootstrap(tries = 1) {
    if (typeof $ !== 'undefined') {
      // Give Full version up to 5 seconds to load, then initialize Light
      checkFullVersionLoaded(0);
    } else if (tries < 1000) {
      setTimeout(function () { bootstrap(tries++); }, 100);
    }
  }

  /**
   * Check if Full version is loading, wait for other scripts to load it
   */
  function checkFullVersionLoaded(tries = 0) {
    const sandboxed = typeof unsafeWindow !== 'undefined';
    const pageWindow = sandboxed ? unsafeWindow : window;

    // If Light already loaded, sync and exit
    if (pageWindow.WazeWrap?.LightReady) {
      if (sandboxed) window.WazeWrap = pageWindow.WazeWrap;
      WazeWrap = pageWindow.WazeWrap;
      return;
    }

    // If Full is ready, set LightReady and sync both scopes
    if (pageWindow.WazeWrap?.Ready) {
      pageWindow.WazeWrap.LightReady = true;
      WazeWrap = pageWindow.WazeWrap;  // Assign to global
      if (sandboxed) window.WazeWrap = pageWindow.WazeWrap;
      if (typeof unsafeWindow !== 'undefined') unsafeWindow.WazeWrap = pageWindow.WazeWrap;
      console.log('WazeWrap Light: Using Full version as provider');
      return;
    }

    // Wait up to 2 seconds for Full to load, then initialize Light if not found
    if (tries < 20) {
      setTimeout(function () { checkFullVersionLoaded(tries + 1); }, 100);
    } else {
      initLight();
    }
  }

  bootstrap();
})();
