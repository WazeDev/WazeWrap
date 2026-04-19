/**
 * WazeWrap Library
 * Alerts and script update monitoring for WME scripts
 *
 * Version: 3.0.0
 * Features: Alerts, Script Update Monitoring, Update Dashboard
 *
 * Features:
 * - Alert system with toastr integration
 * - Script update monitoring
 * - Update notification dashboard
 */

(function() {
  'use strict';

  // Settings object - initialized in loadSettings
  let wwSettings;

  // WazeWrap is set up by loader before library loads
  const WazeWrap = window.WazeWrap;

  // ===== Bootstrap - Wait for Dependencies =====

  function bootstrap(tries = 1) {
    if (typeof $ !== 'undefined') {
      init();
    } else if (tries < 1000) {
      setTimeout(function () { bootstrap(tries++); }, 100);
    } else {
      console.log('WazeWrap failed to load - jQuery not available');
    }
  }

  bootstrap();

  // ===== Initialization Entry Point =====
  async function init() {
    console.log('Initializing WazeWrap...');

    loadSettings();

    // Initialize script update interface (dashboard, alerts history)
    try {
      initializeScriptUpdateInterface();
    } catch (e) {
      console.warn('Error initializing script update interface:', e);
    }

    // Initialize toastr
    try {
      await initializeToastr();
    } catch (e) {
      console.warn('Error loading toastr:', e);
    }

    // Instantiate modules
    WazeWrap.Alerts = new Alerts();
    WazeWrap.Interface = new Interface();

    // Mark ready
    WazeWrap.Ready = true;

    console.log('WazeWrap initialized successfully');
  }

  // ===== Helper Function =====

  function setChecked(checkboxId, checked) {
    $('#' + checkboxId).prop('checked', checked);
  }

  // ===== Toastr Management =====

  async function initializeToastr() {
    try {
      await $.getScript('https://'+WazeWrap.Repo+'.github.io/WazeWrap/toastr.js');
      wazedevtoastr.options = {
        target: '#map',
        timeOut: 6000,
        positionClass: 'toast-top-center-wide',
        closeOnHover: false,
        closeDuration: 0,
        showDuration: 0,
        closeButton: true,
        progressBar: true
      };

      try {
        await $.getScript("https://greasyfork.org/scripts/454988-jqueryui-custom-build/code/jQueryUI%20custom%20build.js");
      }
      catch (err) {
        console.log("Could not load jQuery UI " + err);
      }
    }
    catch (err) {
      console.log(err);
    }
  }

  // ===== Script Update Interface =====

  function initializeScriptUpdateInterface() {
    console.log("Creating script update interface");
    injectCSS();

    var $section = $("<div>", { style: "padding:8px 16px", id: "wmeWWScriptUpdates" });
    $section.html([
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
      '</div></div></div>'
    ].join(' '));
    $("#WazeMap").append($section.html());

    $('#WWSU-Close').click(function () {
      $('#WWSU-Container').hide();
    });

    $(document).on('click', '.WWSU-script-item', function () {
      $('.WWSU-script-item').removeClass("WWSU-active");
      $(this).addClass("WWSU-active");
    });
  }

  // ===== Injects CSS (used by dashboard and toastr) =====

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
      '#WWSU-script-update-info div:target { display: block; }'
    ].join(' ');
    $('<style type="text/css">' + css + '</style>').appendTo('head');
  }

  // ===== Interface Module - ShowScriptUpdate only =====

  function Interface() {
    /**
			 * Shows the script update window with the given update text
			 * @function WazeWrap.Interface.ShowScriptUpdate
			 * @param {string}
			 * @param {string}
			 * @param {string}
			 * @param {string}
			 * @param {string}
			**/
    this.ShowScriptUpdate = function (scriptName, version, updateHTML, greasyforkLink = "", forumLink = "") {
      let settings;
      function loadSettings() {
        var loadedSettings = $.parseJSON(localStorage.getItem("WWScriptUpdate"));
        var defaultSettings = {
          ScriptUpdateHistory: {},
        };
        settings = loadedSettings ? loadedSettings : defaultSettings;
        for (var prop in defaultSettings) {
          if (!settings.hasOwnProperty(prop))
            settings[prop] = defaultSettings[prop];
        }
      }

      function saveSettings() {
        if (localStorage) {
          var localsettings = {
            ScriptUpdateHistory: settings.ScriptUpdateHistory,
          };

          localStorage.setItem("WWScriptUpdate", JSON.stringify(localsettings));
        }
      }

      loadSettings();

      if ((updateHTML && updateHTML.length > 0) && (typeof settings.ScriptUpdateHistory[scriptName] === "undefined" || settings.ScriptUpdateHistory[scriptName] != version)) {
        let currCount = $('.WWSU-script-item').length;
        let divID = (scriptName + ("" + version)).toLowerCase().replace(/[^a-z-_0-9]/g, '');
        $('#WWSU-script-list').append(`<a href="#${divID}" class="WWSU-script-item ${currCount === 0 ? 'WWSU-active' : ''}">${scriptName}</a>`); //add the script's tab
        $("#WWSU-updateCount").html(parseInt($("#WWSU-updateCount").html()) + 1); //increment the total script updates value
        let install = "", forum = "";
        if (greasyforkLink != "")
          install = `<a href="${greasyforkLink}" target="_blank">Greasyfork</a>`;
        if (forumLink != "")
          forum = `<a href="${forumLink}" target="_blank">Forum</a>`;
        let footer = "";
        if (forumLink != "" || greasyforkLink != "") {
          footer = `<span class="WWSUFooter" style="margin-bottom:2px; display:block;">${install}${(greasyforkLink != "" && forumLink != "") ? " | " : ""}${forum}</span>`;
        }
        $('#WWSU-script-update-info').append(`<div id="${divID}"><span><h3>${version}</h3><br>${updateHTML}</span>${footer}</div>`);
        $('#WWSU-Container').show();
        if (currCount === 0)
          $('#WWSU-script-list').find("a")[0].click();
        settings.ScriptUpdateHistory[scriptName] = version;
        saveSettings();
      }
    };
  }

  // ===== Alerts Module =====

  function Alerts() {
    this.success = function (scriptName, message) {
      wazedevtoastr.success(message, scriptName);
    }

    this.info = function (scriptName, message, disableTimeout, disableClickToClose, timeOut) {
      let options = {};
      if (disableTimeout)
        options.timeOut = 0;
      else if (timeOut)
        options.timeOut = timeOut;

      if (disableClickToClose)
        options.tapToDismiss = false;

      wazedevtoastr.info(message, scriptName, options);
    }

    this.warning = function (scriptName, message) {
      wazedevtoastr.warning(message, scriptName);
    }

    this.error = function (scriptName, message) {
      wazedevtoastr.error(message, scriptName);
    }

    this.debug = function (scriptName, message) {
      wazedevtoastr.debug(message, scriptName);
    }

    this.prompt = function (scriptName, message, defaultText = '', okFunction, cancelFunction) {
      wazedevtoastr.prompt(message, scriptName, { promptOK: okFunction, promptCancel: cancelFunction, PromptDefaultInput: defaultText });
    }

    this.confirm = function (scriptName, message, okFunction, cancelFunction, okBtnText = "Ok", cancelBtnText = "Cancel") {
      wazedevtoastr.confirm(message, scriptName, { confirmOK: okFunction, confirmCancel: cancelFunction, ConfirmOkButtonText: okBtnText, ConfirmCancelButtonText: cancelBtnText });
    }

    // ScriptUpdateMonitor
    this.ScriptUpdateMonitor = class {
      #lastVersionChecked = '0';
      #scriptName;
      #currentVersion;
      #downloadUrl;
      #metaUrl;
      #metaRegExp;
      #GM_xmlhttpRequest;
      #intervalChecker = null;

      /**
       * Creates an instance of ScriptUpdateMonitor.
       * @param {string} scriptName The name of your script. Used as the alert title and in console error messages.
       * @param {string|number} currentVersion The current installed version of the script.
       * @param {string} downloadUrl The download URL of the script. If using Greasy Fork, the URL should end with ".user.js".
       * @param {object} GM_xmlhttpRequest A reference to the GM_xmlhttpRequest function used by your script.
       * This is used to obtain the latest script version number from the server.
       * @param {string} [metaUrl] The URL to a page containing the latest script version number.
       * Optional for Greasy Fork scripts (uses download URL path, replacing ".user.js" with ".meta.js").
       * @param {RegExp} [metaRegExp] A regular expression with a single capture group to extract the
       * version number from the metaUrl page. e.g. /@version\s+(.+)/i. Required if metaUrl is specified.
       * Ignored if metaUrl is a falsy value.
       * @memberof ScriptUpdateMonitor
       */
      constructor(scriptName, currentVersion, downloadUrl, GM_xmlhttpRequest, metaUrl = null, metaRegExp = null) {
          this.#scriptName = scriptName;
          this.#currentVersion = currentVersion;
          this.#downloadUrl = downloadUrl;
          this.#GM_xmlhttpRequest = GM_xmlhttpRequest;
          this.#metaUrl = metaUrl;
          this.#metaRegExp = metaRegExp || /@version\s+(.+)/i;
          this.#validateParameters();
      }

      /**
       * Starts checking for script updates at a specified interval.
       *
       * @memberof ScriptUpdateMonitor
       * @param {number} [intervalHours = 2] The interval, in hours, to check for script updates. Default is 2. Minimum is 1.
       * @param {boolean} [checkImmediately = true] If true, checks for a script update immediately when called. Default is true.
       */
      start(intervalHours = 2, checkImmediately = true) {
          if (intervalHours < 1) {
              throw new Error('Parameter intervalHours must be at least 1');
          }
          if (!this.#intervalChecker) {
              if (checkImmediately) this.#postAlertIfNewReleaseAvailable();
              // Use the arrow function here to bind the "this" context to the ScriptUpdateMonitor object.
              this.#intervalChecker = setInterval(() => this.#postAlertIfNewReleaseAvailable(), intervalHours * 60 * 60 * 1000);
          }
      }

      /**
       * Stops checking for script updates.
       *
       * @memberof ScriptUpdateMonitor
       */
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
          const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))
          let latestVersion;
          try {
              let tries = 1;
              const maxTries = 3;
              while (tries <= maxTries) {
                  latestVersion = await this.#fetchLatestReleaseVersion();
                  if (latestVersion === 503) {
                      // Greasy Fork returns a 503 error when too many requests are sent quickly.
                      // Pause and try again.
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
          const message = `<a href="${this.#downloadUrl}" target = "_blank">Version ${
              newVersion}</a> is available.<br>Update now to get the latest features and fixes.`;
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
                  }
              });
          });
      }
  }
}

  // Auto-initialize WazeWrap
  console.log('WazeWrap library loaded, initializing...');

})();
