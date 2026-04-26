// ==UserScript==
// @name         WazeWrap
// @namespace    https://greasyfork.org/users/30701-justins83-waze
// @version      2026.04.26.01
// @description  Self-contained WazeWrap with no external dependencies - includes toastr library and CSS
// @author       JustinS83/MapOMatic/JS55CT
// @include      https://beta.waze.com/*editor*
// @include      https://www.waze.com/*editor*
// @exclude      https://www.waze.com/*user/editor/*
// @grant        none
// @note         Scripts using ScriptUpdateMonitor must grant GM_xmlhttpRequest in their own header
// ==/UserScript==

/* global WazeWrap */
/* global $ */

/**
 * ===== WAZEWRAP LOADING PATTERN =====
 *
 * ARCHITECTURE:
 * This is a self-contained, single-file version of WazeWrap with all dependencies
 * (toastr library, CSS) embedded inline. No external network requests are made.
 *
 * LOADING SEQUENCE:
 * 1. Page load → IIFE starts immediately
 * 2. CSS and toastr library code are defined (not executed yet)
 * 3. bootstrapInit() polls for jQuery availability (up to 100 seconds)
 * 4. Once $ exists → initBootloader() + initWazeWrap() are called
 * 5. initializeToastr() → initializeToastrLibrary() (toastr UMD now executes with jQuery available)
 * 6. WazeWrap.Ready = true (signals to other scripts that WazeWrap is ready)
 *
 * MULTI-SCRIPT SAFETY:
 * - WazeWrap.Repo = 'self-contained' (set immediately, prevents duplicate init)
 * - WazeWrap.Ready = false (during init), then true (when complete)
 * - Other scripts can check WazeWrap.Ready before using WazeWrap.Alerts, etc.
 * - Sandbox-aware: WazeWrap available in both window and unsafeWindow contexts
 *
 * DEFERRED TOASTR INITIALIZATION:
 * - Toastr UMD pattern wrapped in initializeToastrLibrary() function
 * - Not executed until jQuery is confirmed available
 * - simpleDefine() loader passes jQuery explicitly to toastr factory
 * - Prevents "Cannot read properties of undefined" errors
 *
 * KEY MODULES:
 * - Alerts: Toast notifications (success, error, info, warning, debug, confirm, prompt)
 * - Interface: Script update notifications dashboard
 * - ScriptUpdateMonitor: Version checking for script updates
 */

var WazeWrap;

(function () {
  'use strict';

  // ===== TOASTR CSS =====
  // Injected directly into page to avoid external requests
  const TOASTR_CSS = `
.toast-title {
  font-weight: 700;
}
.toast-message {
  -ms-word-wrap: break-word;
  word-wrap: break-word;
}
.toast-message a,
.toast-message label {
  color: #fff;
}
.toast-message a:hover {
  color: #ccc;
  text-decoration: none;
}
.toast-debug {
  width: 700px !important;
}
.toast-debug > .toast-message {
  min-height: 400px;
  height: 60vh;
  overflow-y: auto;
}
.toast-close-button {
  position: relative;
  right: -0.3em;
  top: -0.3em;
  float: right;
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  -webkit-text-shadow: 0 1px 0 #fff;
  text-shadow: 0 1px 0 #fff;
  opacity: 0.8;
  -ms-filter: progid:DXImageTransform.Microsoft.Alpha(Opacity=80);
  filter: alpha(opacity=80);
  line-height: 1;
}
.toast-close-button:focus,
.toast-close-button:hover {
  color: #000;
  text-decoration: none;
  cursor: pointer;
  opacity: 0.4;
  -ms-filter: progid:DXImageTransform.Microsoft.Alpha(Opacity=40);
  filter: alpha(opacity=40);
}
.rtl .toast-close-button {
  left: -0.3em;
  float: left;
  right: 0.3em;
}
button.toast-close-button {
  padding: 0;
  cursor: pointer;
  background: 0 0;
  border: 0;
  -webkit-appearance: none;
}
.toast-top-center {
  top: 0;
  right: 0;
  width: 100%;
}
.toast-bottom-center {
  bottom: 0;
  right: 0;
  width: 100%;
}
.toast-top-full-width {
  top: 0;
  right: 0;
  width: 100%;
}
.toast-bottom-full-width {
  bottom: 0;
  right: 0;
  width: 100%;
}
.toast-top-center-wide {
  top: 32px;
  right: 0;
  width: 100%;
}
.toast-bottom-center-wide {
  bottom: 0;
  right: 0;
  width: 100%;
}
.toast-top-left {
  top: 12px;
  left: 12px;
}
.toast-top-right {
  top: 12px;
  right: 12px;
}
.toast-bottom-right {
  right: 12px;
  bottom: 12px;
}
.toast-bottom-left {
  bottom: 12px;
  left: 12px;
}
.toast-container-wazedev {
  position: absolute;
  z-index: 999999;
  pointer-events: none;
}
.toast-container-wazedev * {
  -moz-box-sizing: border-box;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
}
.toast-container-wazedev > div {
  position: relative;
  pointer-events: auto;
  overflow: hidden;
  margin: 0 0 6px;
  padding: 15px 15px 15px 50px;
  width: 300px;
  -moz-border-radius: 3px;
  -webkit-border-radius: 3px;
  border-radius: 3px;
  background-position: 15px center;
  background-repeat: no-repeat;
  -moz-box-shadow: 0 0 12px #999;
  -webkit-box-shadow: 0 0 12px #999;
  box-shadow: 0 0 12px #999;
  color: #fff;
  opacity: 0.95;
  -ms-filter: progid:DXImageTransform.Microsoft.Alpha(Opacity=95);
  filter: alpha(opacity=95);
}
.toast-container-wazedev > div.rtl {
  direction: rtl;
  padding: 15px 50px 15px 15px;
  background-position: right 15px center;
}
.toast-container-wazedev > div:hover {
  -moz-box-shadow: 0 0 12px #000;
  -webkit-box-shadow: 0 0 12px #000;
  box-shadow: 0 0 12px #000;
  opacity: 1;
  -ms-filter: progid:DXImageTransform.Microsoft.Alpha(Opacity=100);
  filter: alpha(opacity=100);
  cursor: pointer;
}
.toast-container-wazedev > .toast-info {
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAGwSURBVEhLtZa9SgNBEMc9sUxxRcoUKSzSWIhXpFMhhYWFhaBg4yPYiWCXZxBLERsLRS3EQkEfwCKdjWJAwSKCgoKCcudv4O5YLrt7EzgXhiU3/4+b2ckmwVjJSpKkQ6wAi4gwhT+z3wRBcEz0yjSseUTrcRyfsHsXmD0AmbHOC9Ii8VImnuXBPglHpQ5wwSVM7sNnTG7Za4JwDdCjxyAiH3nyA2mtaTJufiDZ5dCaqlItILh1NHatfN5skvjx9Z38m69CgzuXmZgVrPIGE763Jx9qKsRozWYw6xOHdER+nn2KkO+Bb+UV5CBN6WC6QtBgbRVozrahAbmm6HtUsgtPC19tFdxXZYBOfkbmFJ1VaHA1VAHjd0pp70oTZzvR+EVrx2Ygfdsq6eu55BHYR8hlcki+n+kERUFG8BrA0BwjeAv2M8WLQBtcy+SD6fNsmnB3AlBLrgTtVW1c2QN4bVWLATaIS60J2Du5y1TiJgjSBvFVZgTmwCU+dAZFoPxGEEs8nyHC9Bwe2GvEJv2WXZb0vjdyFT4Cxk3e/kIqlOGoVLwwPevpYHT+00T+hWwXDf4AJAOUqWcDhbwAAAAASUVORK5CYII=) !important;
}
.toast-container-wazedev > .toast-error {
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAHOSURBVEhLrZa/SgNBEMZzh0WKCClSCKaIYOED+AAKeQQLG8HWztLCImBrYadgIdY+gIKNYkBFSwu7CAoqCgkkoGBI/E28PdbLZmeDLgzZzcx83/zZ2SSXC1j9fr+I1Hq93g2yxH4iwM1vkoBWAdxCmpzTxfkN2RcyZNaHFIkSo10+8kgxkXIURV5HGxTmFuc75B2RfQkpxHG8aAgaAFa0tAHqYFfQ7Iwe2yhODk8+J4C7yAoRTWI3w/4klGRgR4lO7Rpn9+gvMyWp+uxFh8+H+ARlgN1nJuJuQAYvNkEnwGFck18Er4q3egEc/oO+mhLdKgRyhdNFiacC0rlOCbhNVz4H9FnAYgDBvU3QIioZlJFLJtsoHYRDfiZoUyIxqCtRpVlANq0EU4dApjrtgezPFad5S19Wgjkc0hNVnuF4HjVA6C7QrSIbylB+oZe3aHgBsqlNqKYH48jXyJKMuAbiyVJ8KzaB3eRc0pg9VwQ4niFryI68qiOi3AbjwdsfnAtk0bCjTLJKr6mrD9g8iq/S/B81hguOMlQTnVyG40wAcjnmgsCNESDrjme7wfftP4P7SP4N3CJZdvzoNyGq2c/HWOXJGsvVg+RA/k2MC/wN6I2YA2Pt8GkAAAAASUVORK5CYII=) !important;
}
.toast-container-wazedev > .toast-success {
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAADsSURBVEhLY2AYBfQMgf///3P8+/evAIgvA/FsIF+BavYDDWMBGroaSMMBiE8VC7AZDrIFaMFnii3AZTjUgsUUWUDA8OdAH6iQbQEhw4HyGsPEcKBXBIC4ARhex4G4BsjmweU1soIFaGg/WtoFZRIZdEvIMhxkCCjXIVsATV6gFGACs4Rsw0EGgIIH3QJYJgHSARQZDrWAB+jawzgs+Q2UO49D7jnRSRGoEFRILcdmEMWGI0cm0JJ2QpYA1RDvcmzJEWhABhD/pqrL0S0CWuABKgnRki9lLseS7g2AlqwHWQSKH4oKLrILpRGhEQCw2LiRUIa4lwAAAABJRU5ErkJggg==) !important;
}
.toast-container-wazedev > .toast-warning {
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAGYSURBVEhL5ZSvTsNQFMbXZGICMYGYmJhAQIJAICYQPAACiSDB8AiICQQJT4CqQEwgJvYASAQCiZiYmJhAIBATCARJy+9rTsldd8sKu1M0+dLb057v6/lbq/2rK0mS/TRNj9cWNAKPYIJII7gIxCcQ51cvqID+GIEX8ASG4B1bK5gIZFeQfoJdEXOfgX4QAQg7kH2A65yQ87lyxb27sggkAzAuFhbbg1K2kgCkB1bVwyIR9m2L7PRPIhDUIXgGtyKw575yz3lTNs6X4JXnjV+LKM/m3MydnTbtOKIjtz6VhCBq4vSm3ncdrD2lk0VgUXSVKjVDJXJzijW1RQdsU7F77He8u68koNZTz8Oz5yGa6J3H3lZ0xYgXBK2QymlWWA+RWnYhskLBv2vmE+hBMCtbA7KX5drWyRT/2JsqZ2IvfB9Y4bWDNMFbJRFmC9E74SoS0CqulwjkC0+5bpcV1CZ8NMej4pjy0U+doDQsGyo1hzVJttIjhQ7GnBtRFN1UarUlH8F3xict+HY07rEzoUGPlWcjRFRr4/gChZgc3ZL2d8oAAAAASUVORK5CYII=) !important;
}
.toast-container-wazedev > .toast-prompt {
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMS42/U4J6AAAARJJREFUSEu1k7EOhSAMRR2d3u7k/3+QfoHGqJtxcOP1NkAKViKKNzmpVLmlgJUx5lPUZEnUZERNNBfgnTbHoyYJbzpNEwVdy7IgJIvFCWfcElkahgHhVCg2zzZWBA9fpLS5ky/iCqC10oLndwXGcUSoeXvWdcUgkM0127bx2Aqtx1vZ2gPW1KRWzy3aaI7jQPgR8rzcXl96pApgMt7JFXNO/BvaN1JcoPQNkuICqS7eCIvmQy7ehb0gwX/ARezVeqV93xHYHMgCXIR43Im9rt4cSHNH9nnM84yAeYE5CAaE2gFW1nWd6fuewTMJho6TsUMOrraHbwMhv72NHMRbA+Pk6u4gBzC61XYOarIkarIcpvoDnRHBRUBBxjQAAAAASUVORK5CYII=) !important;
}
.toast-container-wazedev > .toast-confirm {
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjEuNv1OCegAAAG+SURBVEhL7ZQ9S8NQFIYbq1VRFETBbwddXYWCo+Lm7iKik/4CFydRBBGlo4u7v0Khi9hBHNTFX2CHhhZSkzb1uelJ29Q0TRpHH3i5ufec857k5iaJsNRqtZRt2yOumPdJqDcw0DAaRtvo4BsYGyoWi/fkbHA9KCXhEfMl9IZM5r4QM9BjPp9fY6pJeXdInqbw3XEJQblcNmiyKeXBkD+Ock5lNB64qTGx8YcE9QKfpSAy1F6LlT/kJEk6qac3Ye1DraNZNFetVjOVSkWiTTgHFsOo2PlDQgodW5ZlqyIMdTTPZeNY5nK5AeJ3Ku7DpKR1hqT+Uqm0xV1+mqZ5xNxzQtScphnl5kP3BgoSNTSkRllyYK4+OLVVr1x74KnUEwe/6E5QrxmGsYLBJXK2rx2Wg19yJ6hVW7LKWHCcfCD+gqakJBrc+TLFX+LlgXWlJzTDNPzX7KKK2Ntbx60NTC2O5n6hUJhgGt3cBaOruqUXfng7DElJ6x0anNYtPVyg+OYKjPZoknXFl5zVdX1XwvHBdAGlW0XTRQnHB8NztSetsHYm4fhgdiO+Df66wa//zn8DD/itY3jYprSEA0gkfgDQ/HIWcSKxGQAAAABJRU5ErkJggg==) !important;
}
.toast-container-wazedev > .toast-debug {
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjEuNv1OCegAAALKSURBVEhLnZbNa1NBFMWTaimKCq1Y0YqCuBTpRlTUhSBVkBZEbP0XrIpduNL/wL3iui5ERJBacaEQsSAEgwELIqHgokGIiUqb729/5+XmNa8vX/bAYWbuPefOvJl5Lwm0klarDcEjYr1eH4ZBS3WENOj3NX1wyFJ+lMvlSQTfqtXq90qlkqKNEpuytA/SownDn/KJilm6O1jZIJPMYP5BO6eVxuPxvaLyFJsjt0rueigU2u6YtoJcLneYIr8ptkxRB/S/wl/ZbPaQybaOYrE4Ts08T+ABE+SInzDZ1kGhl1bTB3ILJusPeHx7yfasUOhxPp+fYMXHRPqXiD2BKyZz4avBPo5R5Bbid7TrtJ8RjVtaN+ViqVR6Q+5VJpM5gP4gmufwRaFQuGIybeVxedFnaZfQ32ExY9qCPJ0C7XuC9+hH4R+EFxjPEi9oOwT686IN6+jKcBbtZeJr8Aueu7RvYRFmA8lk8iSiUVuIHnEnokVitUaZDRD6KNrQAzwLsVjMfclUkxt43oZekNwDS+Z10WkCVqpd2GH23uAQj2Lo+wmYoJJOp/eb3Q80A3CwSQ7vGq0PnSYQOPxJGrcGHHCKRyIRfRL0HUm30Lc9goqLNvRAHvM65OCXCQed1RPQlbrfJI/82nFtArluh/wBPmipc9t5gnbg3p8ynwfdJsBz1uy9QZFRWDGvi04TECvSDJu9MxDuZnsewU/0+76mxApszxK+h6ph5bxAF0SwCP/CZzDesG+g0wRoV80jb/sPIKc+JTEFpjWmHUGsm+Ci3QRooolEYpd5pmGN8zinsQt02xDqOxKm7/4O67eAeMapBDZPQH9dGpM3dyFMXHUa74HAjGcIChMWckFsBpatoDuBYuCqyVzow0dOT3HaQo03WVfThj6gv8HK1jA/pZ1nrEO9aWkPqBXUgmn/73c6lUrpA6i/NeKIhXsgEPgHYbgVlAQqkpAAAAAASUVORK5CYII=);
}
.toast-container-wazedev.toast-bottom-center > div,
.toast-container-wazedev.toast-top-center > div {
  width: 300px;
  margin-left: auto;
  margin-right: auto;
}
.toast-container-wazedev.toast-bottom-full-width > div,
.toast-container-wazedev.toast-top-full-width > div {
  width: 96%;
  margin-left: auto;
  margin-right: auto;
}
.toast-container-wazedev.toast-bottom-center-wide > div,
.toast-container-wazedev.toast-top-center-wide > div {
  width: 500px;
  margin-left: auto;
  margin-right: auto;
}
.toast-wazedev {
  background-color: #030303;
}
.toast-success {
  background-color: #51a351;
}
.toast-error {
  background-color: #bd362f;
}
.toast-info {
  background-color: #2f96b4;
}
.toast-warning {
  background-color: #f89406;
}
.toast-prompt {
  background-color: #369 !important;
}
.toast-confirm,
.toast-debug {
  background-color: #555;
}
.toast-progress {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 4px;
  background-color: #000;
  opacity: 0.4;
  -ms-filter: progid:DXImageTransform.Microsoft.Alpha(Opacity=40);
  filter: alpha(opacity=40);
}
.btn {
  border: 0;
  border-radius: 5px;
  cursor: pointer;
  font-family: "Waze Boing Medium", "Waze Boing HB", sans-serif;
  font-size: 12px;
  height: 28px;
  line-height: 18px;
  padding: 6px 20px;
  transition: all 0.1s ease;
  display: inline-block;
  margin-bottom: 0;
  font-weight: normal;
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  touch-action: manipulation;
  background-image: none;
  -webkit-user-select: none;
  user-select: none;
}
.btn:hover {
  text-decoration: none;
}
.btn-primary {
  color: #fff;
  background-color: #3279b7;
  border-color: #2d6da3;
}
.btn.btn-primary {
  background-color: #78b0bf;
  box-shadow: 0 2px 0 #559cae;
  color: #fff;
}
.btn-danger {
  color: #fff;
  background-color: #d9534f;
  border-color: #d4463a;
}
.btn.btn-danger {
  background-color: #eb7171;
  box-shadow: 0 2px 0 #e66262;
  color: #fff;
}
.btn-danger:hover {
  background-color: #d9534f;
}
.toast-ok-btn {
  margin-right: 8px;
}
.toast-prompt-input {
  width: 100%;
}
@media all and (max-width: 240px) {
  .toast-container-wazedev > div {
    padding: 8px 8px 8px 50px;
    width: 11em;
  }
  .toast-container-wazedev > div.rtl {
    padding: 8px 50px 8px 8px;
  }
  .toast-container-wazedev .toast-close-button {
    right: -0.2em;
    top: -0.2em;
  }
  .toast-container-wazedev .rtl .toast-close-button {
    left: -0.2em;
    right: 0.2em;
  }
}
@media all and (min-width: 241px) and (max-width: 480px) {
  .toast-container-wazedev > div {
    padding: 8px 8px 8px 50px;
    width: 18em;
  }
  .toast-container-wazedev > div.rtl {
    padding: 8px 50px 8px 8px;
  }
  .toast-container-wazedev .toast-close-button {
    right: -0.2em;
    top: -0.2em;
  }
  .toast-container-wazedev .rtl .toast-close-button {
    left: -0.2em;
    right: 0.2em;
  }
}
@media all and (min-width: 481px) and (max-width: 768px) {
  .toast-container-wazedev > div {
    padding: 15px 15px 15px 50px;
    width: 25em;
  }
  .toast-container-wazedev > div.rtl {
    padding: 15px 50px 15px 15px;
  }
}
`;

  // ===== TOASTR LIBRARY (Inline) =====
  // Embedded directly without external dependencies
  // Wrapped in function to ensure jQuery is available when toastr initializes
  function initializeToastrLibrary() {
    // Define a simple AMD-like loader that handles jQuery dependency
    const simpleDefine = function(deps, factory) {
      // deps is ['jquery'], get jQuery and call factory
      const jQuery = typeof $ !== 'undefined' ? $ : window.jQuery;
      if (!jQuery) {
        console.error('WazeWrap: jQuery not available for toastr initialization');
        return;
      }
      // Call factory and store result in window.wazedevtoastr
      window.wazedevtoastr = factory(jQuery);
      return window.wazedevtoastr;
    };

    // Call the UMD pattern with our simple loader
    !(function (e) {
      e(['jquery'], function (e) {
        return (function () {
        function t(e, t, n) {
          return C({ type: x.error, iconClass: h().iconClasses.error, message: e, optionsOverride: n, title: t });
        }
        function n(t, n) {
          return (t || (t = h()), (w = e('#' + t.containerId)), w.length ? w : (n && (w = f(t)), w));
        }
        function o(e, t, n) {
          return C({ type: x.info, iconClass: h().iconClasses.info, message: e, optionsOverride: n, title: t });
        }
        function i(e) {
          O = e;
        }
        function s(e, t, n) {
          return C({ type: x.prompt, iconClass: h().iconClasses.prompt, message: e, optionsOverride: n, title: t });
        }
        function a(e, t, n) {
          return C({ type: x.success, iconClass: h().iconClasses.success, message: e, optionsOverride: n, title: t });
        }
        function r(e, t, n) {
          return C({ type: x.warning, iconClass: h().iconClasses.warning, message: e, optionsOverride: n, title: t });
        }
        function c(e, t) {
          var o = h();
          (w || n(o), m(e, o, t) || p(o));
        }
        function l(e, t, n) {
          return C({ type: x.confirm, iconClass: h().iconClasses.confirm, message: e, optionsOverride: n, title: t });
        }
        function u(e, t, n) {
          return (
            console.groupCollapsed('%c' + t, 'background: #252525; color: #e94f64'),
            console.log(e),
            console.groupEnd(),
            C({ type: x.debug, iconClass: h().iconClasses.debug, message: e, optionsOverride: n, title: t })
          );
        }
        function d(t) {
          var o = h();
          return (w || n(o), t && 0 === e(':focus', t).length ? void b(t) : void (w.children().length && w.remove()));
        }
        function p(t) {
          for (var n = w.children(), o = n.length - 1; o >= 0; o--) m(e(n[o]), t);
        }
        function m(t, n, o) {
          var i = !(!o || !o.force) && o.force;
          return (
            !(!t || (!i && 0 !== e(':focus', t).length)) &&
            (t[n.hideMethod]({
              duration: n.hideDuration,
              easing: n.hideEasing,
              complete: function () {
                b(t);
              },
            }),
            !0)
          );
        }
        function f(t) {
          return ((w = e('<div/>').attr('id', t.containerId).addClass(t.positionClass).addClass(t.containerClass)), w.appendTo(e(t.target)), w);
        }
        function g() {
          return {
            tapToDismiss: !0,
            toastClass: 'toast-wazedev',
            containerId: 'toast-container-wazedev',
            containerClass: 'toast-container-wazedev',
            debug: !1,
            showMethod: 'fadeIn',
            showDuration: 300,
            showEasing: 'swing',
            onShown: void 0,
            hideMethod: 'fadeOut',
            hideDuration: 1e3,
            hideEasing: 'swing',
            onHidden: void 0,
            closeMethod: !1,
            closeDuration: !1,
            closeEasing: !1,
            closeOnHover: !0,
            extendedTimeOut: 1e3,
            iconClasses: { confirm: 'toast-confirm', debug: 'toast-debug', error: 'toast-error', info: 'toast-info', prompt: 'toast-prompt', success: 'toast-success', warning: 'toast-warning' },
            iconClass: 'toast-info',
            positionClass: 'toast-top-right',
            timeOut: 5e3,
            titleClass: 'toast-title',
            messageClass: 'toast-message',
            escapeHtml: !1,
            target: 'body',
            closeHtml: '<button type="button">&times;</button>',
            closeClass: 'toast-close-button',
            newestOnTop: !0,
            preventDuplicates: !1,
            progressBar: !1,
            progressClass: 'toast-progress',
            rtl: !1,
            PromptDefaultInput: '',
            ConfirmOkButtonText: 'Ok',
            ConfirmCancelButtonText: 'Cancel',
          };
        }
        function v(e) {
          O && O(e);
        }
        function C(t) {
          function o(e) {
            return (null == e && (e = ''), e.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
          }
          function i() {
            (('prompt' !== t.type && 'confirm' !== t.type) || ((B.tapToDismiss = !1), (B.timeOut = 0), (B.extendedTimeOut = 0), (B.closeButton = !1)),
              'debug' === t.type && ((B.tapToDismiss = !1), (B.timeOut = 0), (B.extendedTimeOut = 0), (B.closeButton = !0)));
          }
          function s() {
            (l(), d(), p(), m(), f(), g(), C(), O(), u(), a());
          }
          function a() {
            var e = '';
            switch (t.iconClass) {
              case 'toast-success':
              case 'toast-info':
                e = 'polite';
                break;
              default:
                e = 'assertive';
            }
            q.attr('aria-live', e);
          }
          function r(e) {
            (B.closeOnHover && q.hover(H, k),
              !B.onclick && B.tapToDismiss && q.click(D),
              B.closeButton &&
                j &&
                j.click(function (e) {
                  (e.stopPropagation ? e.stopPropagation() : void 0 !== e.cancelBubble && e.cancelBubble !== !0 && (e.cancelBubble = !0), B.onCloseClick && B.onCloseClick(e), D(!0));
                }),
              B.onclick &&
                'prompt' !== B.type &&
                q.click(function (e) {
                  (B.onclick(e), D());
                }),
              'prompt' === e.type &&
                (S.click(function (e) {
                  (B.promptOK && B.promptOK(e, A.val()), D(!0));
                }),
                Q.click(function (e) {
                  (B.promptCancel && B.promptCancel(e), D(!0));
                })),
              'confirm' === e.type &&
                (J.click(function (e) {
                  (B.confirmOK && B.confirmOK(e), D(!0));
                }),
                L.click(function (e) {
                  (B.confirmCancel && B.confirmCancel(e), D(!0));
                })));
          }
          function c() {
            (q.hide(),
              q[B.showMethod]({ duration: B.showDuration, easing: B.showEasing, complete: B.onShown }),
              B.timeOut > 0 &&
                ((M = setTimeout(D, B.timeOut)), (N.maxHideTime = parseFloat(B.timeOut)), (N.hideEta = new Date().getTime() + N.maxHideTime), B.progressBar && (N.intervalId = setInterval(E, 10))));
          }
          function l() {
            t.iconClass && q.addClass(B.toastClass).addClass(I);
          }
          function u() {
            B.newestOnTop ? w.prepend(q) : w.append(q);
          }
          function d() {
            if (t.title) {
              var e = t.title;
              (B.escapeHtml && (e = o(t.title)), z.append(e).addClass(B.titleClass), q.append(z));
            }
          }
          function p() {
            if (t.message) {
              var e = t.message.replace(/\n/g, '<br/>');
              (B.escapeHtml && (e = o(t.message)), K.append(e).addClass(B.messageClass), q.append(K));
            }
          }
          function m() {
            if ('prompt' === t.type) {
              F.append(A);
              var n = e('<div/>');
              (n.append(S), n.append(Q), F.append(n), q.append(F), A.val(B.PromptDefaultInput));
            }
          }
          function f() {
            if ('confirm' === t.type) {
              var n = e('<div/>');
              (n.append(J), n.append(L), G.append(n), q.append(G));
            }
          }
          function g() {
            B.closeButton && (j.addClass(B.closeClass).attr('role', 'button'), q.prepend(j));
          }
          function C() {
            B.progressBar && (P.addClass(B.progressClass), q.prepend(P));
          }
          function O() {
            B.rtl && q.addClass('rtl');
          }
          function x(e, t) {
            if (e.preventDuplicates) {
              if (t.message === T) return !0;
              T = t.message;
            }
            return !1;
          }
          function D(t) {
            var n = t && B.closeMethod !== !1 ? B.closeMethod : B.hideMethod,
              o = t && B.closeDuration !== !1 ? B.closeDuration : B.hideDuration,
              i = t && B.closeEasing !== !1 ? B.closeEasing : B.hideEasing;
            if (!e(':focus', q).length || t)
              return (
                clearTimeout(N.intervalId),
                q[n]({
                  duration: o,
                  easing: i,
                  complete: function () {
                    (b(q), clearTimeout(M), B.onHidden && 'hidden' !== R.state && B.onHidden(), (R.state = 'hidden'), (R.endTime = new Date()), v(R));
                  },
                })
              );
          }
          function k() {
            (B.timeOut > 0 || B.extendedTimeOut > 0) && ((M = setTimeout(D, B.extendedTimeOut)), (N.maxHideTime = parseFloat(B.extendedTimeOut)), (N.hideEta = new Date().getTime() + N.maxHideTime));
          }
          function H() {
            (clearTimeout(M), (N.hideEta = 0), q.stop(!0, !0)[B.showMethod]({ duration: B.showDuration, easing: B.showEasing }));
          }
          function E() {
            var e = ((N.hideEta - new Date().getTime()) / N.maxHideTime) * 100;
            P.width(e + '%');
          }
          if (0 !== t.message.length) {
            var B = h(),
              I = t.iconClass || B.iconClass;
            if (('undefined' != typeof t.optionsOverride && ((B = e.extend(B, t.optionsOverride)), (I = t.optionsOverride.iconClass || I)), i(), !x(B, t))) {
              (y++, (w = n(B, !0)));
              var M = null,
                q = e('<div/>'),
                z = e('<div/>'),
                K = e('<div/>'),
                P = e('<div/>'),
                j = e(B.closeHtml),
                F = e('<div/>'),
                S = e('<button class="btn btn-primary toast-ok-btn">Ok</button>'),
                Q = e('<button class="btn btn-danger">Cancel</button>'),
                A = e('<input type="text" class="toast-prompt-input"/>'),
                G = e('<div/>'),
                J = e('<button class="btn btn-primary toast-ok-btn"></button>');
              J.text(B.ConfirmOkButtonText);
              var L = e('<button class="btn btn-danger"></button>');
              L.text(B.ConfirmCancelButtonText);
              var N = { intervalId: null, hideEta: null, maxHideTime: null },
                R = { toastId: y, state: 'visible', startTime: new Date(), options: B, map: t };
              return (s(), c(), r(t), v(R), B.debug && console && console.log(R), q);
            }
          }
        }
        function h() {
          return e.extend({}, g(), D.options);
        }
        function b(e) {
          (w || (w = n()), e.is(':visible') || (e.remove(), (e = null), 0 === w.children().length && (w.remove(), (T = void 0))));
        }
        var w,
          O,
          T,
          y = 0,
          x = { confirm: 'confirm', error: 'error', info: 'info', prompt: 'prompt', success: 'success', warning: 'warning', debug: 'debug' },
          D = { clear: c, confirm: l, debug: u, remove: d, error: t, getContainer: n, info: o, options: {}, prompt: s, subscribe: i, success: a, version: '2.1.5', warning: r };
        return D;
      })();
    });
    })(simpleDefine);
  } // End initializeToastrLibrary()

  // ===== WAZEWRAP LIBRARY (Inline) =====
  // Main WazeWrap functionality with all utilities

  let wwSettings;

  function setChecked(checkboxId, checked) {
    $('#' + checkboxId).prop('checked', checked);
  }

  function initializeToastr() {
    // Initialize toastr library first (now that jQuery is available)
    initializeToastrLibrary();

    // Inject CSS
    $('head').append($('<style type="text/css">' + TOASTR_CSS + '</style>'));

    wazedevtoastr.options = {
      target: '#map',
      timeOut: 6000,
      positionClass: 'toast-top-center-wide',
      closeOnHover: false,
      closeDuration: 0,
      showDuration: 0,
      closeButton: true,
      progressBar: true,
    };
  }

  function initializeScriptUpdateInterface() {
    console.log('Creating script update interface');
    injectCSS();

    var $section = $('<div>', { style: 'padding:8px 16px', id: 'wmeWWScriptUpdates' });
    $section.html(
      [
        '<div id="WWSU-Container" class="fa" style="position:fixed; top:20%; left:40%; z-index:1000; display:none;">',
        '<div id="WWSU-Close" class="fa-close fa-lg"></div>',
        '<div class="modal-heading">',
        '<h2>Script Updates</h2>',
        '<h4><span id="WWSU-updateCount">0</span> of your scripts have updates</h4>',
        '</div>',
        '<div class="WWSU-updates-wrapper">',
        '<div id="WWSU-script-list">',
        '</div>',
        '<div id="WWSU-script-update-info">',
        '</div></div></div>',
      ].join(' '),
    );
    $('#WazeMap').append($section.html());

    $('#WWSU-Close').click(function () {
      $('#WWSU-Container').hide();
    });

    $(document).on('click', '.WWSU-script-item', function () {
      $('.WWSU-script-item').removeClass('WWSU-active');
      $(this).addClass('WWSU-active');
    });
  }

  function injectCSS() {
    let css = [
      '#WWSU-Container { position:relative; background-color:#fbfbfb; width:650px; height:375px; border-radius:8px; padding:20px; box-shadow: 0 22px 84px 0 rgba(87, 99, 125, 0.5); border:1px solid #ededed; }',
      '#WWSU-Close { color:#000000; background-color:#ffffff; border:1px solid #ececec; border-radius:10px; height:25px; width:25px; position: absolute; right:14px; top:10px; cursor:pointer; padding: 5px 0px 0px 5px;}',
      '#WWSU-Container .modal-heading,.WWSU-updates-wrapper { font-family: "Helvetica Neue", Helvetica, "Open Sans", sans-serif; } ',
      '.WWSU-updates-wrapper { height:350px; }',
      '#WWSU-script-list { float:left; width:175px; height:100%; padding-right:6px; margin-right:10px; overflow-y: auto; overflow-x: hidden; height:300px; }',
      '.WWSU-script-item { text-decoration: none; min-height:40px; display:flex; text-align: center; justify-content: center; align-items: center; margin:3px 3px 10px 3px; background-color:white; border-radius:8px; box-shadow: rgba(0, 0, 0, 0.4) 0px 1px 1px 0.25px; transition:all 200ms ease-in-out; cursor:pointer;}',
      '.WWSU-script-item:hover { text-decoration: none; }',
      '.WWSU-active { transform: translate3d(5px, 0px, 0px); box-shadow: rgba(0, 0, 0, 0.4) 0px 3px 7px 0px; }',
      '#WWSU-script-update-info { width:auto; background-color:white; height:275px; overflow-y:auto; border-radius:8px; box-shadow: rgba(0, 0, 0, 0.09) 0px 6px 7px 0.09px; padding:15px; position:relative;}',
      '#WWSU-script-update-info div { display: none;}',
      '#WWSU-script-update-info div:target { display: block; }',
    ].join(' ');
    $('<style type="text/css">' + css + '</style>').appendTo('head');
  }

  function Interface() {
    this.ShowScriptUpdate = function (scriptName, version, updateHTML, greasyforkLink = '', forumLink = '') {
      let settings;
      function loadSettings() {
        var loadedSettings = $.parseJSON(localStorage.getItem('WWScriptUpdate'));
        var defaultSettings = {
          ScriptUpdateHistory: {},
        };
        settings = loadedSettings ? loadedSettings : defaultSettings;
        for (var prop in defaultSettings) {
          if (!settings.hasOwnProperty(prop)) settings[prop] = defaultSettings[prop];
        }
      }

      function saveSettings() {
        if (localStorage) {
          var localsettings = {
            ScriptUpdateHistory: settings.ScriptUpdateHistory,
          };
          localStorage.setItem('WWScriptUpdate', JSON.stringify(localsettings));
        }
      }

      loadSettings();

      if (updateHTML && updateHTML.length > 0 && (typeof settings.ScriptUpdateHistory[scriptName] === 'undefined' || settings.ScriptUpdateHistory[scriptName] != version)) {
        let currCount = $('.WWSU-script-item').length;
        let divID = (scriptName + ('' + version)).toLowerCase().replace(/[^a-z-_0-9]/g, '');
        $('#WWSU-script-list').append(`<a href="#${divID}" class="WWSU-script-item ${currCount === 0 ? 'WWSU-active' : ''}">${scriptName}</a>`);
        $('#WWSU-updateCount').html(parseInt($('#WWSU-updateCount').html()) + 1);
        let install = '',
          forum = '';
        if (greasyforkLink != '') install = `<a href="${greasyforkLink}" target="_blank">Greasyfork</a>`;
        if (forumLink != '') forum = `<a href="${forumLink}" target="_blank">Forum</a>`;
        let footer = '';
        if (forumLink != '' || greasyforkLink != '') {
          footer = `<span class="WWSUFooter" style="margin-bottom:2px; display:block;">${install}${greasyforkLink != '' && forumLink != '' ? ' | ' : ''}${forum}</span>`;
        }
        $('#WWSU-script-update-info').append(`<div id="${divID}"><span><h3>${version}</h3><br>${updateHTML}</span>${footer}</div>`);
        $('#WWSU-Container').show();
        if (currCount === 0) $('#WWSU-script-list').find('a')[0].click();
        settings.ScriptUpdateHistory[scriptName] = version;
        saveSettings();
      }
    };
  }

  function Alerts() {
    this.success = function (scriptName, message) {
      wazedevtoastr.success(message, scriptName);
    };

    this.info = function (scriptName, message, disableTimeout, disableClickToClose, timeOut) {
      let options = {};
      if (disableTimeout) options.timeOut = 0;
      else if (timeOut) options.timeOut = timeOut;

      if (disableClickToClose) options.tapToDismiss = false;

      wazedevtoastr.info(message, scriptName, options);
    };

    this.warning = function (scriptName, message) {
      wazedevtoastr.warning(message, scriptName);
    };

    this.error = function (scriptName, message) {
      wazedevtoastr.error(message, scriptName);
    };

    this.debug = function (scriptName, message) {
      wazedevtoastr.debug(message, scriptName);
    };

    this.prompt = function (scriptName, message, defaultText = '', okFunction, cancelFunction) {
      wazedevtoastr.prompt(message, scriptName, { promptOK: okFunction, promptCancel: cancelFunction, PromptDefaultInput: defaultText });
    };

    this.confirm = function (scriptName, message, okFunction, cancelFunction, okBtnText = 'Ok', cancelBtnText = 'Cancel') {
      wazedevtoastr.confirm(message, scriptName, { confirmOK: okFunction, confirmCancel: cancelFunction, ConfirmOkButtonText: okBtnText, ConfirmCancelButtonText: cancelBtnText });
    };

    this.ScriptUpdateMonitor = class {
      #lastVersionChecked = '0';
      #scriptName;
      #currentVersion;
      #downloadUrl;
      #metaUrl;
      #metaRegExp;
      #GM_xmlhttpRequest;
      #intervalChecker = null;

      constructor(scriptName, currentVersion, downloadUrl, GM_xmlhttpRequest, metaUrl = null, metaRegExp = null) {
        this.#scriptName = scriptName;
        this.#currentVersion = currentVersion;
        this.#downloadUrl = downloadUrl;
        this.#GM_xmlhttpRequest = GM_xmlhttpRequest;
        this.#metaUrl = metaUrl;
        this.#metaRegExp = metaRegExp || /@version\s+(.+)/i;
        this.#validateParameters();
      }

      start(intervalHours = 2, checkImmediately = true) {
        if (intervalHours < 1) {
          throw new Error('Parameter intervalHours must be at least 1');
        }
        if (!this.#intervalChecker) {
          if (checkImmediately) this.#postAlertIfNewReleaseAvailable();
          this.#intervalChecker = setInterval(() => this.#postAlertIfNewReleaseAvailable(), intervalHours * 60 * 60 * 1000);
        }
      }

      stop() {
        if (this.#intervalChecker) {
          clearInterval(this.#intervalChecker);
          this.#intervalChecker = null;
        }
      }

      #validateParameters() {
        if (this.#metaUrl) {
          if (!this.#metaRegExp) {
            throw new Error('metaRegExp must be defined if metaUrl is defined.');
          }
          if (!(this.#metaRegExp instanceof RegExp)) {
            throw new Error('metaUrl must be a regular expression.');
          }
        } else {
          if (!/\.user\.js$/.test(this.#downloadUrl)) {
            throw new Error('Invalid downloadUrl paramenter. Must end with ".user.js" [', this.#downloadUrl, ']');
          }
          this.#metaUrl = this.#downloadUrl.replace(/\.user\.js$/, '.meta.js');
        }
      }

      async #postAlertIfNewReleaseAvailable() {
        const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
        let latestVersion;
        try {
          let tries = 1;
          const maxTries = 3;
          while (tries <= maxTries) {
            latestVersion = await this.#fetchLatestReleaseVersion();
            if (latestVersion === 503) {
              if (tries < maxTries) {
                console.log(`${this.#scriptName}: Checking for latest version again (retry #${tries})`);
                await sleep(1000);
              } else {
                console.error(`${this.#scriptName}: Failed to check latest version #. Too many 503 status codes returned.`);
              }
              tries += 1;
            } else if (latestVersion.status) {
              console.error(`${this.#scriptName}: Error while checking for latest version.`, latestVersion);
              return;
            } else {
              break;
            }
          }
        } catch (ex) {
          console.error(`${this.#scriptName}: Error while checking for latest version.`, ex);
          return;
        }
        if (latestVersion > this.#currentVersion && latestVersion > (this.#lastVersionChecked || '0')) {
          this.#lastVersionChecked = latestVersion;
          this.#postNewVersionAlert(latestVersion);
        }
      }

      #postNewVersionAlert(newVersion) {
        const message = `<a href="${this.#downloadUrl}" target = "_blank">Version ${newVersion}</a> is available.<br>Update now to get the latest features and fixes.`;
        WazeWrap.Alerts.info(this.#scriptName, message, true, false);
      }

      #fetchLatestReleaseVersion() {
        const metaUrl = this.#metaUrl;
        const metaRegExp = this.#metaRegExp;
        return new Promise((resolve, reject) => {
          this.#GM_xmlhttpRequest({
            nocache: true,
            revalidate: true,
            url: metaUrl,
            onload(res) {
              if (res.status === 503) {
                resolve(503);
              } else if (res.status === 200) {
                const versionMatch = res.responseText.match(metaRegExp);
                if (versionMatch?.length !== 2) {
                  throw new Error(`Invalid RegExp expression (${metaRegExp}) or version # could not be found at this URL: ${metaUrl}`);
                }
                resolve(res.responseText.match(metaRegExp)[1]);
              } else {
                resolve(res);
              }
            },
            onerror(res) {
              reject(res);
            },
          });
        });
      }
    };
  }

  // ===== INITIALIZATION FUNCTIONS =====
  // All boot and initialization logic grouped together

  function initBootloader() {
    const sandboxed = typeof unsafeWindow !== 'undefined';
    const pageWindow = sandboxed ? unsafeWindow : window;

    // Duplicate loading prevention: Check if WazeWrap is already initializing or ready
    if (pageWindow.WazeWrap && pageWindow.WazeWrap.Repo) {
      console.log('WazeWrap already loading or initialized, skipping init');
      WazeWrap = pageWindow.WazeWrap;
      if (sandboxed) window.WazeWrap = pageWindow.WazeWrap;
      return;
    }

    // Create WazeWrap object and expose to both contexts
    if (!pageWindow.WazeWrap) pageWindow.WazeWrap = {};
    WazeWrap = pageWindow.WazeWrap;
    if (sandboxed) window.WazeWrap = pageWindow.WazeWrap;

    // Set loading flag IMMEDIATELY (signals other loaders that WazeWrap is initializing)
    // Repo = initialization flag (prevents duplicate init), Ready = completion flag
    pageWindow.WazeWrap.Repo = 'self-contained';
    pageWindow.WazeWrap.Ready = false;
  }

  async function initWazeWrap() {
    console.log('Initializing WazeWrap (Self-Contained)...');

    try {
      initializeScriptUpdateInterface();
    } catch (e) {
      console.warn('Error initializing script update interface:', e);
    }

    try {
      initializeToastr();
    } catch (e) {
      console.warn('Error loading toastr:', e);
    }

    WazeWrap.Alerts = new Alerts();
    WazeWrap.Interface = new Interface();

    // Signal full initialization complete - other scripts can now use WazeWrap
    WazeWrap.Ready = true;

    console.log('WazeWrap initialized successfully (Self-Contained)');
  }

  function bootstrapInit(tries = 1) {
    if (typeof $ !== 'undefined') {
      initBootloader();
      initWazeWrap();
    } else if (tries < 1000) {
      setTimeout(function () {
        bootstrapInit(tries++);
      }, 100);
    } else {
      console.error('WazeWrap failed to load - jQuery not available after 100 seconds');
    }
  }

  // ===== START BOOT SEQUENCE =====
  bootstrapInit();
})();
