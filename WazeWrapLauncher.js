// ==UserScript==
// @name         WazeWrap
// @namespace    https://greasyfork.org/users/30701-justins83-waze
// @version      2019.05.02.01
// @description  Launcher for the WazeWrap library
// @author       JustinS83/MapOMatic
// @include      https://beta.waze.com/*editor*
// @include      https://www.waze.com/*editor*
// @exclude      https://www.waze.com/*user/editor/*
// @grant        none
// ==/UserScript==

/* global W */
/* global WazeWrap */
/* global $ */
/* jshint esversion:6 */

var WazeWrap = {};

(function() {
    'use strict';

    let minVersion = '2019.05.01.01';
    
    function bootstrap(tries = 1) {
        if (W && W.map &&
            W.model && W.loginManager.user &&
            $)
            init();
        else if (tries < 1000)
            setTimeout(function () { bootstrap(tries++); }, 100);
        else
            console.log('WazeWrap failed to load');
    }
    
    bootstrap();
    
    async function init(){
        if(typeof unsafeWindow !== 'undefined'){
            if(unsafeWindow.WazeWrap && (!unsafeWindow.WazeWrap.Version || unsafeWindow.WazeWrap.Version > minVersion)){
                window.WazeWrap = unsafeWindow.WazeWrap;
                WazeWrap = window.WazeWrap;
            }
            else{
                unsafeWindow.WazeWrap = WazeWrap;
                window.WazeWrap = WazeWrap;
                await $.getScript('https://cdn.staticaly.com/gh/WazeDev/WazeWrap/master/WazeWrap.js?env=dev');
            }
        }
        else{
            if(window.WazeWrap && (!window.WazeWrap.Version || window.WazeWrap.Version > minVersion))
                WazeWrap = window.WazeWrap;
            else{
                window.WazeWrap = WazeWrap;
                await $.getScript('https://cdn.staticaly.com/gh/WazeDev/WazeWrap/master/WazeWrap.js?env=dev');
            }
        }
    }
    
})();
