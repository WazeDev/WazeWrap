/**
 * WazeWrap Light - Ultra-Lightweight WazeWrap Library
 * Alerts and script update monitoring without Waze W object or OpenLayers
 *
 * Version: 2025.04.06.00
 * Features: Alerts, Script Update Monitoring, Update Dashboard
 *
 * Load this for:
 * - Alert system with toastr integration
 * - Script update monitoring
 * - Update notification dashboard
 *
 * Can coexist with full WazeWrap through shared dashboard.
 */

(function() {
  'use strict';

  // Settings object - initialized in loadSettings
  let wwSettings;

  // SDK object - obtained during init()
  let sdk = null;

  // WazeWrap is set up by loader before library loads
  const WazeWrap = window.WazeWrap;

  // ===== Bootstrap - Wait for Dependencies =====

  function bootstrap(tries = 1) {
    if (typeof $ !== 'undefined') {
      init();
    } else if (tries < 1000) {
      setTimeout(function () { bootstrap(tries++); }, 100);
    } else {
      console.log('WazeWrap Light failed to load - jQuery not available');
    }
  }
  
  bootstrap();

  // ===== Initialization Entry Point =====
  async function init() {
    console.log('Initializing WazeWrap Light...');

    // Get SDK
    if (!sdk) {
      try {
        const pageWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
        await pageWindow.SDK_INITIALIZED;
        sdk = pageWindow.getWmeSdk({ scriptName: 'WazeWrap Light', scriptId: 'WWL' });
        console.log('WazeWrap Light obtained SDK');
      } catch (e) {
        console.warn('Could not obtain SDK:', e);
      }
    }

    loadSettings();

    // Initialize script update interface (dashboard, alerts history)
    try {
      initializeScriptUpdateInterface();
    } catch (e) {
      console.warn('Error initializing script update interface:', e);
    }

    // Initialize toastr (same as full version)
    try {
      await initializeToastr();
    } catch (e) {
      console.warn('Error loading toastr:', e);
    }

    // Create settings tab
    try {
      await initializeWWInterface();
    } catch (e) {
      console.warn('Could not initialize UI tab:', e);
    }

    // Instantiate modules

    WazeWrap.Alerts = new Alerts();
    WazeWrap.Interface = new Interface();

    // Mark light version ready
    WazeWrap.LightReady = true;

    // Note: Do NOT set WazeWrap.Version here - let full version set it
    // This allows full version to load after light without version conflict
    // Full version checks: WazeWrap.Version >= MIN_VERSION (2019.05.01.01)
    // If light set WazeWrap.Version = 2025.x.x, full would skip loading
    // By NOT setting it here, full version can load normally and upgrade light

    console.log('WazeWrap Light initialized successfully');
  }

  // ===== Settings Tab Management (matches full version's initializeWWInterface) =====

  async function initializeWWInterface() {
    // Create/register tab via SDK with script ID "WWL" (Light version)
    // Creates a separate tab from full version's "WW" so they can coexist
    if (!sdk?.Sidebar?.registerScriptTab) {
      console.warn('SDK Sidebar API not available, cannot create settings tab');
      return;
    }

    try {
      const { tabLabel, tabPane } = await sdk.Sidebar.registerScriptTab();

      // Populate tab with settings UI (using _light element IDs, jQuery for consistency)
      const $label = $('<span>').text('WazeWrap Light');
      $(tabLabel).append($label);

      const $section = $("<div>", { style: "padding:8px 16px", id: "wazewrap-settings-light" });
      $section.html([
        '<h4 style="margin-bottom:0px;"><b>WazeWrap</b></h4>',
        '<h6 style="margin-top:0px;">Light Version</h6>',
        `<div id="divShowAlertHistory_light" class="controls-container"><input type="checkbox" id="_cbShowAlertHistory_light" class="wwSettingsCheckbox" ${wwSettings.showAlertHistoryIcon ? 'checked' : ''} /><label for="_cbShowAlertHistory_light">Show alerts history</label></div>`
      ].join(' '));

      $(tabPane).append($section);

      console.log('WazeWrap Light tab created successfully');

      // Bind event handlers (matches full version pattern)
      postInterfaceSetup();

    } catch (error) {
      console.warn('Failed to register WazeWrap Light via the SDK:', error);
    }
  }

  // ===== Post-Interface Setup (matches full version's postInterfaceSetup) =====

  function postInterfaceSetup() {
    try {
      setChecked('_cbShowAlertHistory_light', wwSettings.showAlertHistoryIcon);

      if (!wwSettings.showAlertHistoryIcon)
        $('.WWAlertsHistory').css('display', 'none');

      $('#_cbShowAlertHistory_light').change(function() {
        if (this.checked)
          $('.WWAlertsHistory').css('display', 'block');
        else
          $('.WWAlertsHistory').css('display', 'none');
        wwSettings.showAlertHistoryIcon = this.checked;
        saveSettings();
      });
    } catch (e) {
      console.warn('Could not set up event handlers:', e);
    }
  }

  // ===== Helper Function (matches full version) =====

  function setChecked(checkboxId, checked) {
    $('#' + checkboxId).prop('checked', checked);
  }

  // ===== Settings Management (matches full version) =====

  function loadSettings() {
    wwSettings = $.parseJSON(localStorage.getItem("_wazewrap_settings"));
    let _defaultsettings = {
        showAlertHistoryIcon: true
    };
    wwSettings = $.extend({}, _defaultsettings, wwSettings);
}

  function saveSettings() {
    if (localStorage) {
        let settings = {
            showAlertHistoryIcon: wwSettings.showAlertHistoryIcon
        };
        localStorage.setItem("_wazewrap_settings", JSON.stringify(settings));
    }
  }

  // ===== Toastr Management (identical to full version) =====

  async function initializeToastr() {
    let toastrSettings = {};
    try {
      function loadSettings() {
                var loadedSettings = $.parseJSON(localStorage.getItem("WWToastr"));
                var defaultSettings = {
                    historyLeftLoc: 35,
                    historyTopLoc: 40
                };
                toastrSettings = $.extend({}, defaultSettings, loadedSettings)
            }

            function saveSettings() {
                if (localStorage) {
                    var localsettings = {
                        historyLeftLoc: toastrSettings.historyLeftLoc,
                        historyTopLoc: toastrSettings.historyTopLoc
                    };

                    localStorage.setItem("WWToastr", JSON.stringify(localsettings));
                }
            }
            loadSettings();
      $('head').append(
        $('<link/>', {
          rel: 'stylesheet',
          type: 'text/css',
          href: 'https://'+WazeWrap.Repo+'.github.io/WazeWrap/toastr.css'
        }),
        $('<style type="text/css">.toast-container-wazedev > div {opacity: 0.95;} .toast-top-center-wide {top: 32px;} .WWAlertsHistory {display:' + (wwSettings.showAlertHistoryIcon ? 'block' : 'none') + '; width:32px; height:32px; background-color: #F89406; position: absolute; top:35px; left:40px; border-radius: 10px; border: 2px solid; box-size: border-box; z-index: 1050;} .WWAlertsHistory:hover #WWAlertsHistory-list{display:block;} .WWAlertsHistory > .fa-exclamation-triangle {position: absolute; left:50%; margin-left:-9px; margin-top:8px;} #WWAlertsHistory-list{display:none; position:absolute; top:28px; border:2px solid black; border-radius:10px; background-color:white; padding:4px; overflow-y:auto; max-height: 300px;} #WWAlertsHistory-list #toast-container-history > div {max-width:500px; min-width:500px; border-radius:10px;} #WWAlertsHistory-list > #toast-container-history{ position:static; }</style>')
      );

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

      var $sectionToastr = $("<div>", { style: "padding:8px 16px", id: "wmeWWScriptUpdates" });
      $sectionToastr.html([
        '<div class="WWAlertsHistory" title="Script Alert History"><i class="fa fa-exclamation-triangle fa-lg"></i><div id="WWAlertsHistory-list"><div id="toast-container-history" class="toast-container-wazedev"></div></div></div>'
      ].join(' '));
      $("#WazeMap").append($sectionToastr.html());

      $('.WWAlertsHistory').css('left', `${toastrSettings.historyLeftLoc}px`);
      $('.WWAlertsHistory').css('top', `${toastrSettings.historyTopLoc}px`);

      try {
        await $.getScript("https://greasyfork.org/scripts/454988-jqueryui-custom-build/code/jQueryUI%20custom%20build.js");
      }
      catch (err) {
        console.log("Could not load jQuery UI " + err);
      }

      if ($.ui) {
        $('.WWAlertsHistory').draggable({
          stop: function () {
            let windowWidth = $('#map').width();
            let panelWidth = $('#WWAlertsHistory-list').width();
            let historyLoc = $('.WWAlertsHistory').position().left;
            if ((panelWidth + historyLoc) > windowWidth) {
              $('#WWAlertsHistory-list').css('left', Math.abs(windowWidth - (historyLoc + $('.WWAlertsHistory').width()) - panelWidth) * -1);
            }
            else
              $('#WWAlertsHistory-list').css('left', 'auto');

            toastrSettings.historyLeftLoc = $('.WWAlertsHistory').position().left;
            toastrSettings.historyTopLoc = $('.WWAlertsHistory').position().top;
            saveSettings();
          }
        });
      }
    }
    catch (err) {
      console.log(err);
    }
  }

  // ===== Script Update Interface (identical to full version, no W/OL deps) =====

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
      '#WWSU-script-update-info div:target { display: block; }',
      `.WWAlertsHistory {display:${wwSettings.showAlertHistoryIcon ? 'block' : 'none'}; width:32px; height:32px; background-color: #F89406; position: absolute; top:35px; left:40px; border-radius: 10px; border: 2px solid; box-size: border-box; z-index: 1050;}`,
      '.WWAlertsHistory:hover #WWAlertsHistory-list{display:block;}',
      '.WWAlertsHistory > .fa-exclamation-triangle {position: absolute; left:50%; margin-left:-9px; margin-top:8px;}',
      '#WWAlertsHistory-list{display:none; position:absolute; top:28px; border:2px solid black; border-radius:10px; background-color:white; padding:4px; overflow-y:auto; max-height: 300px;}',
      '#WWAlertsHistory-list #toast-container-history > div {max-width:500px; min-width:500px; border-radius:10px;}',
      '#WWAlertsHistory-list > #toast-container-history{ position:static; }'
    ].join(' ');
    $('<style type="text/css">' + css + '</style>').appendTo('head');
  }

  // RestoreMissingWRule()
  // RestoreMissingSegmentFunctions()
  // RestoreMissingNodeFunctions()
  // RestoreMissingOLKMLSupport()
  // Geometry()
  // Model()
  // User()

  // ===== Interface Module (identical to full version - ShowScriptUpdate only) =====

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

  // ===== Alerts Module (identical to full version) =====

  function Alerts() {
    this.success = function (scriptName, message) {
      $(wazedevtoastr.success(message, scriptName)).clone().prependTo('#WWAlertsHistory-list > .toast-container-wazedev').find('.toast-close-button').remove();
    }

    this.info = function (scriptName, message, disableTimeout, disableClickToClose, timeOut) {
      let options = {};
      if (disableTimeout)
        options.timeOut = 0;
      else if (timeOut)
        options.timeOut = timeOut;

      if (disableClickToClose)
        options.tapToDismiss = false;

      $(wazedevtoastr.info(message, scriptName, options)).clone().prependTo('#WWAlertsHistory-list > .toast-container-wazedev').find('.toast-close-button').remove();
    }

    this.warning = function (scriptName, message) {
      $(wazedevtoastr.warning(message, scriptName)).clone().prependTo('#WWAlertsHistory-list > .toast-container-wazedev').find('.toast-close-button').remove();
    }

    this.error = function (scriptName, message) {
      $(wazedevtoastr.error(message, scriptName)).clone().prependTo('#WWAlertsHistory-list > .toast-container-wazedev').find('.toast-close-button').remove();
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

    // ScriptUpdateMonitor - identical to full version
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
              this.#clearPreviousAlerts();
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

      #clearPreviousAlerts() {
          $('.toast-container-wazedev .toast-info:visible').toArray().forEach(elem => {
              const $alert = $(elem);
              const title = $alert.find('.toast-title').text();
              if (title === this.#scriptName) {
                  const message = $alert.find('.toast-message').text();
                  if (/version .* is available/i.test(message)) {
                      // Force a click to make the alert go away.
                      $alert.click();
                  }
              }
          });
      }
  }
}

  // Auto-initialize WazeWrap Light
  console.log('WazeWrap Light library loaded, initializing...');

})();
