// ==UserScript==
// @name         WazeWrap
// @namespace    https://greasyfork.org/users/30701-justins83-waze
// @version      2026.05.03.01
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


(function (define) {
    define(['jquery'], function ($) {
        return (function () {
            var $container;
            var listener;
            var toastId = 0;
            var toastType = {
                confirm: 'confirm',
                debug: 'debug',
                error: 'error',
                info: 'info',
                prompt: 'prompt',
                success: 'success',
                warning: 'warning'
            };

            var toastr = {
                clear: clear,
                confirm: confirm,
                debug: debug,
                remove: remove,
                error: error,
                getContainer: getContainer,
                info: info,
                options: {},
                prompt: prompt,
                subscribe: subscribe,
                success: success,
                version: '2.1.5',
                warning: warning
            };
            var previousToast;
            return toastr;
            function error(message, title, optionsOverride) {
                return notify({
                    type: toastType.error,
                    iconClass: getOptions().iconClasses.error,
                    message: message,
                    optionsOverride: optionsOverride,
                    title: title
                });
            }

            function getContainer(options, create) {
                if (!options) { options = getOptions(); }
                $container = $('#' + options.containerId);
                if ($container.length) {
                    return $container;
                }
                if (create) {
                    $container = createContainer(options);
                }
                return $container;
            }

            function info(message, title, optionsOverride) {
                return notify({
                    type: toastType.info,
                    iconClass: getOptions().iconClasses.info,
                    message: message,
                    optionsOverride: optionsOverride,
                    title: title
                });
            }

            function subscribe(callback) {
                listener = callback;
            }

            function success(message, title, optionsOverride) {
                return notify({
                    type: toastType.success,
                    iconClass: getOptions().iconClasses.success,
                    message: message,
                    optionsOverride: optionsOverride,
                    title: title
                });
            }

            function warning(message, title, optionsOverride) {
                return notify({
                    type: toastType.warning,
                    iconClass: getOptions().iconClasses.warning,
                    message: message,
                    optionsOverride: optionsOverride,
                    title: title
                });
            }

            function prompt(message, title, optionsOverride) {
                return notify({
                    type: toastType.prompt,
                    iconClass: getOptions().iconClasses.prompt,
                    message: message,
                    optionsOverride: optionsOverride,
                    title: title
                });
            }

            function confirm(message, title, optionsOverride) {
                return notify({
                    type: toastType.confirm,
                    iconClass: getOptions().iconClasses.confirm,
                    message: message,
                    optionsOverride: optionsOverride,
                    title: title
                });
            }

            function debug(message, title, optionsOverride) {
                console.groupCollapsed('%c' + title, 'background: #252525; color: #e94f64');
                console.log(message);
                console.groupEnd();
                return notify({
                    type: toastType.debug,
                    iconClass: getOptions().iconClasses.debug,
                    message: message,
                    optionsOverride: optionsOverride,
                    title: title
                });
            }

            function clear($toastElement, clearOptions) {
                var options = getOptions();
                if (!$container) { getContainer(options); }
                if (!clearToast($toastElement, options, clearOptions)) {
                    clearContainer(options);
                }
            }

            function remove($toastElement) {
                var options = getOptions();
                if (!$container) { getContainer(options); }
                if ($toastElement && $(':focus', $toastElement).length === 0) {
                    removeToast($toastElement);
                    return;
                }
                if ($container.children().length) {
                    $container.remove();
                }
            }

            // internal functions

            function clearContainer (options) {
                var toastsToClear = $container.children();
                for (var i = toastsToClear.length - 1; i >= 0; i--) {
                    clearToast($(toastsToClear[i]), options);
                }
            }

            function clearToast ($toastElement, options, clearOptions) {
                var force = clearOptions && clearOptions.force ? clearOptions.force : false;
                if ($toastElement && (force || $(':focus', $toastElement).length === 0)) {
                    $toastElement[options.hideMethod]({
                        duration: options.hideDuration,
                        easing: options.hideEasing,
                        complete: function () { removeToast($toastElement); }
                    });
                    return true;
                }
                return false;
            }

            function createContainer(options) {
                $container = $('<div/>')
                    .attr('id', options.containerId)
                    .addClass(options.positionClass)
                    .addClass(options.containerClass);

                $container.appendTo($(options.target));
                return $container;
            }

            function getDefaults() {
                return {
                    tapToDismiss: true, toastClass: 'toast-wazedev',
                    containerId: 'toast-container-wazedev', containerClass: 'toast-container-wazedev',
                    debug: false,

                    showMethod: 'fadeIn', //fadeIn, slideDown, and show are built into jQuery
                    showDuration: 300,
                    showEasing: 'swing', //swing and linear are built into jQuery
                    onShown: undefined,
                    hideMethod: 'fadeOut', hideDuration: 1000, hideEasing: 'swing',
                    onHidden: undefined,
                    closeMethod: false, closeDuration: false, closeEasing: false, closeOnHover: true,
                    extendedTimeOut: 1000,
                  
                    iconClasses: {
                        confirm: 'toast-confirm',
                        debug: 'toast-debug',
                        error: 'toast-error',
                        info: 'toast-info',
                        prompt: 'toast-prompt',
                        success: 'toast-success',
                        warning: 'toast-warning'
                    },
                    iconClass: 'toast-info',
                    positionClass: 'toast-top-right',
                    timeOut: 5000, // Set timeOut and extendedTimeOut to 0 to make it sticky
                    titleClass: 'toast-title',
                    messageClass: 'toast-message',
                    escapeHtml: false,
                    target: 'body',
                    closeHtml: '<button type="button">&times;</button>',
                    closeClass: 'toast-close-button',
                    newestOnTop: true,
                    preventDuplicates: false,
                    progressBar: false,
                    progressClass: 'toast-progress',
                    rtl: false,
                    PromptDefaultInput: '',
                    ConfirmOkButtonText: 'Ok',
                    ConfirmCancelButtonText: 'Cancel'
                };
            }

            function publish(args) {
                if (!listener) { return; }
                listener(args);
            }

            function notify(map) {
                if (map.message.length === 0) { return; }

                var options = getOptions();
                var iconClass = map.iconClass || options.iconClass;

                if (typeof (map.optionsOverride) !== 'undefined') {
                    options = $.extend(options, map.optionsOverride);
                    iconClass = map.optionsOverride.iconClass || iconClass;
                }

                // Force sticky behavior for prompt, confirm, and debug types
                if (map.type === toastType.prompt || map.type === toastType.confirm) {
                    options.tapToDismiss = false;
                    options.timeOut = 0;
                    options.extendedTimeOut = 0;
                    options.closeButton = false;
                }
                if (map.type === toastType.debug) {
                    options.tapToDismiss = false;
                    options.timeOut = 0;
                    options.extendedTimeOut = 0;
                    options.closeButton = true;
                }

                if (shouldExit(options, map)) { return; }

                toastId++;
                $container = getContainer(options, true);

                var intervalId = null;
                var $toastElement = $('<div/>');
                var $titleElement = $('<div/>');
                var $messageElement = $('<div/>');
                var $progressElement = $('<div/>');
                var $closeElement = $(options.closeHtml);
                var $promptContainer = $('<div/>');
                var $promptOkButton = $('<button class="btn btn-primary toast-ok-btn">Ok</button>');
                var $promptCancelButton = $('<button class="btn btn-danger">Cancel</button>');
                var $promptInput = $('<input type="text" class="toast-prompt-input"/>');
                var $confirmContainer = $('<div/>');
                var $confirmOkButton = $('<button class="btn btn-primary toast-ok-btn"></button>');
                var $confirmCancelButton = $('<button class="btn btn-danger"></button>');
                $confirmOkButton.text(options.ConfirmOkButtonText);
                $confirmCancelButton.text(options.ConfirmCancelButtonText);
                var progressBar = {
                    intervalId: null,
                    hideEta: null,
                    maxHideTime: null
                };
                var response = {
                    toastId: toastId,
                    state: 'visible',
                    startTime: new Date(),
                    options: options,
                    map: map
                };

                personalizeToast();
                displayToast();
                handleEvents();
                publish(response);

                if (options.debug && console) {
                    console.log(response);
                }

                return $toastElement;

                function escapeHtml(source) {
                    if (source == null) {
                        source = '';
                    }

                    return source
                        .replace(/&/g, '&amp;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&#39;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');
                }

                function personalizeToast() {
                    setIcon();
                    setTitle();
                    setMessage();
                    setPrompt();
                    setConfirm();
                    setCloseButton();
                    setProgressBar();
                    setRTL();
                    setSequence();
                    setAria();
                }

                function setAria() {
                    var ariaValue = '';
                    switch (map.iconClass) {
                        case 'toast-success':
                        case 'toast-info':
                            ariaValue =  'polite';
                            break;
                        default:
                            ariaValue = 'assertive';
                    }
                    $toastElement.attr('aria-live', ariaValue);
                }

                function handleEvents() {
                    if (options.closeOnHover) {
                        $toastElement.hover(stickAround, delayedHideToast);
                    }

                    if (!options.onclick && options.tapToDismiss) {
                        $toastElement.click(hideToast);
                    }

                    if (options.closeButton && $closeElement) {
                        $closeElement.click(function (event) {
                            if (event.stopPropagation) {
                                event.stopPropagation();
                            } else if (event.cancelBubble !== undefined && event.cancelBubble !== true) {
                                event.cancelBubble = true;
                            }

                            if (options.onCloseClick) {
                                options.onCloseClick(event);
                            }

                            hideToast(true);
                        });
                    }

                    if (options.onclick && options.type !== toastType.prompt) {
                        $toastElement.click(function (event) {
                            options.onclick(event);
                            hideToast();
                        });
                    }

                    if (map.type === toastType.prompt) {
                        $promptOkButton.click(function (event) {
                            if (options.promptOK) { options.promptOK(event, $promptInput.val()); }
                            hideToast(true);
                        });
                        $promptCancelButton.click(function (event) {
                            if (options.promptCancel) { options.promptCancel(event); }
                            hideToast(true);
                        });
                    }

                    if (map.type === toastType.confirm) {
                        $confirmOkButton.click(function (event) {
                            if (options.confirmOK) { options.confirmOK(event); }
                            hideToast(true);
                        });
                        $confirmCancelButton.click(function (event) {
                            if (options.confirmCancel) { options.confirmCancel(event); }
                            hideToast(true);
                        });
                    }
                }

                function displayToast() {
                    $toastElement.hide();

                    $toastElement[options.showMethod](
                        {duration: options.showDuration, easing: options.showEasing, complete: options.onShown}
                    );

                    if (options.timeOut > 0) {
                        intervalId = setTimeout(hideToast, options.timeOut);
                        progressBar.maxHideTime = parseFloat(options.timeOut);
                        progressBar.hideEta = new Date().getTime() + progressBar.maxHideTime;
                        if (options.progressBar) {
                            progressBar.intervalId = setInterval(updateProgress, 10);
                        }
                    }
                }

                function setIcon() {
                    if (map.iconClass) {
                        $toastElement.addClass(options.toastClass).addClass(iconClass);
                    }
                }

                function setSequence() {
                    if (options.newestOnTop) {
                        $container.prepend($toastElement);
                    } else {
                        $container.append($toastElement);
                    }
                }

                function setTitle() {
                    if (map.title) {
                        var suffix = map.title;
                        if (options.escapeHtml) {
                            suffix = escapeHtml(map.title);
                        }
                        $titleElement.append(suffix).addClass(options.titleClass);
                        $toastElement.append($titleElement);
                    }
                }

                function setMessage() {
                    if (map.message) {
                        var suffix = map.message.replace(/\n/g, '<br/>');
                        if (options.escapeHtml) {
                            suffix = escapeHtml(map.message);
                        }
                        $messageElement.append(suffix).addClass(options.messageClass);
                        $toastElement.append($messageElement);
                    }
                }

                function setPrompt() {
                    if (map.type === toastType.prompt) {
                        $promptContainer.append($promptInput);
                        var $buttonRow = $('<div/>');
                        $buttonRow.append($promptOkButton);
                        $buttonRow.append($promptCancelButton);
                        $promptContainer.append($buttonRow);
                        $toastElement.append($promptContainer);
                        $promptInput.val(options.PromptDefaultInput);
                    }
                }

                function setConfirm() {
                    if (map.type === toastType.confirm) {
                        var $buttonRow = $('<div/>');
                        $buttonRow.append($confirmOkButton);
                        $buttonRow.append($confirmCancelButton);
                        $confirmContainer.append($buttonRow);
                        $toastElement.append($confirmContainer);
                    }
                }

                function setCloseButton() {
                    if (options.closeButton) {
                        $closeElement.addClass(options.closeClass).attr('role', 'button');
                        $toastElement.prepend($closeElement);
                    }
                }

                function setProgressBar() {
                    if (options.progressBar) {
                        $progressElement.addClass(options.progressClass);
                        $toastElement.prepend($progressElement);
                    }
                }

                function setRTL() {
                    if (options.rtl) {
                        $toastElement.addClass('rtl');
                    }
                }

                function shouldExit(options, map) {
                    if (options.preventDuplicates) {
                        if (map.message === previousToast) {
                            return true;
                        } else {
                            previousToast = map.message;
                        }
                    }
                    return false;
                }

                function hideToast(override) {
                    var method = override && options.closeMethod !== false ? options.closeMethod : options.hideMethod;
                    var duration = override && options.closeDuration !== false ?
                        options.closeDuration : options.hideDuration;
                    var easing = override && options.closeEasing !== false ? options.closeEasing : options.hideEasing;
                    if ($(':focus', $toastElement).length && !override) {
                        return;
                    }
                    clearTimeout(progressBar.intervalId);
                    return $toastElement[method]({
                        duration: duration,
                        easing: easing,
                        complete: function () {
                            removeToast($toastElement);
                            clearTimeout(intervalId);
                            if (options.onHidden && response.state !== 'hidden') {
                                options.onHidden();
                            }
                            response.state = 'hidden';
                            response.endTime = new Date();
                            publish(response);
                        }
                    });
                }

                function delayedHideToast() {
                    if (options.timeOut > 0 || options.extendedTimeOut > 0) {
                        intervalId = setTimeout(hideToast, options.extendedTimeOut);
                        progressBar.maxHideTime = parseFloat(options.extendedTimeOut);
                        progressBar.hideEta = new Date().getTime() + progressBar.maxHideTime;
                    }
                }

                function stickAround() {
                    clearTimeout(intervalId);
                    progressBar.hideEta = 0;
                    $toastElement.stop(true, true)[options.showMethod](
                        {duration: options.showDuration, easing: options.showEasing}
                    );
                }

                function updateProgress() {
                    var percentage = ((progressBar.hideEta - (new Date().getTime())) / progressBar.maxHideTime) * 100;
                    $progressElement.width(percentage + '%');
                }
            }

            function getOptions() {
                return $.extend({}, getDefaults(), toastr.options);
            }

            function removeToast($toastElement) {
                if (!$container) { $container = getContainer(); }
                if ($toastElement.is(':visible')) {
                    return;
                }
                $toastElement.remove();
                $toastElement = null;
                if ($container.children().length === 0) {
                    $container.remove();
                    previousToast = undefined;
                }
            }

        })();
    });
}(simpleDefine));
} // End initializeToastrLibrary()

  // ===== WAZEWRAP LIBRARY (Inline) =====
  // Main WazeWrap functionality with all utilities

  let wwSettings;

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
