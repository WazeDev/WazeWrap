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
})(
  'function' == typeof define && define.amd
    ? define
    : function (e, t) {
        'undefined' != typeof module && module.exports ? (module.exports = t(require('jquery'))) : (window.wazedevtoastr = t(window.jQuery));
      },
);
//# sourceMappingURL=toastr.js.map
