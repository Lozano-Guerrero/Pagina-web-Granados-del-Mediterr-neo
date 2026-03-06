!(function (e, t) {
  "object" == typeof exports && "object" == typeof module
    ? (module.exports = t())
    : "function" == typeof define && define.amd
    ? define([], t)
    : "object" == typeof exports
    ? (exports.ExternalTracking = t())
    : (e.ExternalTracking = t());
})("undefined" != typeof self ? self : this, () =>
  (() => {
    "use strict";
    var e = {
        11: (e, t, r) => {
          Object.defineProperty(t, "__esModule", { value: !0 }),
            (t.unsafeStringify = void 0);
          const n = r(746),
            o = [];
          for (let e = 0; e < 256; ++e) o.push((e + 256).toString(16).slice(1));
          function i(e, t = 0) {
            return (
              o[e[t + 0]] +
              o[e[t + 1]] +
              o[e[t + 2]] +
              o[e[t + 3]] +
              "-" +
              o[e[t + 4]] +
              o[e[t + 5]] +
              "-" +
              o[e[t + 6]] +
              o[e[t + 7]] +
              "-" +
              o[e[t + 8]] +
              o[e[t + 9]] +
              "-" +
              o[e[t + 10]] +
              o[e[t + 11]] +
              o[e[t + 12]] +
              o[e[t + 13]] +
              o[e[t + 14]] +
              o[e[t + 15]]
            ).toLowerCase();
          }
          (t.unsafeStringify = i),
            (t.default = function (e, t = 0) {
              const r = i(e, t);
              if (!(0, n.default)(r))
                throw TypeError("Stringified UUID is invalid");
              return r;
            });
        },
        110: (e, t, r) => {
          Object.defineProperty(t, "__esModule", { value: !0 }),
            (t.ExternalTracker = void 0);
          const n = r(436),
            o = r(716),
            i = r(266),
            a = r(910);
          t.ExternalTracker = class {
            constructor(e) {
              if (
                ((this.state = { initialized: !1, trackingId: e.trackingId }),
                (this.apiClient = new n.ApiClient(e.trackingId, e.apiEndpoint)),
                e.debug)
              ) {
                const e = window;
                (e[a.GLOBAL_TRACKING_KEY] = e[a.GLOBAL_TRACKING_KEY] || {}),
                  (e[a.GLOBAL_TRACKING_KEY].debug = !0);
              }
              i.logger.log("ExternalTracker created with config:", e),
                this.init();
            }
            async init() {
              if (this.state.initialized)
                i.logger.warn("Tracker already initialized");
              else
                try {
                  const e = await this.apiClient.fetchLocationId();
                  (this.state.locationId = e),
                    (this.state.sessionId = (0, i.generateSessionId)()),
                    (0, i.storeSessionIdInCookie)(e, this.state.sessionId),
                    this.apiClient.setTrackingContext(this.state.sessionId, e),
                    (0, o.startPageTracking)(async (e) => {
                      (e.properties = {
                        ...e.properties,
                        sessionId: this.state.sessionId,
                      }),
                        await this.sendEvent(e);
                    }),
                    (0, o.startFormTracking)(async (e) => {
                      (e.properties = {
                        ...e.properties,
                        sessionId: this.state.sessionId,
                      }),
                        await this.apiClient.submitForm(e);
                    }),
                    (this.state.initialized = !0),
                    i.logger.log(
                      "Tracker initialized successfully with sessionId:",
                      this.state.sessionId
                    );
                } catch (e) {
                  throw (i.logger.error("Failed to initialize tracker:", e), e);
                }
            }
            async sendEvent(e) {
              this.state.userId &&
                (e.properties = {
                  ...e.properties,
                  userId: this.state.userId,
                  ...this.state.userProperties,
                }),
                (e.properties = {
                  ...e.properties,
                  sessionId: this.state.sessionId,
                  locationId: this.state.locationId,
                }),
                await this.apiClient.sendEvent(e);
            }
          };
        },
        129: (e, t, r) => {
          Object.defineProperty(t, "__esModule", { value: !0 }),
            (t.createTracker = void 0);
          const n = r(110),
            o = r(266),
            i = r(479);
          t.createTracker = (e) => {
            if (!(0, i.validateConfig)(e)) {
              const e = new Error("Invalid tracking configuration provided");
              throw (o.logger.critical("Failed to create tracker:", e), e);
            }
            try {
              const t = new n.ExternalTracker(e);
              return (
                o.logger.log(
                  "Tracker created successfully with ID:",
                  e.trackingId
                ),
                t
              );
            } catch (e) {
              throw (o.logger.critical("Error creating tracker:", e), e);
            }
          };
        },
        156: function (e, t, r) {
          var n =
              (this && this.__createBinding) ||
              (Object.create
                ? function (e, t, r, n) {
                    void 0 === n && (n = r);
                    var o = Object.getOwnPropertyDescriptor(t, r);
                    (o &&
                      !("get" in o
                        ? !t.__esModule
                        : o.writable || o.configurable)) ||
                      (o = {
                        enumerable: !0,
                        get: function () {
                          return t[r];
                        },
                      }),
                      Object.defineProperty(e, n, o);
                  }
                : function (e, t, r, n) {
                    void 0 === n && (n = r), (e[n] = t[r]);
                  }),
            o =
              (this && this.__exportStar) ||
              function (e, t) {
                for (var r in e)
                  "default" === r ||
                    Object.prototype.hasOwnProperty.call(t, r) ||
                    n(t, e, r);
              };
          Object.defineProperty(t, "__esModule", { value: !0 });
          const i = r(850),
            a = r(266);
          o(r(574), t),
            (() => {
              try {
                (0, i.initializeFromScript)()
                  ? a.logger.log("Tracking initialized successfully")
                  : (a.logger.critical(
                      "External Tracking failed to initialize"
                    ),
                    a.logger.critical(
                      "Make sure to include data-tracking-id in your script tag"
                    ));
              } catch (e) {
                a.logger.critical("Initialization failed:", e);
              }
            })();
        },
        182: (e, t, r) => {
          Object.defineProperty(t, "__esModule", { value: !0 }),
            (t.version =
              t.validate =
              t.v7 =
              t.v6ToV1 =
              t.v6 =
              t.v5 =
              t.v4 =
              t.v3 =
              t.v1ToV6 =
              t.v1 =
              t.stringify =
              t.parse =
              t.NIL =
              t.MAX =
                void 0);
          var n = r(196);
          Object.defineProperty(t, "MAX", {
            enumerable: !0,
            get: function () {
              return n.default;
            },
          });
          var o = r(465);
          Object.defineProperty(t, "NIL", {
            enumerable: !0,
            get: function () {
              return o.default;
            },
          });
          var i = r(797);
          Object.defineProperty(t, "parse", {
            enumerable: !0,
            get: function () {
              return i.default;
            },
          });
          var a = r(11);
          Object.defineProperty(t, "stringify", {
            enumerable: !0,
            get: function () {
              return a.default;
            },
          });
          var s = r(425);
          Object.defineProperty(t, "v1", {
            enumerable: !0,
            get: function () {
              return s.default;
            },
          });
          var c = r(568);
          Object.defineProperty(t, "v1ToV6", {
            enumerable: !0,
            get: function () {
              return c.default;
            },
          });
          var l = r(591);
          Object.defineProperty(t, "v3", {
            enumerable: !0,
            get: function () {
              return l.default;
            },
          });
          var u = r(286);
          Object.defineProperty(t, "v4", {
            enumerable: !0,
            get: function () {
              return u.default;
            },
          });
          var d = r(557);
          Object.defineProperty(t, "v5", {
            enumerable: !0,
            get: function () {
              return d.default;
            },
          });
          var f = r(356);
          Object.defineProperty(t, "v6", {
            enumerable: !0,
            get: function () {
              return f.default;
            },
          });
          var g = r(268);
          Object.defineProperty(t, "v6ToV1", {
            enumerable: !0,
            get: function () {
              return g.default;
            },
          });
          var p = r(299);
          Object.defineProperty(t, "v7", {
            enumerable: !0,
            get: function () {
              return p.default;
            },
          });
          var m = r(746);
          Object.defineProperty(t, "validate", {
            enumerable: !0,
            get: function () {
              return m.default;
            },
          });
          var v = r(770);
          Object.defineProperty(t, "version", {
            enumerable: !0,
            get: function () {
              return v.default;
            },
          });
        },
        196: (e, t) => {
          Object.defineProperty(t, "__esModule", { value: !0 }),
            (t.default = "ffffffff-ffff-ffff-ffff-ffffffffffff");
        },
        266: (e, t, r) => {
          Object.defineProperty(t, "__esModule", { value: !0 }),
            (t.getFormIdentifier =
              t.getFormattedTimezone =
              t.getLocalTimeZoneOffset =
              t.getLocalTimeZone =
              t.getPageMetadata =
              t.debounce =
              t.setInStorage =
              t.getFromStorage =
              t.getSessionIdFromCookie =
              t.storeSessionIdInCookie =
              t.getUserData =
              t.storeUserData =
              t.setCookie =
              t.getCookie =
              t.generateSessionId =
              t.isPasswordLikeField =
              t.containsPassword =
              t.parseFormData =
              t.logger =
                void 0);
          const n = r(182),
            o = r(628);
          var i = r(628);
          Object.defineProperty(t, "logger", {
            enumerable: !0,
            get: function () {
              return i.logger;
            },
          });
          var a = r(952);
          Object.defineProperty(t, "parseFormData", {
            enumerable: !0,
            get: function () {
              return a.parseFormData;
            },
          });
          var s = r(378);
          Object.defineProperty(t, "containsPassword", {
            enumerable: !0,
            get: function () {
              return s.containsPassword;
            },
          }),
            Object.defineProperty(t, "isPasswordLikeField", {
              enumerable: !0,
              get: function () {
                return s.isPasswordLikeField;
              },
            }),
            (t.generateSessionId = () => (0, n.v4)()),
            (t.getCookie = (e) => {
              var t;
              try {
                const r = `; ${document.cookie}`.split(`; ${e}=`);
                if (2 === r.length)
                  return (
                    (null === (t = r.pop()) || void 0 === t
                      ? void 0
                      : t.split(";").shift()) || null
                  );
              } catch (e) {
                o.logger.error("Error getting cookie:", e);
              }
              return null;
            }),
            (t.setCookie = (e, t, r) => {
              try {
                const n = new Date();
                n.setTime(n.getTime() + 24 * r * 60 * 60 * 1e3);
                const o = `expires=${n.toUTCString()}`;
                document.cookie = `${e}=${t};${o};path=/;SameSite=Lax`;
              } catch (e) {
                o.logger.error("Error setting cookie:", e);
              }
            }),
            (t.storeUserData = (e) => {
              try {
                "undefined" != typeof window &&
                  window.localStorage &&
                  window.localStorage.setItem("_ud", JSON.stringify(e));
              } catch (e) {
                o.logger.error("Error storing user data:", e);
              }
            }),
            (t.getUserData = () => {
              try {
                if ("undefined" != typeof window && window.localStorage) {
                  const e = window.localStorage.getItem("_ud");
                  if (!e) return null;
                  const t = JSON.parse(e);
                  if (t && "object" == typeof t && "customer_id" in t) {
                    const e = t.customer_id;
                    if (null != e) {
                      const r = String(e).trim();
                      r && (t.contactId = r);
                    }
                  }
                  return t;
                }
              } catch (e) {
                o.logger.error("Error getting user data:", e);
              }
              return null;
            }),
            (t.storeSessionIdInCookie = (e, r) => {
              const n = `lc_session_${e}`;
              if (((0, t.setCookie)(n, r, 1), (0, t.getCookie)(n) !== r))
                try {
                  "undefined" != typeof window &&
                    window.sessionStorage &&
                    (window.sessionStorage.setItem(n, r),
                    o.logger.api(
                      `SessionId stored in sessionStorage (cookie fallback): ${r}`
                    ));
                } catch (e) {
                  o.logger.error(
                    "Both cookie and sessionStorage failed for sessionId storage",
                    e
                  );
                }
              else o.logger.api(`SessionId stored in cookie: ${r}`);
            }),
            (t.getSessionIdFromCookie = (e) => {
              const r = `lc_session_${e}`,
                n = (0, t.getCookie)(r);
              if (n) return n;
              try {
                if ("undefined" != typeof window && window.sessionStorage) {
                  const e = window.sessionStorage.getItem(r);
                  if (e)
                    return (
                      o.logger.api(
                        `SessionId retrieved from sessionStorage (cookie fallback): ${e}`
                      ),
                      e
                    );
                }
              } catch (e) {
                o.logger.error(
                  "Both cookie and sessionStorage failed for sessionId retrieval",
                  e
                );
              }
              return null;
            }),
            (t.getFromStorage = (e) => {
              try {
                if ("undefined" != typeof window && window.localStorage)
                  return window.localStorage.getItem(e);
              } catch (e) {
                o.logger.error("Error getting from storage:", e);
              }
              return null;
            }),
            (t.setInStorage = (e, t) => {
              try {
                "undefined" != typeof window &&
                  window.localStorage &&
                  window.localStorage.setItem(e, t);
              } catch (e) {
                o.logger.error("Error setting in storage:", e);
              }
            }),
            (t.debounce = (e, t) => {
              let r;
              return function (...n) {
                clearTimeout(r),
                  (r = setTimeout(() => {
                    clearTimeout(r), e(...n);
                  }, t));
              };
            }),
            (t.getPageMetadata = () => ({
              title: document.title,
              url: window.location.href,
              path: window.location.pathname,
              referrer: document.referrer,
              userAgent: navigator.userAgent,
            })),
            (t.getLocalTimeZone = () =>
              Intl.DateTimeFormat().resolvedOptions().timeZone),
            (t.getLocalTimeZoneOffset = () => {
              const e = new Date()
                .toString()
                .match(/([A-Z]+[\+-][0-9]{2})([0-9]{2})/);
              return e ? `(${e[1]}:${e[2]})` : "";
            }),
            (t.getFormattedTimezone = () =>
              `${(0, t.getLocalTimeZone)()} ${(0,
              t.getLocalTimeZoneOffset)()}`),
            (t.getFormIdentifier = (e) => {
              try {
                let t = null;
                if (
                  ((t =
                    "undefined" != typeof HTMLFormElement &&
                    e instanceof HTMLFormElement
                      ? e
                      : e && "querySelector" in e
                      ? e.querySelector("form")
                      : document.querySelector("form")),
                  !t)
                )
                  return;
                const r = t;
                return (
                  r.name ||
                  r.id ||
                  t.getAttribute("aria-label") ||
                  t.getAttribute("data-name") ||
                  "Unidentified Form"
                );
              } catch (e) {
                return void o.logger.error("Error getting form identifier:", e);
              }
            });
        },
        268: (e, t, r) => {
          Object.defineProperty(t, "__esModule", { value: !0 });
          const n = r(797),
            o = r(11);
          t.default = function (e) {
            const t =
              ((r = "string" == typeof e ? (0, n.default)(e) : e),
              Uint8Array.of(
                ((15 & r[3]) << 4) | ((r[4] >> 4) & 15),
                ((15 & r[4]) << 4) | ((240 & r[5]) >> 4),
                ((15 & r[5]) << 4) | (15 & r[6]),
                r[7],
                ((15 & r[1]) << 4) | ((240 & r[2]) >> 4),
                ((15 & r[2]) << 4) | ((240 & r[3]) >> 4),
                16 | ((240 & r[0]) >> 4),
                ((15 & r[0]) << 4) | ((240 & r[1]) >> 4),
                r[8],
                r[9],
                r[10],
                r[11],
                r[12],
                r[13],
                r[14],
                r[15]
              ));
            var r;
            return "string" == typeof e ? (0, o.unsafeStringify)(t) : t;
          };
        },
        286: (e, t, r) => {
          Object.defineProperty(t, "__esModule", { value: !0 });
          const n = r(779),
            o = r(291),
            i = r(11);
          t.default = function (e, t, r) {
            if (n.default.randomUUID && !t && !e) return n.default.randomUUID();
            const a = (e = e || {}).random ?? e.rng?.() ?? (0, o.default)();
            if (a.length < 16)
              throw new Error("Random bytes length must be >= 16");
            if (((a[6] = (15 & a[6]) | 64), (a[8] = (63 & a[8]) | 128), t)) {
              if ((r = r || 0) < 0 || r + 16 > t.length)
                throw new RangeError(
                  `UUID byte range ${r}:${r + 15} is out of buffer bounds`
                );
              for (let e = 0; e < 16; ++e) t[r + e] = a[e];
              return t;
            }
            return (0, i.unsafeStringify)(a);
          };
        },
        291: (e, t) => {
          let r;
          Object.defineProperty(t, "__esModule", { value: !0 });
          const n = new Uint8Array(16);
          t.default = function () {
            if (!r) {
              if ("undefined" == typeof crypto || !crypto.getRandomValues)
                throw new Error(
                  "crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported"
                );
              r = crypto.getRandomValues.bind(crypto);
            }
            return r(n);
          };
        },
        299: (e, t, r) => {
          Object.defineProperty(t, "__esModule", { value: !0 }),
            (t.updateV7State = void 0);
          const n = r(291),
            o = r(11),
            i = {};
          function a(e, t, r) {
            return (
              (e.msecs ??= -1 / 0),
              (e.seq ??= 0),
              t > e.msecs
                ? ((e.seq = (r[6] << 23) | (r[7] << 16) | (r[8] << 8) | r[9]),
                  (e.msecs = t))
                : ((e.seq = (e.seq + 1) | 0), 0 === e.seq && e.msecs++),
              e
            );
          }
          function s(e, t, r, n, o = 0) {
            if (e.length < 16)
              throw new Error("Random bytes length must be >= 16");
            if (n) {
              if (o < 0 || o + 16 > n.length)
                throw new RangeError(
                  `UUID byte range ${o}:${o + 15} is out of buffer bounds`
                );
            } else (n = new Uint8Array(16)), (o = 0);
            return (
              (t ??= Date.now()),
              (r ??= ((127 * e[6]) << 24) | (e[7] << 16) | (e[8] << 8) | e[9]),
              (n[o++] = (t / 1099511627776) & 255),
              (n[o++] = (t / 4294967296) & 255),
              (n[o++] = (t / 16777216) & 255),
              (n[o++] = (t / 65536) & 255),
              (n[o++] = (t / 256) & 255),
              (n[o++] = 255 & t),
              (n[o++] = 112 | ((r >>> 28) & 15)),
              (n[o++] = (r >>> 20) & 255),
              (n[o++] = 128 | ((r >>> 14) & 63)),
              (n[o++] = (r >>> 6) & 255),
              (n[o++] = ((r << 2) & 255) | (3 & e[10])),
              (n[o++] = e[11]),
              (n[o++] = e[12]),
              (n[o++] = e[13]),
              (n[o++] = e[14]),
              (n[o++] = e[15]),
              n
            );
          }
          (t.updateV7State = a),
            (t.default = function (e, t, r) {
              let c;
              if (e)
                c = s(
                  e.random ?? e.rng?.() ?? (0, n.default)(),
                  e.msecs,
                  e.seq,
                  t,
                  r
                );
              else {
                const e = Date.now(),
                  o = (0, n.default)();
                a(i, e, o), (c = s(o, i.msecs, i.seq, t, r));
              }
              return t ?? (0, o.unsafeStringify)(c);
            });
        },
        338: (e, t) => {
          function r(e) {
            return 14 + (((e + 64) >>> 9) << 4) + 1;
          }
          function n(e, t) {
            const r = (65535 & e) + (65535 & t);
            return (((e >> 16) + (t >> 16) + (r >> 16)) << 16) | (65535 & r);
          }
          function o(e, t, r, o, i, a) {
            return n(
              ((s = n(n(t, e), n(o, a))) << (c = i)) | (s >>> (32 - c)),
              r
            );
            var s, c;
          }
          function i(e, t, r, n, i, a, s) {
            return o((t & r) | (~t & n), e, t, i, a, s);
          }
          function a(e, t, r, n, i, a, s) {
            return o((t & n) | (r & ~n), e, t, i, a, s);
          }
          function s(e, t, r, n, i, a, s) {
            return o(t ^ r ^ n, e, t, i, a, s);
          }
          function c(e, t, r, n, i, a, s) {
            return o(r ^ (t | ~n), e, t, i, a, s);
          }
          Object.defineProperty(t, "__esModule", { value: !0 }),
            (t.default = function (e) {
              return (function (e) {
                const t = new Uint8Array(4 * e.length);
                for (let r = 0; r < 4 * e.length; r++)
                  t[r] = (e[r >> 2] >>> ((r % 4) * 8)) & 255;
                return t;
              })(
                (function (e, t) {
                  const o = new Uint32Array(r(t)).fill(0);
                  o.set(e),
                    (o[t >> 5] |= 128 << t % 32),
                    (o[o.length - 1] = t),
                    (e = o);
                  let l = 1732584193,
                    u = -271733879,
                    d = -1732584194,
                    f = 271733878;
                  for (let t = 0; t < e.length; t += 16) {
                    const r = l,
                      o = u,
                      g = d,
                      p = f;
                    (l = i(l, u, d, f, e[t], 7, -680876936)),
                      (f = i(f, l, u, d, e[t + 1], 12, -389564586)),
                      (d = i(d, f, l, u, e[t + 2], 17, 606105819)),
                      (u = i(u, d, f, l, e[t + 3], 22, -1044525330)),
                      (l = i(l, u, d, f, e[t + 4], 7, -176418897)),
                      (f = i(f, l, u, d, e[t + 5], 12, 1200080426)),
                      (d = i(d, f, l, u, e[t + 6], 17, -1473231341)),
                      (u = i(u, d, f, l, e[t + 7], 22, -45705983)),
                      (l = i(l, u, d, f, e[t + 8], 7, 1770035416)),
                      (f = i(f, l, u, d, e[t + 9], 12, -1958414417)),
                      (d = i(d, f, l, u, e[t + 10], 17, -42063)),
                      (u = i(u, d, f, l, e[t + 11], 22, -1990404162)),
                      (l = i(l, u, d, f, e[t + 12], 7, 1804603682)),
                      (f = i(f, l, u, d, e[t + 13], 12, -40341101)),
                      (d = i(d, f, l, u, e[t + 14], 17, -1502002290)),
                      (u = i(u, d, f, l, e[t + 15], 22, 1236535329)),
                      (l = a(l, u, d, f, e[t + 1], 5, -165796510)),
                      (f = a(f, l, u, d, e[t + 6], 9, -1069501632)),
                      (d = a(d, f, l, u, e[t + 11], 14, 643717713)),
                      (u = a(u, d, f, l, e[t], 20, -373897302)),
                      (l = a(l, u, d, f, e[t + 5], 5, -701558691)),
                      (f = a(f, l, u, d, e[t + 10], 9, 38016083)),
                      (d = a(d, f, l, u, e[t + 15], 14, -660478335)),
                      (u = a(u, d, f, l, e[t + 4], 20, -405537848)),
                      (l = a(l, u, d, f, e[t + 9], 5, 568446438)),
                      (f = a(f, l, u, d, e[t + 14], 9, -1019803690)),
                      (d = a(d, f, l, u, e[t + 3], 14, -187363961)),
                      (u = a(u, d, f, l, e[t + 8], 20, 1163531501)),
                      (l = a(l, u, d, f, e[t + 13], 5, -1444681467)),
                      (f = a(f, l, u, d, e[t + 2], 9, -51403784)),
                      (d = a(d, f, l, u, e[t + 7], 14, 1735328473)),
                      (u = a(u, d, f, l, e[t + 12], 20, -1926607734)),
                      (l = s(l, u, d, f, e[t + 5], 4, -378558)),
                      (f = s(f, l, u, d, e[t + 8], 11, -2022574463)),
                      (d = s(d, f, l, u, e[t + 11], 16, 1839030562)),
                      (u = s(u, d, f, l, e[t + 14], 23, -35309556)),
                      (l = s(l, u, d, f, e[t + 1], 4, -1530992060)),
                      (f = s(f, l, u, d, e[t + 4], 11, 1272893353)),
                      (d = s(d, f, l, u, e[t + 7], 16, -155497632)),
                      (u = s(u, d, f, l, e[t + 10], 23, -1094730640)),
                      (l = s(l, u, d, f, e[t + 13], 4, 681279174)),
                      (f = s(f, l, u, d, e[t], 11, -358537222)),
                      (d = s(d, f, l, u, e[t + 3], 16, -722521979)),
                      (u = s(u, d, f, l, e[t + 6], 23, 76029189)),
                      (l = s(l, u, d, f, e[t + 9], 4, -640364487)),
                      (f = s(f, l, u, d, e[t + 12], 11, -421815835)),
                      (d = s(d, f, l, u, e[t + 15], 16, 530742520)),
                      (u = s(u, d, f, l, e[t + 2], 23, -995338651)),
                      (l = c(l, u, d, f, e[t], 6, -198630844)),
                      (f = c(f, l, u, d, e[t + 7], 10, 1126891415)),
                      (d = c(d, f, l, u, e[t + 14], 15, -1416354905)),
                      (u = c(u, d, f, l, e[t + 5], 21, -57434055)),
                      (l = c(l, u, d, f, e[t + 12], 6, 1700485571)),
                      (f = c(f, l, u, d, e[t + 3], 10, -1894986606)),
                      (d = c(d, f, l, u, e[t + 10], 15, -1051523)),
                      (u = c(u, d, f, l, e[t + 1], 21, -2054922799)),
                      (l = c(l, u, d, f, e[t + 8], 6, 1873313359)),
                      (f = c(f, l, u, d, e[t + 15], 10, -30611744)),
                      (d = c(d, f, l, u, e[t + 6], 15, -1560198380)),
                      (u = c(u, d, f, l, e[t + 13], 21, 1309151649)),
                      (l = c(l, u, d, f, e[t + 4], 6, -145523070)),
                      (f = c(f, l, u, d, e[t + 11], 10, -1120210379)),
                      (d = c(d, f, l, u, e[t + 2], 15, 718787259)),
                      (u = c(u, d, f, l, e[t + 9], 21, -343485551)),
                      (l = n(l, r)),
                      (u = n(u, o)),
                      (d = n(d, g)),
                      (f = n(f, p));
                  }
                  return Uint32Array.of(l, u, d, f);
                })(
                  (function (e) {
                    if (0 === e.length) return new Uint32Array();
                    const t = new Uint32Array(r(8 * e.length)).fill(0);
                    for (let r = 0; r < e.length; r++)
                      t[r >> 2] |= (255 & e[r]) << ((r % 4) * 8);
                    return t;
                  })(e),
                  8 * e.length
                )
              );
            });
        },
        356: (e, t, r) => {
          Object.defineProperty(t, "__esModule", { value: !0 });
          const n = r(11),
            o = r(425),
            i = r(568);
          t.default = function (e, t, r) {
            (e ??= {}), (r ??= 0);
            let a = (0, o.default)({ ...e, _v6: !0 }, new Uint8Array(16));
            if (((a = (0, i.default)(a)), t)) {
              for (let e = 0; e < 16; e++) t[r + e] = a[e];
              return t;
            }
            return (0, n.unsafeStringify)(a);
          };
        },
        378: (e, t) => {
          Object.defineProperty(t, "__esModule", { value: !0 }),
            (t.isPasswordLikeField = t.containsPassword = void 0),
            (t.containsPassword = (e) => {
              var t, r, n;
              try {
                return !!(null ===
                  (n =
                    null === (t = null == e ? void 0 : e.toLowerCase) ||
                    void 0 === t
                      ? void 0
                      : (r = t.call(e)).includes) || void 0 === n
                  ? void 0
                  : n.call(r, "password"));
              } catch (e) {
                return !1;
              }
            }),
            (t.isPasswordLikeField = (e, r) =>
              (0, t.containsPassword)(null == e ? void 0 : e.type) ||
              (0, t.containsPassword)(null == e ? void 0 : e.name) ||
              (0, t.containsPassword)(null == e ? void 0 : e.id) ||
              (0, t.containsPassword)(null == e ? void 0 : e.placeholder) ||
              (0, t.containsPassword)(r));
        },
        425: (e, t, r) => {
          Object.defineProperty(t, "__esModule", { value: !0 }),
            (t.updateV1State = void 0);
          const n = r(291),
            o = r(11),
            i = {};
          function a(e, t, r) {
            return (
              (e.msecs ??= -1 / 0),
              (e.nsecs ??= 0),
              t === e.msecs
                ? (e.nsecs++,
                  e.nsecs >= 1e4 && ((e.node = void 0), (e.nsecs = 0)))
                : t > e.msecs
                ? (e.nsecs = 0)
                : t < e.msecs && (e.node = void 0),
              e.node ||
                ((e.node = r.slice(10, 16)),
                (e.node[0] |= 1),
                (e.clockseq = 16383 & ((r[8] << 8) | r[9]))),
              (e.msecs = t),
              e
            );
          }
          function s(e, t, r, n, o, i, a = 0) {
            if (e.length < 16)
              throw new Error("Random bytes length must be >= 16");
            if (i) {
              if (a < 0 || a + 16 > i.length)
                throw new RangeError(
                  `UUID byte range ${a}:${a + 15} is out of buffer bounds`
                );
            } else (i = new Uint8Array(16)), (a = 0);
            (t ??= Date.now()),
              (r ??= 0),
              (n ??= 16383 & ((e[8] << 8) | e[9])),
              (o ??= e.slice(10, 16));
            const s = (1e4 * (268435455 & (t += 122192928e5)) + r) % 4294967296;
            (i[a++] = (s >>> 24) & 255),
              (i[a++] = (s >>> 16) & 255),
              (i[a++] = (s >>> 8) & 255),
              (i[a++] = 255 & s);
            const c = ((t / 4294967296) * 1e4) & 268435455;
            (i[a++] = (c >>> 8) & 255),
              (i[a++] = 255 & c),
              (i[a++] = ((c >>> 24) & 15) | 16),
              (i[a++] = (c >>> 16) & 255),
              (i[a++] = (n >>> 8) | 128),
              (i[a++] = 255 & n);
            for (let e = 0; e < 6; ++e) i[a++] = o[e];
            return i;
          }
          (t.updateV1State = a),
            (t.default = function (e, t, r) {
              let c;
              const l = e?._v6 ?? !1;
              if (e) {
                const t = Object.keys(e);
                1 === t.length && "_v6" === t[0] && (e = void 0);
              }
              if (e)
                c = s(
                  e.random ?? e.rng?.() ?? (0, n.default)(),
                  e.msecs,
                  e.nsecs,
                  e.clockseq,
                  e.node,
                  t,
                  r
                );
              else {
                const e = Date.now(),
                  o = (0, n.default)();
                a(i, e, o),
                  (c = s(
                    o,
                    i.msecs,
                    i.nsecs,
                    l ? void 0 : i.clockseq,
                    l ? void 0 : i.node,
                    t,
                    r
                  ));
              }
              return t ?? (0, o.unsafeStringify)(c);
            });
        },
        436: (e, t, r) => {
          Object.defineProperty(t, "__esModule", { value: !0 }),
            (t.ApiClient = void 0);
          const n = r(574),
            o = r(266),
            i = r(963),
            a = r(910);
          t.ApiClient = class {
            constructor(e, t) {
              (this.trackingId = e),
                (this.apiEndpoint = t || this.determineApiEndpoint());
              const r = {
                maxEventsPerSecond: 5,
                maxRetries: 3,
                retryDelayMs: 1e3,
                maxQueueSize: 100,
              };
              (this.eventQueue = new i.EventQueue(r)),
                this.eventQueue.setSender(async (e) => {
                  await this.sendEventDirectly(e);
                }),
                o.logger.log(
                  "ApiClient initialized with rate limit:",
                  r.maxEventsPerSecond,
                  "events per second"
                );
            }
            determineApiEndpoint() {
              try {
                const e = document.querySelector(
                  `script[src*="${a.SCRIPT_BASENAME}"]`
                );
                if (null == e ? void 0 : e.src) {
                  const t = e.src;
                  return (
                    o.logger.api("Script source detected:", t),
                    t.includes("staging")
                      ? (o.logger.api(
                          "Staging environment detected, using staging API endpoint"
                        ),
                        a.API_ENDPOINTS.staging)
                      : t.includes("localhost")
                      ? (o.logger.api(
                          "Localhost environment detected, using localhost API endpoint"
                        ),
                        a.API_ENDPOINTS.local)
                      : (o.logger.api(
                          "Production environment detected, using production API endpoint"
                        ),
                        a.API_ENDPOINTS.production)
                  );
                }
                return (
                  o.logger.api(
                    "No script tag found, defaulting to production API endpoint"
                  ),
                  a.API_ENDPOINTS.production
                );
              } catch (e) {
                return (
                  o.logger.error("Error determining API endpoint:", e),
                  o.logger.api(
                    "Falling back to production API endpoint due to error"
                  ),
                  a.API_ENDPOINTS.production
                );
              }
            }
            setTrackingContext(e, t) {
              (this.sessionId = e), (this.locationId = t);
            }
            async fetchLocationId() {
              try {
                const e = await fetch(
                  `${this.apiEndpoint}/external-tracking/tracking/${this.trackingId}`
                );
                if (!e.ok)
                  throw new Error(
                    `Failed to fetch location ID: ${e.statusText}`
                  );
                const t = await e.json();
                return (
                  (this.locationId = t.locationId),
                  o.logger.api("Location ID fetched:", this.locationId),
                  this.locationId
                );
              } catch (e) {
                throw (o.logger.error("Error fetching location ID:", e), e);
              }
            }
            async sendEvent(e) {
              this.locationId || (await this.fetchLocationId());
              try {
                const t =
                    this.sessionId ||
                    (0, o.getSessionIdFromCookie)(this.locationId || ""),
                  r = (0, o.getUserData)();
                let i = { ...e };
                if (e.type === n.EventType.FORM_SUBMISSION && "formData" in e) {
                  const t = e,
                    r = {
                      ...t,
                      formData: {
                        ...t.formData,
                        Timezone: (0, o.getFormattedTimezone)(),
                      },
                    };
                  (i = r),
                    o.logger.api("Enhanced form data with timezone:", {
                      timezone: r.formData.Timezone,
                    });
                }
                const a = {
                  ...i,
                  trackingId: this.trackingId,
                  locationId: this.locationId,
                  sessionId: t,
                  contactId: null == r ? void 0 : r.contactId,
                  userId: null == r ? void 0 : r.userId,
                };
                o.logger.api("Queueing event payload:", {
                  type: i.type,
                  sessionId: t,
                  trackingId: this.trackingId,
                }),
                  await this.eventQueue.enqueue(a),
                  o.logger.api("Event queued successfully:", i.type);
              } catch (e) {
                o.logger.error("Error queueing event:", e);
              }
            }
            async sendEventDirectly(e) {
              const t = await fetch(
                `${this.apiEndpoint}/external-tracking/events`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(e),
                }
              );
              if (!t.ok)
                throw new Error(`Failed to send event: ${t.statusText}`);
              o.logger.api("Event sent successfully:", e.type);
            }
            async submitForm(e) {
              this.locationId || (await this.fetchLocationId());
              try {
                o.logger.api("Form submission:", e.formData),
                  await this.sendEvent(e);
              } catch (e) {
                o.logger.error("Error submitting form:", e);
              }
            }
          };
        },
        465: (e, t) => {
          Object.defineProperty(t, "__esModule", { value: !0 }),
            (t.default = "00000000-0000-0000-0000-000000000000");
        },
        479: (e, t, r) => {
          Object.defineProperty(t, "__esModule", { value: !0 }),
            (t.validateConfig = t.getConfigFromScriptAttributes = void 0);
          const n = r(266),
            o = r(910);
          (t.getConfigFromScriptAttributes = () => {
            try {
              const e =
                document.currentScript ||
                document.querySelector(`script[src*="${o.SCRIPT_BASENAME}"]`);
              if (!e)
                return (
                  n.logger.warn("Could not find script tag for configuration"),
                  null
                );
              const t = e.getAttribute("data-debug");
              if ("true" === t) {
                const e = window;
                (e[o.GLOBAL_TRACKING_KEY] = e[o.GLOBAL_TRACKING_KEY] || {}),
                  (e[o.GLOBAL_TRACKING_KEY].debug = !0);
              }
              const r = e.getAttribute("data-tracking-id");
              if (!r)
                return (
                  n.logger.critical(
                    "Required data-tracking-id attribute not found"
                  ),
                  n.logger.critical(
                    'Please add data-tracking-id="your-tracking-id" to the script tag'
                  ),
                  null
                );
              const i = { trackingId: r };
              "true" === t && (i.debug = !0);
              const a = e.getAttribute("data-api-endpoint");
              return (
                a && (i.apiEndpoint = a),
                n.logger.log("Configuration loaded from script attributes:", i),
                i
              );
            } catch (e) {
              return (
                n.logger.critical("Error reading script attributes:", e), null
              );
            }
          }),
            (t.validateConfig = (e) =>
              e && "object" == typeof e
                ? e.trackingId && "string" == typeof e.trackingId
                  ? e.apiEndpoint && "string" != typeof e.apiEndpoint
                    ? (n.logger.critical(
                        "Invalid configuration: apiEndpoint must be a string"
                      ),
                      !1)
                    : !e.debug ||
                      "boolean" == typeof e.debug ||
                      (n.logger.critical(
                        "Invalid configuration: debug must be a boolean"
                      ),
                      !1)
                  : (n.logger.critical(
                      "Invalid configuration: trackingId must be a non-empty string"
                    ),
                    !1)
                : (n.logger.critical(
                    "Invalid configuration: must be an object"
                  ),
                  !1));
        },
        557: (e, t, r) => {
          Object.defineProperty(t, "__esModule", { value: !0 }),
            (t.URL = t.DNS = void 0);
          const n = r(829),
            o = r(988);
          var i = r(988);
          function a(e, t, r, i) {
            return (0, o.default)(80, n.default, e, t, r, i);
          }
          Object.defineProperty(t, "DNS", {
            enumerable: !0,
            get: function () {
              return i.DNS;
            },
          }),
            Object.defineProperty(t, "URL", {
              enumerable: !0,
              get: function () {
                return i.URL;
              },
            }),
            (a.DNS = o.DNS),
            (a.URL = o.URL),
            (t.default = a);
        },
        568: (e, t, r) => {
          Object.defineProperty(t, "__esModule", { value: !0 });
          const n = r(797),
            o = r(11);
          t.default = function (e) {
            const t =
              ((r = "string" == typeof e ? (0, n.default)(e) : e),
              Uint8Array.of(
                ((15 & r[6]) << 4) | ((r[7] >> 4) & 15),
                ((15 & r[7]) << 4) | ((240 & r[4]) >> 4),
                ((15 & r[4]) << 4) | ((240 & r[5]) >> 4),
                ((15 & r[5]) << 4) | ((240 & r[0]) >> 4),
                ((15 & r[0]) << 4) | ((240 & r[1]) >> 4),
                ((15 & r[1]) << 4) | ((240 & r[2]) >> 4),
                96 | (15 & r[2]),
                r[3],
                r[8],
                r[9],
                r[10],
                r[11],
                r[12],
                r[13],
                r[14],
                r[15]
              ));
            var r;
            return "string" == typeof e ? (0, o.unsafeStringify)(t) : t;
          };
        },
        574: (e, t) => {
          var r;
          Object.defineProperty(t, "__esModule", { value: !0 }),
            (t.EventType = void 0),
            (function (e) {
              (e.SCRIPT_PAGE_VIEW = "external_script_page_view"),
                (e.FORM_SUBMISSION = "external_form_submission");
            })(r || (t.EventType = r = {}));
        },
        591: (e, t, r) => {
          Object.defineProperty(t, "__esModule", { value: !0 }),
            (t.URL = t.DNS = void 0);
          const n = r(338),
            o = r(988);
          var i = r(988);
          function a(e, t, r, i) {
            return (0, o.default)(48, n.default, e, t, r, i);
          }
          Object.defineProperty(t, "DNS", {
            enumerable: !0,
            get: function () {
              return i.DNS;
            },
          }),
            Object.defineProperty(t, "URL", {
              enumerable: !0,
              get: function () {
                return i.URL;
              },
            }),
            (a.DNS = o.DNS),
            (a.URL = o.URL),
            (t.default = a);
        },
        628: (e, t, r) => {
          Object.defineProperty(t, "__esModule", { value: !0 }),
            (t.logger = void 0);
          const n = r(910);
          t.logger = {
            api: (e, ...t) => {
              o() && console.log(`${n.LOGGER_PREFIX} ${e}`, ...t);
            },
            error: (e, ...t) => {
              o() && console.error(`${n.LOGGER_PREFIX} ${e}`, ...t);
            },
            critical: (e, ...t) => {
              console.error(`${n.LOGGER_ERROR_PREFIX} ${e}`, ...t);
            },
            log: (e, ...t) => {
              o() && console.log(`${n.LOGGER_PREFIX} ${e}`, ...t);
            },
            warn: (e, ...t) => {
              o() && console.warn(`${n.LOGGER_PREFIX} ${e}`, ...t);
            },
          };
          const o = () => {
            var e;
            if ("undefined" == typeof window) return !1;
            const t = window;
            return Boolean(
              null === (e = null == t ? void 0 : t[n.GLOBAL_TRACKING_KEY]) ||
                void 0 === e
                ? void 0
                : e.debug
            );
          };
        },
        697: (e, t) => {
          Object.defineProperty(t, "__esModule", { value: !0 }),
            (t.default =
              /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/i);
        },
        716: (e, t, r) => {
          Object.defineProperty(t, "__esModule", { value: !0 }),
            (t.startFormTracking = t.startPageTracking = void 0);
          const n = r(574),
            o = r(266);
          (t.startPageTracking = (e) => {
            o.logger.log("Tracking initial page view");
            const t = (0, o.getPageMetadata)(),
              r = (0, o.getFormIdentifier)();
            e({
              type: n.EventType.SCRIPT_PAGE_VIEW,
              timestamp: Date.now(),
              ...t,
              ...(r ? { formId: r } : {}),
            });
          }),
            (t.startFormTracking = (e) => {
              o.logger.log("Starting form submission tracking");
              const t = document.querySelector("form");
              if (!t) return void o.logger.log("No forms found on page");
              t.addEventListener(
                "submit",
                (r) => {
                  i(t, e);
                },
                { capture: !0 }
              );
              const r = (0, o.getFormIdentifier)(t) || "Unidentified Form";
              o.logger.log("Tracking form:", r);
            });
          const i = (e, t) => {
            try {
              const { fieldData: r, fieldLabels: i } = (0, o.parseFormData)(e),
                a = (0, o.getPageMetadata)(),
                s = {
                  type: n.EventType.FORM_SUBMISSION,
                  timestamp: Date.now(),
                  formId: (0, o.getFormIdentifier)(e) || "Unidentified Form",
                  formData: r,
                  formLabels: i,
                  ...a,
                };
              t(s), o.logger.log("Form submission tracked:", s.formId);
            } catch (e) {
              o.logger.error("Error tracking form submission:", e);
            }
          };
        },
        746: (e, t, r) => {
          Object.defineProperty(t, "__esModule", { value: !0 });
          const n = r(697);
          t.default = function (e) {
            return "string" == typeof e && n.default.test(e);
          };
        },
        770: (e, t, r) => {
          Object.defineProperty(t, "__esModule", { value: !0 });
          const n = r(746);
          t.default = function (e) {
            if (!(0, n.default)(e)) throw TypeError("Invalid UUID");
            return parseInt(e.slice(14, 15), 16);
          };
        },
        779: (e, t) => {
          Object.defineProperty(t, "__esModule", { value: !0 });
          const r =
            "undefined" != typeof crypto &&
            crypto.randomUUID &&
            crypto.randomUUID.bind(crypto);
          t.default = { randomUUID: r };
        },
        797: (e, t, r) => {
          Object.defineProperty(t, "__esModule", { value: !0 });
          const n = r(746);
          t.default = function (e) {
            if (!(0, n.default)(e)) throw TypeError("Invalid UUID");
            let t;
            return Uint8Array.of(
              (t = parseInt(e.slice(0, 8), 16)) >>> 24,
              (t >>> 16) & 255,
              (t >>> 8) & 255,
              255 & t,
              (t = parseInt(e.slice(9, 13), 16)) >>> 8,
              255 & t,
              (t = parseInt(e.slice(14, 18), 16)) >>> 8,
              255 & t,
              (t = parseInt(e.slice(19, 23), 16)) >>> 8,
              255 & t,
              ((t = parseInt(e.slice(24, 36), 16)) / 1099511627776) & 255,
              (t / 4294967296) & 255,
              (t >>> 24) & 255,
              (t >>> 16) & 255,
              (t >>> 8) & 255,
              255 & t
            );
          };
        },
        829: (e, t) => {
          function r(e, t, r, n) {
            switch (e) {
              case 0:
                return (t & r) ^ (~t & n);
              case 1:
              case 3:
                return t ^ r ^ n;
              case 2:
                return (t & r) ^ (t & n) ^ (r & n);
            }
          }
          function n(e, t) {
            return (e << t) | (e >>> (32 - t));
          }
          Object.defineProperty(t, "__esModule", { value: !0 }),
            (t.default = function (e) {
              const t = [1518500249, 1859775393, 2400959708, 3395469782],
                o = [1732584193, 4023233417, 2562383102, 271733878, 3285377520],
                i = new Uint8Array(e.length + 1);
              i.set(e), (i[e.length] = 128);
              const a = (e = i).length / 4 + 2,
                s = Math.ceil(a / 16),
                c = new Array(s);
              for (let t = 0; t < s; ++t) {
                const r = new Uint32Array(16);
                for (let n = 0; n < 16; ++n)
                  r[n] =
                    (e[64 * t + 4 * n] << 24) |
                    (e[64 * t + 4 * n + 1] << 16) |
                    (e[64 * t + 4 * n + 2] << 8) |
                    e[64 * t + 4 * n + 3];
                c[t] = r;
              }
              (c[s - 1][14] = (8 * (e.length - 1)) / Math.pow(2, 32)),
                (c[s - 1][14] = Math.floor(c[s - 1][14])),
                (c[s - 1][15] = (8 * (e.length - 1)) & 4294967295);
              for (let e = 0; e < s; ++e) {
                const i = new Uint32Array(80);
                for (let t = 0; t < 16; ++t) i[t] = c[e][t];
                for (let e = 16; e < 80; ++e)
                  i[e] = n(i[e - 3] ^ i[e - 8] ^ i[e - 14] ^ i[e - 16], 1);
                let a = o[0],
                  s = o[1],
                  l = o[2],
                  u = o[3],
                  d = o[4];
                for (let e = 0; e < 80; ++e) {
                  const o = Math.floor(e / 20),
                    c = (n(a, 5) + r(o, s, l, u) + d + t[o] + i[e]) >>> 0;
                  (d = u), (u = l), (l = n(s, 30) >>> 0), (s = a), (a = c);
                }
                (o[0] = (o[0] + a) >>> 0),
                  (o[1] = (o[1] + s) >>> 0),
                  (o[2] = (o[2] + l) >>> 0),
                  (o[3] = (o[3] + u) >>> 0),
                  (o[4] = (o[4] + d) >>> 0);
              }
              return Uint8Array.of(
                o[0] >> 24,
                o[0] >> 16,
                o[0] >> 8,
                o[0],
                o[1] >> 24,
                o[1] >> 16,
                o[1] >> 8,
                o[1],
                o[2] >> 24,
                o[2] >> 16,
                o[2] >> 8,
                o[2],
                o[3] >> 24,
                o[3] >> 16,
                o[3] >> 8,
                o[3],
                o[4] >> 24,
                o[4] >> 16,
                o[4] >> 8,
                o[4]
              );
            });
        },
        850: (e, t, r) => {
          Object.defineProperty(t, "__esModule", { value: !0 }),
            (t.initializeFromScript = void 0);
          const n = r(266),
            o = r(479),
            i = r(129),
            a = r(910);
          t.initializeFromScript = () => {
            try {
              const e = (0, o.getConfigFromScriptAttributes)();
              if (!e)
                return (
                  n.logger.critical(
                    "Failed to initialize: invalid or missing script attributes"
                  ),
                  null
                );
              n.logger.log("Initializing from script attributes");
              try {
                const t = (0, i.createTracker)(e),
                  r = window;
                return (
                  (r[a.GLOBAL_TRACKING_KEY] = r[a.GLOBAL_TRACKING_KEY] || {}),
                  (r[a.GLOBAL_TRACKING_KEY].tracker = t),
                  (r[a.GLOBAL_TRACKING_KEY].config = e),
                  n.logger.log("Tracker initialized successfully"),
                  t
                );
              } catch (e) {
                return n.logger.critical("Failed to create tracker:", e), null;
              }
            } catch (e) {
              return n.logger.critical("Error during initialization:", e), null;
            }
          };
        },
        910: (e, t) => {
          Object.defineProperty(t, "__esModule", { value: !0 }),
            (t.SCRIPT_BASENAME =
              t.GLOBAL_TRACKING_KEY =
              t.LOGGER_ERROR_PREFIX =
              t.LOGGER_PREFIX =
              t.API_ENDPOINTS =
                void 0),
            (t.API_ENDPOINTS = {
              production: "https://backend.leadconnectorhq.com",
              staging: "https://staging.backend.leadconnectorhq.com",
              local: "http://localhost:6100",
            }),
            (t.LOGGER_PREFIX = "[LC Tracking]"),
            (t.LOGGER_ERROR_PREFIX = "[LC Tracking ERROR]"),
            (t.GLOBAL_TRACKING_KEY = "_lcTracking"),
            (t.SCRIPT_BASENAME = "external-tracking");
        },
        952: (e, t, r) => {
          Object.defineProperty(t, "__esModule", { value: !0 }),
            (t.parseFormData = void 0);
          const n = r(378);
          t.parseFormData = (e) => {
            const t = new FormData(e),
              r = {},
              i = {};
            t.forEach((e, t) => {
              r[t] = e;
            });
            const s = e.querySelectorAll("input, select, textarea");
            for (let t = 0; t < s.length; t++) {
              const c = s[t],
                l = c.name;
              if (!o(c, l, r)) continue;
              const u = a(e, c);
              (0, n.isPasswordLikeField)(c, u)
                ? l in r && delete r[l]
                : u && (i[l] = u);
            }
            return { fieldData: r, fieldLabels: i };
          };
          const o = (e, t, r) =>
              !!t && !e.disabled && "hidden" !== e.type && !!i(e) && t in r,
            i = (e) => {
              var t;
              try {
                const r = window.getComputedStyle(e);
                return !(
                  "none" === r.display ||
                  "hidden" === r.visibility ||
                  "0" === (null !== (t = r.opacity) && void 0 !== t ? t : "1")
                );
              } catch (e) {
                try {
                  console.error("LC Tracking form visibility check error:", e);
                } catch (e) {}
                return !0;
              }
            },
            a = (e, t) => {
              let r = s(e, t);
              return r || ((r = c(t)), r || ((r = l(t)), r || ""));
            },
            s = (e, t) => {
              var r;
              if (!t.id) return "";
              const n = e.querySelector(`label[for="${t.id}"]`);
              return (
                (n &&
                  (null === (r = n.textContent) || void 0 === r
                    ? void 0
                    : r.trim())) ||
                ""
              );
            },
            c = (e) => {
              var t;
              const r = e.closest("label");
              if (!r) return "";
              const n = r.cloneNode(!0),
                o = n.querySelectorAll("input, select, textarea");
              for (let e = 0; e < o.length; e++) o[e].remove();
              return (
                (null === (t = n.textContent) || void 0 === t
                  ? void 0
                  : t.trim()) || ""
              );
            },
            l = (e) => {
              var t;
              let r = e.previousElementSibling;
              for (; r; ) {
                if ("LABEL" === r.tagName)
                  return (
                    (null === (t = r.textContent) || void 0 === t
                      ? void 0
                      : t.trim()) || ""
                  );
                r = r.previousElementSibling;
              }
              return "";
            };
        },
        963: (e, t, r) => {
          Object.defineProperty(t, "__esModule", { value: !0 }),
            (t.EventQueue = void 0);
          const n = r(266);
          t.EventQueue = class {
            constructor(e) {
              (this.queue = []),
                (this.processing = !1),
                (this.eventTimes = []),
                (this.eventIdCounter = 0),
                (this.config = {
                  maxEventsPerSecond: e.maxEventsPerSecond || 5,
                  maxRetries: e.maxRetries || 3,
                  retryDelayMs: e.retryDelayMs || 1e3,
                  maxQueueSize: e.maxQueueSize || 100,
                }),
                n.logger.log(
                  "EventQueue initialized with config:",
                  this.config
                );
            }
            async enqueue(e, t = this.config.maxRetries) {
              return new Promise((r, o) => {
                this.queue.length >= this.config.maxQueueSize &&
                  (n.logger.warn("Queue is full, dropping oldest event"),
                  this.queue.shift());
                const i = {
                  id: "event_" + ++this.eventIdCounter,
                  payload: e,
                  timestamp: Date.now(),
                  retryCount: 0,
                  maxRetries: t,
                };
                (i.resolve = r),
                  (i.reject = o),
                  this.queue.push(i),
                  n.logger.log(
                    `Event ${i.id} added to queue. Queue length: ${this.queue.length}`
                  ),
                  this.processing || this.processQueue();
              });
            }
            async processQueue() {
              var e, t;
              if (!this.processing && 0 !== this.queue.length) {
                for (
                  this.processing = !0,
                    n.logger.log("Starting queue processing");
                  this.queue.length > 0;

                ) {
                  const r = this.queue[0];
                  if (this.canSendEvent())
                    try {
                      this.queue.shift(),
                        this.recordEventTime(),
                        await this.sendEvent(r),
                        n.logger.log(`Event ${r.id} processed successfully`),
                        (null == r ? void 0 : r.resolve) && r.resolve();
                    } catch (o) {
                      n.logger.error(`Error processing event ${r.id}:`, o),
                        (null !== (e = null == r ? void 0 : r.retryCount) &&
                        void 0 !== e
                          ? e
                          : 0) <
                        (null !== (t = null == r ? void 0 : r.maxRetries) &&
                        void 0 !== t
                          ? t
                          : 0)
                          ? (r.retryCount++,
                            n.logger.log(
                              `Retrying event ${r.id} (attempt ${r.retryCount}/${r.maxRetries})`
                            ),
                            setTimeout(() => {
                              this.queue.unshift(r),
                                this.processing || this.processQueue();
                            }, this.config.retryDelayMs * r.retryCount))
                          : (n.logger.error(
                              `Event ${r.id} failed after ${r.maxRetries} retries`
                            ),
                            (null == r ? void 0 : r.reject) && r.reject(o));
                    }
                  else await this.waitForRateLimit();
                }
                (this.processing = !1),
                  n.logger.log("Queue processing completed");
              }
            }
            canSendEvent() {
              return (
                this.cleanupOldEventTimes(),
                this.eventTimes.length < this.config.maxEventsPerSecond
              );
            }
            recordEventTime() {
              this.eventTimes.push(Date.now());
            }
            cleanupOldEventTimes() {
              const e = Date.now() - 1e3;
              this.eventTimes = this.eventTimes.filter((t) => t > e);
            }
            async waitForRateLimit() {
              const e = this.calculateWaitTime();
              n.logger.log(`Rate limit reached, waiting ${e}ms`),
                await new Promise((t) => setTimeout(t, e));
            }
            calculateWaitTime() {
              if (0 === this.eventTimes.length) return 0;
              const e = this.eventTimes[0],
                t = Date.now() - e;
              return Math.max(0, 1e3 - t) + 10;
            }
            async sendEvent(e) {
              throw new Error("sendEvent method not implemented");
            }
            setSender(e) {
              this.sendEvent = async (t) => {
                await e(t.payload);
              };
            }
            getStatus() {
              return (
                this.cleanupOldEventTimes(),
                {
                  queueLength: this.queue.length,
                  processing: this.processing,
                  eventsInLastSecond: this.eventTimes.length,
                  maxEventsPerSecond: this.config.maxEventsPerSecond,
                }
              );
            }
            clear() {
              this.queue.forEach((e) => {
                (null == e ? void 0 : e.reject) &&
                  e.reject(new Error("Queue cleared"));
              }),
                (this.queue = []),
                (this.eventTimes = []),
                n.logger.log("Queue cleared");
            }
          };
        },
        988: (e, t, r) => {
          Object.defineProperty(t, "__esModule", { value: !0 }),
            (t.URL = t.DNS = t.stringToBytes = void 0);
          const n = r(797),
            o = r(11);
          function i(e) {
            e = unescape(encodeURIComponent(e));
            const t = new Uint8Array(e.length);
            for (let r = 0; r < e.length; ++r) t[r] = e.charCodeAt(r);
            return t;
          }
          (t.stringToBytes = i),
            (t.DNS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"),
            (t.URL = "6ba7b811-9dad-11d1-80b4-00c04fd430c8"),
            (t.default = function (e, t, r, a, s, c) {
              const l = "string" == typeof r ? i(r) : r,
                u = "string" == typeof a ? (0, n.default)(a) : a;
              if (
                ("string" == typeof a && (a = (0, n.default)(a)),
                16 !== a?.length)
              )
                throw TypeError(
                  "Namespace must be array-like (16 iterable integer values, 0-255)"
                );
              let d = new Uint8Array(16 + l.length);
              if (
                (d.set(u),
                d.set(l, u.length),
                (d = t(d)),
                (d[6] = (15 & d[6]) | e),
                (d[8] = (63 & d[8]) | 128),
                s)
              ) {
                c = c || 0;
                for (let e = 0; e < 16; ++e) s[c + e] = d[e];
                return s;
              }
              return (0, o.unsafeStringify)(d);
            });
        },
      },
      t = {},
      r = (function r(n) {
        var o = t[n];
        if (void 0 !== o) return o.exports;
        var i = (t[n] = { exports: {} });
        return e[n].call(i.exports, i, i.exports, r), i.exports;
      })(156);
    return r.default;
  })()
);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFJLElBQUssR0FBSSxZQUNyQ2tNLEVBQUlFLEVBQU1GLEVBQUdDLEVBQUdSLEVBQUdDLEVBQUdOLEVBQUV0TCxFQUFJLEdBQUksSUFBSyxXQUNyQzRMLEVBQUlRLEVBQU1SLEVBQUdNLEVBQUdDLEVBQUdSLEVBQUdMLEVBQUV0TCxFQUFJLEdBQUksR0FBSSxZQUNwQzJMLEVBQUlTLEVBQU1ULEVBQUdDLEVBQUdNLEVBQUdDLEVBQUdiLEVBQUV0TCxFQUFJLElBQUssR0FBSSxZQUNyQ21NLEVBQUlDLEVBQU1ELEVBQUdSLEVBQUdDLEVBQUdNLEVBQUdaLEVBQUV0TCxFQUFJLEdBQUksR0FBSSxVQUNwQ2tNLEVBQUlFLEVBQU1GLEVBQUdDLEVBQUdSLEVBQUdDLEVBQUdOLEVBQUV0TCxFQUFJLEdBQUksR0FBSSxZQUNwQzRMLEVBQUlRLEVBQU1SLEVBQUdNLEVBQUdDLEVBQUdSLEVBQUdMLEVBQUV0TCxFQUFJLElBQUssSUFBSyxZQUN0QzJMLEVBQUlVLEVBQU1WLEVBQUdDLEVBQUdNLEVBQUdDLEVBQUdiLEVBQUV0TCxFQUFJLEdBQUksR0FBSSxRQUNwQ21NLEVBQUlFLEVBQU1GLEVBQUdSLEVBQUdDLEVBQUdNLEVBQUdaLEVBQUV0TCxFQUFJLEdBQUksSUFBSyxZQUNyQ2tNLEVBQUlHLEVBQU1ILEVBQUdDLEVBQUdSLEVBQUdDLEVBQUdOLEVBQUV0TCxFQUFJLElBQUssR0FBSSxZQUNyQzRMLEVBQUlTLEVBQU1ULEVBQUdNLEVBQUdDLEVBQUdSLEVBQUdMLEVBQUV0TCxFQUFJLElBQUssSUFBSyxVQUN0QzJMLEVBQUlVLEVBQU1WLEVBQUdDLEVBQUdNLEVBQUdDLEVBQUdiLEVBQUV0TCxFQUFJLEdBQUksR0FBSSxZQUNwQ21NLEVBQUlFLEVBQU1GLEVBQUdSLEVBQUdDLEVBQUdNLEVBQUdaLEVBQUV0TCxFQUFJLEdBQUksR0FBSSxZQUNwQ2tNLEVBQUlHLEVBQU1ILEVBQUdDLEVBQUdSLEVBQUdDLEVBQUdOLEVBQUV0TCxFQUFJLEdBQUksSUFBSyxXQUNyQzRMLEVBQUlTLEVBQU1ULEVBQUdNLEVB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RXBCLElBQUl5SyxFQUFRLElBQUlyQixXQUFXLEdBQUs4TixFQUFXblMsUUFNM0MsR0FMQTBGLEVBQU0yQixJQUFJK0ssR0FDVjFNLEVBQU0yQixJQUFJOEssRUFBWUMsRUFBZXBTLFFBQ3JDMEYsRUFBUXdNLEVBQUt4TSxHQUNiQSxFQUFNLEdBQWlCLEdBQVhBLEVBQU0sR0FBYWhJLEVBQy9CZ0ksRUFBTSxHQUFpQixHQUFYQSxFQUFNLEdBQWEsSUFDM0JoQixFQUFLLENBQ0w3SixFQUFTQSxHQUFVLEVBQ25CLElBQUssSUFBSUwsRUFBSSxFQUFHQSxFQUFJLEtBQU1BLEVBQ3RCa0ssRUFBSTdKLEVBQVNMLEdBQUtrTCxFQUFNbEwsR0FFNUIsT0FBT2tLLENBQ1gsQ0FDQSxPQUFPLEVBQUk3RixFQUFleEUsaUJBQWlCcUwsRUFDL0MsQyxHQ3RDSTJNLEVBQTJCLENBQUMsRUNFNUJDLEVEQ0osU0FBU0MsRUFBb0JDLEdBRTVCLElBQUlDLEVBQWVKLEVBQXlCRyxHQUM1QyxRQUFxQmxLLElBQWpCbUssRUFDSCxPQUFPQSxFQUFhN1ksUUFHckIsSUFBSUMsRUFBU3dZLEVBQXlCRyxHQUFZLENBR2pENVksUUFBUyxDQUFDLEdBT1gsT0FIQThZLEVBQW9CRixHQUFVRyxLQUFLOVksRUFBT0QsUUFBU0MsRUFBUUEsRUFBT0QsUUFBUzJZLEdBR3BFMVksRUFBT0QsT0FDZixDQ25CMEIyWSxDQUFvQixLIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vRXh0ZXJuYWxUcmFja2luZy93ZWJwYWNrL3VuaXZlcnNhbE1vZHVsZURlZmluaXRpb24iLCJ3ZWJwYWNrOi8vRXh0ZXJuYWxUcmFja2luZy8uL25vZGVfbW9kdWxlcy91dWlkL2Rpc3QvY2pzLWJyb3dzZXIvc3RyaW5naWZ5LmpzIiwid2VicGFjazovL0V4dGVybmFsVHJhY2tpbmcvLi9zcmMvY29yZS90cmFja2VyLnRzIiwid2VicGFjazovL0V4dGVybmFsVHJhY2tpbmcvLi9zcmMvY29uZmlnL2ZhY3RvcnkudHMiLCJ3ZWJwYWNrOi8vRXh0ZXJuYWxUcmFja2luZy8uL3NyYy9pbmRleC50cyIsIndlYnBhY2s6Ly9FeHRlcm5hbFRyYWNraW5nLy4vbm9kZV9tb2R1bGVzL3V1aWQvZGlzdC9janMtYnJvd3Nlci9pbmRleC5qcyIsIndlYnBhY2s6Ly9FeHRlcm5hbFRyYWNraW5nLy4vbm9kZV9tb2R1bGVzL3V1aWQvZGlzdC9janMtYnJvd3Nlci9tYXguanMiLCJ3ZWJwYWNrOi8vRXh0ZXJuYWxUcmFja2luZy8uL3NyYy91dGlscy9pbmRleC50cyIsIndlYnBhY2s6Ly9FeHRlcm5hbFRyYWNraW5nLy4vbm9kZV9tb2R1bGVzL3V1aWQvZGlzdC9janMtYnJvd3Nlci92NlRvVjEuanMiLCJ3ZWJwYWNrOi8vRXh0ZXJuYWxUcmFja2luZy8uL25vZGVfbW9kdWxlcy91dWlkL2Rpc3QvY2pzLWJyb3dzZXIvdjQuanMiLCJ3ZWJwYWNrOi8vRXh0ZXJuYWxUcmFja2luZy8uL25vZGVfbW9kdWxlcy91dWlkL2Rpc3QvY2pzLWJyb3dzZXIvcm5nLmpzIiwid2VicGFjazovL0V4dGVybmFsVHJhY2tpbmcvLi9ub2RlX21vZHVsZXMvdXVpZC9kaXN0L2Nqcy1icm93c2VyL3Y3LmpzIiwid2VicGFjazovL0V4dGVybmFsVHJhY2tpbmcvLi9ub2RlX21vZHVsZXMvdXVpZC9kaXN0L2Nqcy1icm93c2VyL21kNS5qcyIsIndlYnBhY2s6Ly9FeHRlcm5hbFRyYWNraW5nLy4vbm9kZV9tb2R1bGVzL3V1aWQvZGlzdC9janMtYnJvd3Nlci92Ni5qcyIsIndlYnBhY2s6Ly9FeHRlcm5hbFRyYWNraW5nLy4vc3JjL3V0aWxzL2ZpZWxkLXV0aWxzLnRzIiwid2VicGFjazovL0V4dGVybmFsVHJhY2tpbmcvLi9ub2RlX21vZHVsZXMvdXVpZC9kaXN0L2Nqcy1icm93c2VyL3YxLmpzIiwid2VicGFjazovL0V4dGVybmFsVHJhY2tpbmcvLi9zcmMvYXBpL2NsaWVudC50cyIsIndlYnBhY2s6Ly9FeHRlcm5hbFRyYWNraW5nLy4vbm9kZV9tb2R1bGVzL3V1aWQvZGlzdC9janMtYnJvd3Nlci9uaWwuanMiLCJ3ZWJwYWNrOi8vRXh0ZXJuYWxUcmFja2luZy8uL3NyYy9jb25maWcvc2NyaXB0LWNvbmZpZy50cyIsIndlYnBhY2s6Ly9FeHRlcm5hbFRyYWNraW5nLy4vbm9kZV9tb2R1bGVzL3V1aWQvZGlzdC9janMtYnJvd3Nlci92NS5qcyIsIndlYnBhY2s6Ly9FeHRlcm5hbFRyYWNraW5nLy4vbm9kZV9tb2R1bGVzL3V1aWQvZGlzdC9janMtYnJvd3Nlci92MVRvVjYuanMiLCJ3ZWJwYWNrOi8vRXh0ZXJuYWxUcmFja2luZy8uL3NyYy90eXBlcy9pbmRleC50cyIsIndlYnBhY2s6Ly9FeHRlcm5hbFRyYWNraW5nLy4vbm9kZV9tb2R1bGVzL3V1aWQvZGlzdC9janMtYnJvd3Nlci92My5qcyIsIndlYnBhY2s6Ly9FeHRlcm5hbFRyYWNraW5nLy4vc3JjL3V0aWxzL2xvZ2dlci50cyIsIndlYnBhY2s6Ly9FeHRlcm5hbFRyYWNraW5nLy4vbm9kZV9tb2R1bGVzL3V1aWQvZGlzdC9janMtYnJvd3Nlci9yZWdleC5qcyIsIndlYnBhY2s6Ly9FeHRlcm5hbFRyYWNraW5nLy4vc3JjL2V2ZW50cy9pbmRleC50cyIsIndlYnBhY2s6Ly9FeHRlcm5hbFRyYWNraW5nLy4vbm9kZV9tb2R1bGVzL3V1aWQvZGlzdC9janMtYnJvd3Nlci92YWxpZGF0ZS5qcyIsIndlYnBhY2s6Ly9FeHRlcm5hbFRyYWNraW5nLy4vbm9kZV9tb2R1bGVzL3V1aWQvZGlzdC9janMtYnJvd3Nlci92ZXJzaW9uLmpzIiwid2VicGFjazovL0V4dGVybmFsVHJhY2tpbmcvLi9ub2RlX21vZHVsZXMvdXVpZC9kaXN0L2Nqcy1icm93c2VyL25hdGl2ZS5qcyIsIndlYnBhY2s6Ly9FeHRlcm5hbFRyYWNraW5nLy4vbm9kZV9tb2R1bGVzL3V1aWQvZGlzdC9janMtYnJvd3Nlci9wYXJzZS5qcyIsIndlYnBhY2s6Ly9FeHRlcm5hbFRyYWNraW5nLy4vbm9kZV9tb2R1bGVzL3V1aWQvZGlzdC9janMtYnJvd3Nlci9zaGExLmpzIiwid2VicGFjazovL0V4dGVybmFsVHJhY2tpbmcvLi9zcmMvY29yZS9hdXRvLWluaXQudHMiLCJ3ZWJwYWNrOi8vRXh0ZXJuYWxUcmFja2luZy8uL3NyYy9jb25maWcvY29tbW9uLnRzIiwid2VicGFjazovL0V4dGVybmFsVHJhY2tpbmcvLi9zcmMvdXRpbHMvZm9ybS1wYXJzZXIudHMiLCJ3ZWJwYWNrOi8vRXh0ZXJuYWxUcmFja2luZy8uL3NyYy9jb3JlL3F1ZXVlLXN5c3RlbS50cyIsIndlYnBhY2s6Ly9FeHRlcm5hbFRyYWNraW5nLy4vbm9kZV9tb2R1bGVzL3V1aWQvZGlzdC9janMtYnJvd3Nlci92MzUuanMiLCJ3ZWJwYWNrOi8vRXh0ZXJuYWxUcmFja2luZy93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9FeHRlcm5hbFRyYWNraW5nL3dlYnBhY2svc3RhcnR1cCJdLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gd2VicGFja1VuaXZlcnNhbE1vZHVsZURlZmluaXRpb24ocm9vdCwgZmFjdG9yeSkge1xuXHRpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcpXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG5cdGVsc2UgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKVxuXHRcdGRlZmluZShbXSwgZmFjdG9yeSk7XG5cdGVsc2UgaWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKVxuXHRcdGV4cG9ydHNbXCJFeHRlcm5hbFRyYWNraW5nXCJdID0gZmFjdG9yeSgpO1xuXHRlbHNlXG5cdFx0cm9vdFtcIkV4dGVybmFsVHJhY2tpbmdcIl0gPSBmYWN0b3J5KCk7XG59KSh0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcgPyBzZWxmIDogdGhpcywgKCkgPT4ge1xucmV0dXJuICIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy51bnNhZmVTdHJpbmdpZnkgPSB2b2lkIDA7XG5jb25zdCB2YWxpZGF0ZV9qc18xID0gcmVxdWlyZShcIi4vdmFsaWRhdGUuanNcIik7XG5jb25zdCBieXRlVG9IZXggPSBbXTtcbmZvciAobGV0IGkgPSAwOyBpIDwgMjU2OyArK2kpIHtcbiAgICBieXRlVG9IZXgucHVzaCgoaSArIDB4MTAwKS50b1N0cmluZygxNikuc2xpY2UoMSkpO1xufVxuZnVuY3Rpb24gdW5zYWZlU3RyaW5naWZ5KGFyciwgb2Zmc2V0ID0gMCkge1xuICAgIHJldHVybiAoYnl0ZVRvSGV4W2FycltvZmZzZXQgKyAwXV0gK1xuICAgICAgICBieXRlVG9IZXhbYXJyW29mZnNldCArIDFdXSArXG4gICAgICAgIGJ5dGVUb0hleFthcnJbb2Zmc2V0ICsgMl1dICtcbiAgICAgICAgYnl0ZVRvSGV4W2FycltvZmZzZXQgKyAzXV0gK1xuICAgICAgICAnLScgK1xuICAgICAgICBieXRlVG9IZXhbYXJyW29mZnNldCArIDRdXSArXG4gICAgICAgIGJ5dGVUb0hleFthcnJbb2Zmc2V0ICsgNV1dICtcbiAgICAgICAgJy0nICtcbiAgICAgICAgYnl0ZVRvSGV4W2FycltvZmZzZXQgKyA2XV0gK1xuICAgICAgICBieXRlVG9IZXhbYXJyW29mZnNldCArIDddXSArXG4gICAgICAgICctJyArXG4gICAgICAgIGJ5dGVUb0hleFthcnJbb2Zmc2V0ICsgOF1dICtcbiAgICAgICAgYnl0ZVRvSGV4W2FycltvZmZzZXQgKyA5XV0gK1xuICAgICAgICAnLScgK1xuICAgICAgICBieXRlVG9IZXhbYXJyW29mZnNldCArIDEwXV0gK1xuICAgICAgICBieXRlVG9IZXhbYXJyW29mZnNldCArIDExXV0gK1xuICAgICAgICBieXRlVG9IZXhbYXJyW29mZnNldCArIDEyXV0gK1xuICAgICAgICBieXRlVG9IZXhbYXJyW29mZnNldCArIDEzXV0gK1xuICAgICAgICBieXRlVG9IZXhbYXJyW29mZnNldCArIDE0XV0gK1xuICAgICAgICBieXRlVG9IZXhbYXJyW29mZnNldCArIDE1XV0pLnRvTG93ZXJDYXNlKCk7XG59XG5leHBvcnRzLnVuc2FmZVN0cmluZ2lmeSA9IHVuc2FmZVN0cmluZ2lmeTtcbmZ1bmN0aW9uIHN0cmluZ2lmeShhcnIsIG9mZnNldCA9IDApIHtcbiAgICBjb25zdCB1dWlkID0gdW5zYWZlU3RyaW5naWZ5KGFyciwgb2Zmc2V0KTtcbiAgICBpZiAoISgwLCB2YWxpZGF0ZV9qc18xLmRlZmF1bHQpKHV1aWQpKSB7XG4gICAgICAgIHRocm93IFR5cGVFcnJvcignU3RyaW5naWZpZWQgVVVJRCBpcyBpbnZhbGlkJyk7XG4gICAgfVxuICAgIHJldHVybiB1dWlkO1xufVxuZXhwb3J0cy5kZWZhdWx0ID0gc3RyaW5naWZ5O1xuIiwiaW1wb3J0IHsgXG4gIFRyYWNraW5nQ29uZmlnLCBcbiAgVHJhY2tpbmdTdGF0ZSwgXG4gIFRyYWNraW5nRXZlbnQsXG4gIFBhZ2VWaWV3RXZlbnQsXG4gIEZvcm1TdWJtaXNzaW9uRXZlbnRcbn0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0IHsgQXBpQ2xpZW50IH0gZnJvbSAnLi4vYXBpL2NsaWVudCc7XG5pbXBvcnQgeyBzdGFydFBhZ2VUcmFja2luZywgc3RhcnRGb3JtVHJhY2tpbmcgfSBmcm9tICcuLi9ldmVudHMnO1xuaW1wb3J0IHsgXG4gIGxvZ2dlciwgXG4gIGdlbmVyYXRlU2Vzc2lvbklkLFxuICBzdG9yZVNlc3Npb25JZEluQ29va2llXG59IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCB7IEdMT0JBTF9UUkFDS0lOR19LRVkgfSBmcm9tICcuLi9jb25maWcvY29tbW9uJztcblxuLyoqXG4gKiBNYWluIGV4dGVybmFsIHRyYWNraW5nIGNsYXNzXG4gKi9cbmV4cG9ydCBjbGFzcyBFeHRlcm5hbFRyYWNrZXIge1xuICBwcml2YXRlIHN0YXRlOiBUcmFja2luZ1N0YXRlO1xuICBwcml2YXRlIGFwaUNsaWVudDogQXBpQ2xpZW50O1xuXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogVHJhY2tpbmdDb25maWcpIHtcbiAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgaW5pdGlhbGl6ZWQ6IGZhbHNlLFxuICAgICAgdHJhY2tpbmdJZDogY29uZmlnLnRyYWNraW5nSWQsXG4gICAgfTtcbiAgICBcbiAgICB0aGlzLmFwaUNsaWVudCA9IG5ldyBBcGlDbGllbnQoY29uZmlnLnRyYWNraW5nSWQsIGNvbmZpZy5hcGlFbmRwb2ludCk7XG5cbiAgICAvLyBTZXQgZGVidWcgbW9kZVxuICAgIGlmIChjb25maWcuZGVidWcpIHtcbiAgICAgIGNvbnN0IHcgPSB3aW5kb3cgYXMgYW55O1xuICAgICAgd1tHTE9CQUxfVFJBQ0tJTkdfS0VZXSA9IHdbR0xPQkFMX1RSQUNLSU5HX0tFWV0gfHwge307XG4gICAgICB3W0dMT0JBTF9UUkFDS0lOR19LRVldLmRlYnVnID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBsb2dnZXIubG9nKCdFeHRlcm5hbFRyYWNrZXIgY3JlYXRlZCB3aXRoIGNvbmZpZzonLCBjb25maWcpO1xuICAgIFxuICAgIC8vIEF1dG8taW5pdGlhbGl6ZVxuICAgIHRoaXMuaW5pdCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgdGhlIHRyYWNrZXJcbiAgICovXG4gIGFzeW5jIGluaXQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuc3RhdGUuaW5pdGlhbGl6ZWQpIHtcbiAgICAgIGxvZ2dlci53YXJuKCdUcmFja2VyIGFscmVhZHkgaW5pdGlhbGl6ZWQnKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgLy8gRmV0Y2ggbG9jYXRpb24gSURcbiAgICAgIGNvbnN0IGxvY2F0aW9uSWQgPSBhd2FpdCB0aGlzLmFwaUNsaWVudC5mZXRjaExvY2F0aW9uSWQoKTtcbiAgICAgIHRoaXMuc3RhdGUubG9jYXRpb25JZCA9IGxvY2F0aW9uSWQ7XG4gICAgICBcbiAgICAgIC8vIEdlbmVyYXRlIG5ldyBzZXNzaW9uSWQgZm9yIGVhY2ggc2Vzc2lvbiBhbmQgc3RvcmUgaW4gY29va2llXG4gICAgICB0aGlzLnN0YXRlLnNlc3Npb25JZCA9IGdlbmVyYXRlU2Vzc2lvbklkKCk7XG4gICAgICBzdG9yZVNlc3Npb25JZEluQ29va2llKGxvY2F0aW9uSWQsIHRoaXMuc3RhdGUuc2Vzc2lvbklkKTtcbiAgICAgIFxuICAgICAgLy8gU2V0IHRyYWNraW5nIGNvbnRleHQgb24gQVBJIGNsaWVudCB3aXRoIHNlc3Npb25JZFxuICAgICAgdGhpcy5hcGlDbGllbnQuc2V0VHJhY2tpbmdDb250ZXh0KFxuICAgICAgICB0aGlzLnN0YXRlLnNlc3Npb25JZCxcbiAgICAgICAgbG9jYXRpb25JZFxuICAgICAgKTtcbiAgICAgIFxuICAgICAgLy8gU2V0dXAgYXV0b21hdGljIHRyYWNraW5nIChzdGFydHMgaW1tZWRpYXRlbHkgdXBvbiBmdW5jdGlvbiBjYWxsKVxuICAgICAgc3RhcnRQYWdlVHJhY2tpbmcoYXN5bmMgKGV2ZW50KSA9PiB7XG4gICAgICAgIC8vIEFkZCBzZXNzaW9uSWQgdG8gYWxsIGV2ZW50c1xuICAgICAgICBldmVudC5wcm9wZXJ0aWVzID0ge1xuICAgICAgICAgIC4uLmV2ZW50LnByb3BlcnRpZXMsXG4gICAgICAgICAgc2Vzc2lvbklkOiB0aGlzLnN0YXRlLnNlc3Npb25JZCxcbiAgICAgICAgfTtcbiAgICAgICAgYXdhaXQgdGhpcy5zZW5kRXZlbnQoZXZlbnQpO1xuICAgICAgfSk7XG5cbiAgICAgIHN0YXJ0Rm9ybVRyYWNraW5nKGFzeW5jIChldmVudCkgPT4ge1xuICAgICAgICAvLyBBZGQgc2Vzc2lvbklkIHRvIGZvcm0gc3VibWlzc2lvbnNcbiAgICAgICAgZXZlbnQucHJvcGVydGllcyA9IHtcbiAgICAgICAgICAuLi5ldmVudC5wcm9wZXJ0aWVzLFxuICAgICAgICAgIHNlc3Npb25JZDogdGhpcy5zdGF0ZS5zZXNzaW9uSWQsXG4gICAgICAgIH07XG4gICAgICAgIGF3YWl0IHRoaXMuYXBpQ2xpZW50LnN1Ym1pdEZvcm0oZXZlbnQpO1xuICAgICAgfSk7XG5cbiAgICAgIHRoaXMuc3RhdGUuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgICAgbG9nZ2VyLmxvZygnVHJhY2tlciBpbml0aWFsaXplZCBzdWNjZXNzZnVsbHkgd2l0aCBzZXNzaW9uSWQ6JywgdGhpcy5zdGF0ZS5zZXNzaW9uSWQpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBsb2dnZXIuZXJyb3IoJ0ZhaWxlZCB0byBpbml0aWFsaXplIHRyYWNrZXI6JywgZXJyb3IpO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgZXZlbnQgdG8gQVBJXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHNlbmRFdmVudChldmVudDogVHJhY2tpbmdFdmVudCB8IFBhZ2VWaWV3RXZlbnQgfCBGb3JtU3VibWlzc2lvbkV2ZW50KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgLy8gQWRkIHVzZXIgY29udGV4dCBpZiBhdmFpbGFibGVcbiAgICBpZiAodGhpcy5zdGF0ZS51c2VySWQpIHtcbiAgICAgIGV2ZW50LnByb3BlcnRpZXMgPSB7XG4gICAgICAgIC4uLmV2ZW50LnByb3BlcnRpZXMsXG4gICAgICAgIHVzZXJJZDogdGhpcy5zdGF0ZS51c2VySWQsXG4gICAgICAgIC4uLnRoaXMuc3RhdGUudXNlclByb3BlcnRpZXMsXG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIEVuc3VyZSBzZXNzaW9uSWQgaXMgc2V0XG4gICAgZXZlbnQucHJvcGVydGllcyA9IHtcbiAgICAgIC4uLmV2ZW50LnByb3BlcnRpZXMsXG4gICAgICBzZXNzaW9uSWQ6IHRoaXMuc3RhdGUuc2Vzc2lvbklkLFxuICAgICAgbG9jYXRpb25JZDogdGhpcy5zdGF0ZS5sb2NhdGlvbklkLFxuICAgIH07XG5cbiAgICBhd2FpdCB0aGlzLmFwaUNsaWVudC5zZW5kRXZlbnQoZXZlbnQpO1xuICB9XG59ICIsImltcG9ydCB7IEV4dGVybmFsVHJhY2tlciB9IGZyb20gJy4uL2NvcmUvdHJhY2tlcic7XG5pbXBvcnQgeyBUcmFja2luZ0NvbmZpZyB9IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCB7IHZhbGlkYXRlQ29uZmlnIH0gZnJvbSAnLi9zY3JpcHQtY29uZmlnJztcblxuLyoqXG4gKiBDcmVhdGVzIGFuZCBpbml0aWFsaXplcyBhIG5ldyBFeHRlcm5hbFRyYWNrZXIgaW5zdGFuY2VcbiAqIFxuICogQHBhcmFtIGNvbmZpZyAtIENvbmZpZ3VyYXRpb24gb2JqZWN0IGZvciB0aGUgdHJhY2tlclxuICogQHJldHVybnMgRXh0ZXJuYWxUcmFja2VyIGluc3RhbmNlXG4gKiBAdGhyb3dzIEVycm9yIGlmIGNvbmZpZ3VyYXRpb24gaXMgaW52YWxpZFxuICogXG4gKiBMb2dpYyBmbG93OlxuICogMS4gVmFsaWRhdGUgdGhlIHByb3ZpZGVkIGNvbmZpZ3VyYXRpb25cbiAqIDIuIENyZWF0ZSBuZXcgRXh0ZXJuYWxUcmFja2VyIGluc3RhbmNlXG4gKiAzLiBMb2cgc3VjY2Vzc2Z1bCBjcmVhdGlvblxuICogNC4gUmV0dXJuIHRoZSB0cmFja2VyIGluc3RhbmNlXG4gKi9cbmV4cG9ydCBjb25zdCBjcmVhdGVUcmFja2VyID0gKGNvbmZpZzogVHJhY2tpbmdDb25maWcpOiBFeHRlcm5hbFRyYWNrZXIgPT4ge1xuICAvLyBWYWxpZGF0ZSBjb25maWd1cmF0aW9uIGJlZm9yZSBjcmVhdGluZyB0cmFja2VyXG4gIGlmICghdmFsaWRhdGVDb25maWcoY29uZmlnKSkge1xuICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKCdJbnZhbGlkIHRyYWNraW5nIGNvbmZpZ3VyYXRpb24gcHJvdmlkZWQnKTtcbiAgICBsb2dnZXIuY3JpdGljYWwoJ0ZhaWxlZCB0byBjcmVhdGUgdHJhY2tlcjonLCBlcnJvcik7XG4gICAgdGhyb3cgZXJyb3I7XG4gIH1cblxuICB0cnkge1xuICAgIC8vIENyZWF0ZSB0cmFja2VyIGluc3RhbmNlXG4gICAgY29uc3QgdHJhY2tlciA9IG5ldyBFeHRlcm5hbFRyYWNrZXIoY29uZmlnKTtcbiAgICBcbiAgICBsb2dnZXIubG9nKCdUcmFja2VyIGNyZWF0ZWQgc3VjY2Vzc2Z1bGx5IHdpdGggSUQ6JywgY29uZmlnLnRyYWNraW5nSWQpO1xuICAgIHJldHVybiB0cmFja2VyO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGxvZ2dlci5jcml0aWNhbCgnRXJyb3IgY3JlYXRpbmcgdHJhY2tlcjonLCBlcnJvcik7XG4gICAgdGhyb3cgZXJyb3I7XG4gIH1cbn07XG5cbiAiLCJpbXBvcnQgeyBpbml0aWFsaXplRnJvbVNjcmlwdCB9IGZyb20gJy4vY29yZS9hdXRvLWluaXQnO1xuXG5pbXBvcnQgeyBsb2dnZXIgfSBmcm9tICcuL3V0aWxzJztcblxuZXhwb3J0ICogZnJvbSAnLi90eXBlcyc7XG5cbi8qKlxuICogTWFpbiBpbml0aWFsaXphdGlvbiBvcmNoZXN0cmF0b3JcbiAqL1xuY29uc3QgaW5pdGlhbGl6ZSA9ICgpOiB2b2lkID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCB0cmFja2VyID0gaW5pdGlhbGl6ZUZyb21TY3JpcHQoKTtcbiAgICBcbiAgICBpZiAodHJhY2tlcikge1xuICAgICAgbG9nZ2VyLmxvZygnVHJhY2tpbmcgaW5pdGlhbGl6ZWQgc3VjY2Vzc2Z1bGx5Jyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxvZ2dlci5jcml0aWNhbCgnRXh0ZXJuYWwgVHJhY2tpbmcgZmFpbGVkIHRvIGluaXRpYWxpemUnKTtcbiAgICAgIGxvZ2dlci5jcml0aWNhbCgnTWFrZSBzdXJlIHRvIGluY2x1ZGUgZGF0YS10cmFja2luZy1pZCBpbiB5b3VyIHNjcmlwdCB0YWcnKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgbG9nZ2VyLmNyaXRpY2FsKCdJbml0aWFsaXphdGlvbiBmYWlsZWQ6JywgZXJyb3IpO1xuICB9XG59O1xuXG4vLyBFeGVjdXRlIGluaXRpYWxpemF0aW9uXG5pbml0aWFsaXplKCk7XG5cbi8vIEV4dGVuZCB3aW5kb3cgaW50ZXJmYWNlIGZvciBUeXBlU2NyaXB0XG5kZWNsYXJlIGdsb2JhbCB7XG4gIGludGVyZmFjZSBXaW5kb3cge1xuICAgIFtrZXk6IHN0cmluZ106IGFueTtcbiAgfVxufSIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy52ZXJzaW9uID0gZXhwb3J0cy52YWxpZGF0ZSA9IGV4cG9ydHMudjcgPSBleHBvcnRzLnY2VG9WMSA9IGV4cG9ydHMudjYgPSBleHBvcnRzLnY1ID0gZXhwb3J0cy52NCA9IGV4cG9ydHMudjMgPSBleHBvcnRzLnYxVG9WNiA9IGV4cG9ydHMudjEgPSBleHBvcnRzLnN0cmluZ2lmeSA9IGV4cG9ydHMucGFyc2UgPSBleHBvcnRzLk5JTCA9IGV4cG9ydHMuTUFYID0gdm9pZCAwO1xudmFyIG1heF9qc18xID0gcmVxdWlyZShcIi4vbWF4LmpzXCIpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiTUFYXCIsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiBtYXhfanNfMS5kZWZhdWx0OyB9IH0pO1xudmFyIG5pbF9qc18xID0gcmVxdWlyZShcIi4vbmlsLmpzXCIpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiTklMXCIsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiBuaWxfanNfMS5kZWZhdWx0OyB9IH0pO1xudmFyIHBhcnNlX2pzXzEgPSByZXF1aXJlKFwiLi9wYXJzZS5qc1wiKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcInBhcnNlXCIsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiBwYXJzZV9qc18xLmRlZmF1bHQ7IH0gfSk7XG52YXIgc3RyaW5naWZ5X2pzXzEgPSByZXF1aXJlKFwiLi9zdHJpbmdpZnkuanNcIik7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJzdHJpbmdpZnlcIiwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHN0cmluZ2lmeV9qc18xLmRlZmF1bHQ7IH0gfSk7XG52YXIgdjFfanNfMSA9IHJlcXVpcmUoXCIuL3YxLmpzXCIpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwidjFcIiwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHYxX2pzXzEuZGVmYXVsdDsgfSB9KTtcbnZhciB2MVRvVjZfanNfMSA9IHJlcXVpcmUoXCIuL3YxVG9WNi5qc1wiKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcInYxVG9WNlwiLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gdjFUb1Y2X2pzXzEuZGVmYXVsdDsgfSB9KTtcbnZhciB2M19qc18xID0gcmVxdWlyZShcIi4vdjMuanNcIik7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJ2M1wiLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gdjNfanNfMS5kZWZhdWx0OyB9IH0pO1xudmFyIHY0X2pzXzEgPSByZXF1aXJlKFwiLi92NC5qc1wiKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcInY0XCIsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiB2NF9qc18xLmRlZmF1bHQ7IH0gfSk7XG52YXIgdjVfanNfMSA9IHJlcXVpcmUoXCIuL3Y1LmpzXCIpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwidjVcIiwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHY1X2pzXzEuZGVmYXVsdDsgfSB9KTtcbnZhciB2Nl9qc18xID0gcmVxdWlyZShcIi4vdjYuanNcIik7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJ2NlwiLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gdjZfanNfMS5kZWZhdWx0OyB9IH0pO1xudmFyIHY2VG9WMV9qc18xID0gcmVxdWlyZShcIi4vdjZUb1YxLmpzXCIpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwidjZUb1YxXCIsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiB2NlRvVjFfanNfMS5kZWZhdWx0OyB9IH0pO1xudmFyIHY3X2pzXzEgPSByZXF1aXJlKFwiLi92Ny5qc1wiKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcInY3XCIsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiB2N19qc18xLmRlZmF1bHQ7IH0gfSk7XG52YXIgdmFsaWRhdGVfanNfMSA9IHJlcXVpcmUoXCIuL3ZhbGlkYXRlLmpzXCIpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwidmFsaWRhdGVcIiwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHZhbGlkYXRlX2pzXzEuZGVmYXVsdDsgfSB9KTtcbnZhciB2ZXJzaW9uX2pzXzEgPSByZXF1aXJlKFwiLi92ZXJzaW9uLmpzXCIpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwidmVyc2lvblwiLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gdmVyc2lvbl9qc18xLmRlZmF1bHQ7IH0gfSk7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZGVmYXVsdCA9ICdmZmZmZmZmZi1mZmZmLWZmZmYtZmZmZi1mZmZmZmZmZmZmZmYnO1xuIiwiaW1wb3J0IHsgdjQgYXMgdXVpZHY0IH0gZnJvbSAndXVpZCc7XG5pbXBvcnQgeyBsb2dnZXIgfSBmcm9tICcuL2xvZ2dlcic7XG5cbi8vIFJlLWV4cG9ydCBmcm9tIHNwZWNpYWxpemVkIG1vZHVsZXNcbmV4cG9ydCB7IGxvZ2dlciB9IGZyb20gJy4vbG9nZ2VyJztcbmV4cG9ydCB7IHBhcnNlRm9ybURhdGEsIHR5cGUgRm9ybVBhcnNlUmVzdWx0IH0gZnJvbSAnLi9mb3JtLXBhcnNlcic7XG5leHBvcnQgeyBjb250YWluc1Bhc3N3b3JkLCBpc1Bhc3N3b3JkTGlrZUZpZWxkIH0gZnJvbSAnLi9maWVsZC11dGlscyc7XG5cbi8qKlxuICogR2VuZXJhdGUgYSBVVUlEIHY0IGZvciBzZXNzaW9uSWRcbiAqL1xuZXhwb3J0IGNvbnN0IGdlbmVyYXRlU2Vzc2lvbklkID0gKCk6IHN0cmluZyA9PiB7XG4gIHJldHVybiB1dWlkdjQoKTtcbn07XG5cbi8qKlxuICogR2V0IGNvb2tpZSB2YWx1ZVxuICovXG5leHBvcnQgY29uc3QgZ2V0Q29va2llID0gKG5hbWU6IHN0cmluZyk6IHN0cmluZyB8IG51bGwgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHZhbHVlID0gYDsgJHtkb2N1bWVudC5jb29raWV9YDtcbiAgICBjb25zdCBwYXJ0cyA9IHZhbHVlLnNwbGl0KGA7ICR7bmFtZX09YCk7XG4gICAgaWYgKHBhcnRzLmxlbmd0aCA9PT0gMikge1xuICAgICAgcmV0dXJuIHBhcnRzLnBvcCgpPy5zcGxpdCgnOycpLnNoaWZ0KCkgfHwgbnVsbDtcbiAgICB9XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBsb2dnZXIuZXJyb3IoJ0Vycm9yIGdldHRpbmcgY29va2llOicsIGUpO1xuICB9XG4gIHJldHVybiBudWxsO1xufTtcblxuLyoqXG4gKiBTZXQgY29va2llIHZhbHVlXG4gKi9cbmV4cG9ydCBjb25zdCBzZXRDb29raWUgPSAobmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nLCBkYXlzOiBudW1iZXIpOiB2b2lkID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBkYXRlID0gbmV3IERhdGUoKTtcbiAgICBkYXRlLnNldFRpbWUoZGF0ZS5nZXRUaW1lKCkgKyAoZGF5cyAqIDI0ICogNjAgKiA2MCAqIDEwMDApKTtcbiAgICBjb25zdCBleHBpcmVzID0gYGV4cGlyZXM9JHtkYXRlLnRvVVRDU3RyaW5nKCl9YDtcbiAgICBkb2N1bWVudC5jb29raWUgPSBgJHtuYW1lfT0ke3ZhbHVlfTske2V4cGlyZXN9O3BhdGg9LztTYW1lU2l0ZT1MYXhgO1xuICB9IGNhdGNoIChlKSB7XG4gICAgbG9nZ2VyLmVycm9yKCdFcnJvciBzZXR0aW5nIGNvb2tpZTonLCBlKTtcbiAgfVxufTtcblxuLyoqXG4gKiBTdG9yZSB1c2VyIGRhdGEgaW4gbG9jYWxTdG9yYWdlIChzaW1pbGFyIHRvIF91ZCBpbiBGb3JtQ29tcG9uZW50KVxuICovXG5leHBvcnQgY29uc3Qgc3RvcmVVc2VyRGF0YSA9IChkYXRhOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogdm9pZCA9PiB7XG4gIHRyeSB7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5sb2NhbFN0b3JhZ2UpIHtcbiAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnX3VkJywgSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIGxvZ2dlci5lcnJvcignRXJyb3Igc3RvcmluZyB1c2VyIGRhdGE6JywgZSk7XG4gIH1cbn07XG5cbi8qKlxuICogR2V0IHVzZXIgZGF0YSBmcm9tIGxvY2FsU3RvcmFnZVxuICovXG5leHBvcnQgY29uc3QgZ2V0VXNlckRhdGEgPSAoKTogUmVjb3JkPHN0cmluZywgYW55PiB8IG51bGwgPT4ge1xuICB0cnkge1xuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cubG9jYWxTdG9yYWdlKSB7XG4gICAgICBjb25zdCBkYXRhID0gd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKCdfdWQnKTtcbiAgICAgIGlmICghZGF0YSkgcmV0dXJuIG51bGw7XG5cbiAgICAgIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2UoZGF0YSkgYXMgUmVjb3JkPHN0cmluZywgYW55PjtcblxuICAgICAgaWYgKHBhcnNlZCAmJiB0eXBlb2YgcGFyc2VkID09PSAnb2JqZWN0JyAmJiAnY3VzdG9tZXJfaWQnIGluIHBhcnNlZCkge1xuICAgICAgICBjb25zdCBjaWQgPSAocGFyc2VkIGFzIGFueSkuY3VzdG9tZXJfaWQ7XG4gICAgICAgIGlmIChjaWQgIT09IHVuZGVmaW5lZCAmJiBjaWQgIT09IG51bGwpIHtcbiAgICAgICAgICBjb25zdCBub3JtYWxpemVkID0gU3RyaW5nKGNpZCkudHJpbSgpO1xuICAgICAgICAgIGlmIChub3JtYWxpemVkKSB7XG4gICAgICAgICAgICAocGFyc2VkIGFzIGFueSkuY29udGFjdElkID0gbm9ybWFsaXplZDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHBhcnNlZDtcbiAgICB9XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBsb2dnZXIuZXJyb3IoJ0Vycm9yIGdldHRpbmcgdXNlciBkYXRhOicsIGUpO1xuICB9XG4gIHJldHVybiBudWxsO1xufTtcblxuLyoqXG4gKiBTdG9yZSBzZXNzaW9uSWQgd2l0aCBjb29raWUgZmFsbGJhY2sgdG8gc2Vzc2lvblN0b3JhZ2VcbiAqL1xuZXhwb3J0IGNvbnN0IHN0b3JlU2Vzc2lvbklkSW5Db29raWUgPSAobG9jYXRpb25JZDogc3RyaW5nLCBzZXNzaW9uSWQ6IHN0cmluZyk6IHZvaWQgPT4ge1xuICBjb25zdCBjb29raWVOYW1lID0gYGxjX3Nlc3Npb25fJHtsb2NhdGlvbklkfWA7XG4gIFxuICAvLyBUcnkgY29va2llIGZpcnN0XG4gIHNldENvb2tpZShjb29raWVOYW1lLCBzZXNzaW9uSWQsIDEpO1xuICBcbiAgLy8gVmVyaWZ5IGNvb2tpZSB3b3JrZWQsIGlmIG5vdCBmYWxsYmFjayB0byBzZXNzaW9uU3RvcmFnZVxuICBjb25zdCB2ZXJpZmljYXRpb24gPSBnZXRDb29raWUoY29va2llTmFtZSk7XG4gIGlmICh2ZXJpZmljYXRpb24gIT09IHNlc3Npb25JZCkge1xuICAgIC8vIENvb2tpZSBmYWlsZWQsIHVzZSBzZXNzaW9uU3RvcmFnZSBhcyBmYWxsYmFja1xuICAgIHRyeSB7XG4gICAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LnNlc3Npb25TdG9yYWdlKSB7XG4gICAgICAgIHdpbmRvdy5zZXNzaW9uU3RvcmFnZS5zZXRJdGVtKGNvb2tpZU5hbWUsIHNlc3Npb25JZCk7XG4gICAgICAgIGxvZ2dlci5hcGkoYFNlc3Npb25JZCBzdG9yZWQgaW4gc2Vzc2lvblN0b3JhZ2UgKGNvb2tpZSBmYWxsYmFjayk6ICR7c2Vzc2lvbklkfWApO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGxvZ2dlci5lcnJvcignQm90aCBjb29raWUgYW5kIHNlc3Npb25TdG9yYWdlIGZhaWxlZCBmb3Igc2Vzc2lvbklkIHN0b3JhZ2UnLCBlKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgbG9nZ2VyLmFwaShgU2Vzc2lvbklkIHN0b3JlZCBpbiBjb29raWU6ICR7c2Vzc2lvbklkfWApO1xuICB9XG59O1xuXG4vKipcbiAqIEdldCBzZXNzaW9uSWQgZnJvbSBjb29raWUgd2l0aCBzZXNzaW9uU3RvcmFnZSBmYWxsYmFja1xuICovXG5leHBvcnQgY29uc3QgZ2V0U2Vzc2lvbklkRnJvbUNvb2tpZSA9IChsb2NhdGlvbklkOiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsID0+IHtcbiAgY29uc3QgY29va2llTmFtZSA9IGBsY19zZXNzaW9uXyR7bG9jYXRpb25JZH1gO1xuICBcbiAgLy8gVHJ5IGNvb2tpZSBmaXJzdFxuICBjb25zdCBjb29raWVSZXN1bHQgPSBnZXRDb29raWUoY29va2llTmFtZSk7XG4gIGlmIChjb29raWVSZXN1bHQpIHtcbiAgICByZXR1cm4gY29va2llUmVzdWx0O1xuICB9XG4gIFxuICAvLyBGYWxsYmFjayB0byBzZXNzaW9uU3RvcmFnZVxuICB0cnkge1xuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuc2Vzc2lvblN0b3JhZ2UpIHtcbiAgICAgIGNvbnN0IHNlc3Npb25TdG9yYWdlUmVzdWx0ID0gd2luZG93LnNlc3Npb25TdG9yYWdlLmdldEl0ZW0oY29va2llTmFtZSk7XG4gICAgICBpZiAoc2Vzc2lvblN0b3JhZ2VSZXN1bHQpIHtcbiAgICAgICAgbG9nZ2VyLmFwaShgU2Vzc2lvbklkIHJldHJpZXZlZCBmcm9tIHNlc3Npb25TdG9yYWdlIChjb29raWUgZmFsbGJhY2spOiAke3Nlc3Npb25TdG9yYWdlUmVzdWx0fWApO1xuICAgICAgICByZXR1cm4gc2Vzc2lvblN0b3JhZ2VSZXN1bHQ7XG4gICAgICB9XG4gICAgfVxuICB9IGNhdGNoIChlKSB7XG4gICAgbG9nZ2VyLmVycm9yKCdCb3RoIGNvb2tpZSBhbmQgc2Vzc2lvblN0b3JhZ2UgZmFpbGVkIGZvciBzZXNzaW9uSWQgcmV0cmlldmFsJywgZSk7XG4gIH1cbiAgXG4gIHJldHVybiBudWxsO1xufTtcblxuLyoqXG4gKiBTYWZlIGxvY2FsU3RvcmFnZSBnZXR0ZXJcbiAqL1xuZXhwb3J0IGNvbnN0IGdldEZyb21TdG9yYWdlID0gKGtleTogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCA9PiB7XG4gIHRyeSB7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5sb2NhbFN0b3JhZ2UpIHtcbiAgICAgIHJldHVybiB3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KTtcbiAgICB9XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBsb2dnZXIuZXJyb3IoJ0Vycm9yIGdldHRpbmcgZnJvbSBzdG9yYWdlOicsIGUpO1xuICB9XG4gIHJldHVybiBudWxsO1xufTtcblxuLyoqXG4gKiBTYWZlIGxvY2FsU3RvcmFnZSBzZXR0ZXJcbiAqL1xuZXhwb3J0IGNvbnN0IHNldEluU3RvcmFnZSA9IChrZXk6IHN0cmluZywgdmFsdWU6IHN0cmluZyk6IHZvaWQgPT4ge1xuICB0cnkge1xuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cubG9jYWxTdG9yYWdlKSB7XG4gICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCB2YWx1ZSk7XG4gICAgfVxuICB9IGNhdGNoIChlKSB7XG4gICAgbG9nZ2VyLmVycm9yKCdFcnJvciBzZXR0aW5nIGluIHN0b3JhZ2U6JywgZSk7XG4gIH1cbn07XG5cbi8qKlxuICogRGVib3VuY2UgZnVuY3Rpb24gZm9yIHBlcmZvcm1hbmNlXG4gKi9cbmV4cG9ydCBjb25zdCBkZWJvdW5jZSA9IDxUIGV4dGVuZHMgKC4uLmFyZ3M6IGFueVtdKSA9PiBhbnk+KFxuICBmdW5jOiBULFxuICB3YWl0OiBudW1iZXJcbik6ICgoLi4uYXJnczogUGFyYW1ldGVyczxUPikgPT4gdm9pZCkgPT4ge1xuICBsZXQgdGltZW91dDogTm9kZUpTLlRpbWVvdXQ7XG4gIFxuICByZXR1cm4gZnVuY3Rpb24gZXhlY3V0ZWRGdW5jdGlvbiguLi5hcmdzOiBQYXJhbWV0ZXJzPFQ+KSB7XG4gICAgY29uc3QgbGF0ZXIgPSAoKSA9PiB7XG4gICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICBmdW5jKC4uLmFyZ3MpO1xuICAgIH07XG4gICAgXG4gICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCB3YWl0KTtcbiAgfTtcbn07XG5cbi8qKlxuICogR2V0IHBhZ2UgbWV0YWRhdGFcbiAqL1xuZXhwb3J0IGNvbnN0IGdldFBhZ2VNZXRhZGF0YSA9ICgpID0+IHtcbiAgcmV0dXJuIHtcbiAgICB0aXRsZTogZG9jdW1lbnQudGl0bGUsXG4gICAgdXJsOiB3aW5kb3cubG9jYXRpb24uaHJlZixcbiAgICBwYXRoOiB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUsXG4gICAgcmVmZXJyZXI6IGRvY3VtZW50LnJlZmVycmVyLFxuICAgIHVzZXJBZ2VudDogbmF2aWdhdG9yLnVzZXJBZ2VudCxcbiAgfTtcbn07XG5cbmV4cG9ydCBjb25zdCBnZXRMb2NhbFRpbWVab25lID0gKCk6IHN0cmluZyA9PiB7XG4gIHJldHVybiBJbnRsLkRhdGVUaW1lRm9ybWF0KCkucmVzb2x2ZWRPcHRpb25zKCkudGltZVpvbmU7XG59O1xuXG5leHBvcnQgY29uc3QgZ2V0TG9jYWxUaW1lWm9uZU9mZnNldCA9ICgpOiBzdHJpbmcgPT4ge1xuICBjb25zdCBtYXRjaCA9IG5ldyBEYXRlKCkudG9TdHJpbmcoKS5tYXRjaCgvKFtBLVpdK1tcXCstXVswLTldezJ9KShbMC05XXsyfSkvKTtcbiAgcmV0dXJuIG1hdGNoID8gYCgke21hdGNoWzFdfToke21hdGNoWzJdfSlgIDogJyc7XG59O1xuXG5leHBvcnQgY29uc3QgZ2V0Rm9ybWF0dGVkVGltZXpvbmUgPSAoKTogc3RyaW5nID0+IHtcbiAgcmV0dXJuIGAke2dldExvY2FsVGltZVpvbmUoKX0gJHtnZXRMb2NhbFRpbWVab25lT2Zmc2V0KCl9YDtcbn07XG5cbi8qKlxuICogRGVyaXZlIGEgc3RhYmxlIGlkZW50aWZpZXIgZm9yIGEgZm9ybSBlbGVtZW50LlxuICovXG5leHBvcnQgY29uc3QgZ2V0Rm9ybUlkZW50aWZpZXIgPSAoXG4gIHJvb3Q/OiBEb2N1bWVudCB8IEVsZW1lbnQgfCBIVE1MRm9ybUVsZW1lbnRcbik6IHN0cmluZyB8IHVuZGVmaW5lZCA9PiB7XG4gIHRyeSB7XG4gICAgbGV0IHRhcmdldEZvcm06IEVsZW1lbnQgfCBudWxsID0gbnVsbDtcblxuICAgIGlmICh0eXBlb2YgSFRNTEZvcm1FbGVtZW50ICE9PSAndW5kZWZpbmVkJyAmJiByb290IGluc3RhbmNlb2YgSFRNTEZvcm1FbGVtZW50KSB7XG4gICAgICB0YXJnZXRGb3JtID0gcm9vdCBhcyBIVE1MRm9ybUVsZW1lbnQ7XG4gICAgfSBlbHNlIGlmIChyb290ICYmICdxdWVyeVNlbGVjdG9yJyBpbiAocm9vdCBhcyBhbnkpKSB7XG4gICAgICB0YXJnZXRGb3JtID0gKHJvb3QgYXMgRG9jdW1lbnQgfCBFbGVtZW50KS5xdWVyeVNlbGVjdG9yKCdmb3JtJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRhcmdldEZvcm0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdmb3JtJyk7XG4gICAgfVxuXG4gICAgaWYgKCF0YXJnZXRGb3JtKSByZXR1cm4gdW5kZWZpbmVkO1xuXG4gICAgY29uc3QgaHRtbEZvcm0gPSB0YXJnZXRGb3JtIGFzIEhUTUxGb3JtRWxlbWVudDtcbiAgICByZXR1cm4gKFxuICAgICAgaHRtbEZvcm0ubmFtZSB8fFxuICAgICAgaHRtbEZvcm0uaWQgfHxcbiAgICAgIHRhcmdldEZvcm0uZ2V0QXR0cmlidXRlKCdhcmlhLWxhYmVsJykgfHxcbiAgICAgIHRhcmdldEZvcm0uZ2V0QXR0cmlidXRlKCdkYXRhLW5hbWUnKSB8fFxuICAgICAgJ1VuaWRlbnRpZmllZCBGb3JtJ1xuICAgICk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBsb2dnZXIuZXJyb3IoJ0Vycm9yIGdldHRpbmcgZm9ybSBpZGVudGlmaWVyOicsIGUpO1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbn07XG5cbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuY29uc3QgcGFyc2VfanNfMSA9IHJlcXVpcmUoXCIuL3BhcnNlLmpzXCIpO1xuY29uc3Qgc3RyaW5naWZ5X2pzXzEgPSByZXF1aXJlKFwiLi9zdHJpbmdpZnkuanNcIik7XG5mdW5jdGlvbiB2NlRvVjEodXVpZCkge1xuICAgIGNvbnN0IHY2Qnl0ZXMgPSB0eXBlb2YgdXVpZCA9PT0gJ3N0cmluZycgPyAoMCwgcGFyc2VfanNfMS5kZWZhdWx0KSh1dWlkKSA6IHV1aWQ7XG4gICAgY29uc3QgdjFCeXRlcyA9IF92NlRvVjEodjZCeXRlcyk7XG4gICAgcmV0dXJuIHR5cGVvZiB1dWlkID09PSAnc3RyaW5nJyA/ICgwLCBzdHJpbmdpZnlfanNfMS51bnNhZmVTdHJpbmdpZnkpKHYxQnl0ZXMpIDogdjFCeXRlcztcbn1cbmV4cG9ydHMuZGVmYXVsdCA9IHY2VG9WMTtcbmZ1bmN0aW9uIF92NlRvVjEodjZCeXRlcykge1xuICAgIHJldHVybiBVaW50OEFycmF5Lm9mKCgodjZCeXRlc1szXSAmIDB4MGYpIDw8IDQpIHwgKCh2NkJ5dGVzWzRdID4+IDQpICYgMHgwZiksICgodjZCeXRlc1s0XSAmIDB4MGYpIDw8IDQpIHwgKCh2NkJ5dGVzWzVdICYgMHhmMCkgPj4gNCksICgodjZCeXRlc1s1XSAmIDB4MGYpIDw8IDQpIHwgKHY2Qnl0ZXNbNl0gJiAweDBmKSwgdjZCeXRlc1s3XSwgKCh2NkJ5dGVzWzFdICYgMHgwZikgPDwgNCkgfCAoKHY2Qnl0ZXNbMl0gJiAweGYwKSA+PiA0KSwgKCh2NkJ5dGVzWzJdICYgMHgwZikgPDwgNCkgfCAoKHY2Qnl0ZXNbM10gJiAweGYwKSA+PiA0KSwgMHgxMCB8ICgodjZCeXRlc1swXSAmIDB4ZjApID4+IDQpLCAoKHY2Qnl0ZXNbMF0gJiAweDBmKSA8PCA0KSB8ICgodjZCeXRlc1sxXSAmIDB4ZjApID4+IDQpLCB2NkJ5dGVzWzhdLCB2NkJ5dGVzWzldLCB2NkJ5dGVzWzEwXSwgdjZCeXRlc1sxMV0sIHY2Qnl0ZXNbMTJdLCB2NkJ5dGVzWzEzXSwgdjZCeXRlc1sxNF0sIHY2Qnl0ZXNbMTVdKTtcbn1cbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuY29uc3QgbmF0aXZlX2pzXzEgPSByZXF1aXJlKFwiLi9uYXRpdmUuanNcIik7XG5jb25zdCBybmdfanNfMSA9IHJlcXVpcmUoXCIuL3JuZy5qc1wiKTtcbmNvbnN0IHN0cmluZ2lmeV9qc18xID0gcmVxdWlyZShcIi4vc3RyaW5naWZ5LmpzXCIpO1xuZnVuY3Rpb24gdjQob3B0aW9ucywgYnVmLCBvZmZzZXQpIHtcbiAgICBpZiAobmF0aXZlX2pzXzEuZGVmYXVsdC5yYW5kb21VVUlEICYmICFidWYgJiYgIW9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIG5hdGl2ZV9qc18xLmRlZmF1bHQucmFuZG9tVVVJRCgpO1xuICAgIH1cbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICBjb25zdCBybmRzID0gb3B0aW9ucy5yYW5kb20gPz8gb3B0aW9ucy5ybmc/LigpID8/ICgwLCBybmdfanNfMS5kZWZhdWx0KSgpO1xuICAgIGlmIChybmRzLmxlbmd0aCA8IDE2KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignUmFuZG9tIGJ5dGVzIGxlbmd0aCBtdXN0IGJlID49IDE2Jyk7XG4gICAgfVxuICAgIHJuZHNbNl0gPSAocm5kc1s2XSAmIDB4MGYpIHwgMHg0MDtcbiAgICBybmRzWzhdID0gKHJuZHNbOF0gJiAweDNmKSB8IDB4ODA7XG4gICAgaWYgKGJ1Zikge1xuICAgICAgICBvZmZzZXQgPSBvZmZzZXQgfHwgMDtcbiAgICAgICAgaWYgKG9mZnNldCA8IDAgfHwgb2Zmc2V0ICsgMTYgPiBidWYubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihgVVVJRCBieXRlIHJhbmdlICR7b2Zmc2V0fToke29mZnNldCArIDE1fSBpcyBvdXQgb2YgYnVmZmVyIGJvdW5kc2ApO1xuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTY7ICsraSkge1xuICAgICAgICAgICAgYnVmW29mZnNldCArIGldID0gcm5kc1tpXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYnVmO1xuICAgIH1cbiAgICByZXR1cm4gKDAsIHN0cmluZ2lmeV9qc18xLnVuc2FmZVN0cmluZ2lmeSkocm5kcyk7XG59XG5leHBvcnRzLmRlZmF1bHQgPSB2NDtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xubGV0IGdldFJhbmRvbVZhbHVlcztcbmNvbnN0IHJuZHM4ID0gbmV3IFVpbnQ4QXJyYXkoMTYpO1xuZnVuY3Rpb24gcm5nKCkge1xuICAgIGlmICghZ2V0UmFuZG9tVmFsdWVzKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY3J5cHRvID09PSAndW5kZWZpbmVkJyB8fCAhY3J5cHRvLmdldFJhbmRvbVZhbHVlcykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKCkgbm90IHN1cHBvcnRlZC4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS91dWlkanMvdXVpZCNnZXRyYW5kb212YWx1ZXMtbm90LXN1cHBvcnRlZCcpO1xuICAgICAgICB9XG4gICAgICAgIGdldFJhbmRvbVZhbHVlcyA9IGNyeXB0by5nZXRSYW5kb21WYWx1ZXMuYmluZChjcnlwdG8pO1xuICAgIH1cbiAgICByZXR1cm4gZ2V0UmFuZG9tVmFsdWVzKHJuZHM4KTtcbn1cbmV4cG9ydHMuZGVmYXVsdCA9IHJuZztcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy51cGRhdGVWN1N0YXRlID0gdm9pZCAwO1xuY29uc3Qgcm5nX2pzXzEgPSByZXF1aXJlKFwiLi9ybmcuanNcIik7XG5jb25zdCBzdHJpbmdpZnlfanNfMSA9IHJlcXVpcmUoXCIuL3N0cmluZ2lmeS5qc1wiKTtcbmNvbnN0IF9zdGF0ZSA9IHt9O1xuZnVuY3Rpb24gdjcob3B0aW9ucywgYnVmLCBvZmZzZXQpIHtcbiAgICBsZXQgYnl0ZXM7XG4gICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgICAgYnl0ZXMgPSB2N0J5dGVzKG9wdGlvbnMucmFuZG9tID8/IG9wdGlvbnMucm5nPy4oKSA/PyAoMCwgcm5nX2pzXzEuZGVmYXVsdCkoKSwgb3B0aW9ucy5tc2Vjcywgb3B0aW9ucy5zZXEsIGJ1Ziwgb2Zmc2V0KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gICAgICAgIGNvbnN0IHJuZHMgPSAoMCwgcm5nX2pzXzEuZGVmYXVsdCkoKTtcbiAgICAgICAgdXBkYXRlVjdTdGF0ZShfc3RhdGUsIG5vdywgcm5kcyk7XG4gICAgICAgIGJ5dGVzID0gdjdCeXRlcyhybmRzLCBfc3RhdGUubXNlY3MsIF9zdGF0ZS5zZXEsIGJ1Ziwgb2Zmc2V0KTtcbiAgICB9XG4gICAgcmV0dXJuIGJ1ZiA/PyAoMCwgc3RyaW5naWZ5X2pzXzEudW5zYWZlU3RyaW5naWZ5KShieXRlcyk7XG59XG5mdW5jdGlvbiB1cGRhdGVWN1N0YXRlKHN0YXRlLCBub3csIHJuZHMpIHtcbiAgICBzdGF0ZS5tc2VjcyA/Pz0gLUluZmluaXR5O1xuICAgIHN0YXRlLnNlcSA/Pz0gMDtcbiAgICBpZiAobm93ID4gc3RhdGUubXNlY3MpIHtcbiAgICAgICAgc3RhdGUuc2VxID0gKHJuZHNbNl0gPDwgMjMpIHwgKHJuZHNbN10gPDwgMTYpIHwgKHJuZHNbOF0gPDwgOCkgfCBybmRzWzldO1xuICAgICAgICBzdGF0ZS5tc2VjcyA9IG5vdztcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHN0YXRlLnNlcSA9IChzdGF0ZS5zZXEgKyAxKSB8IDA7XG4gICAgICAgIGlmIChzdGF0ZS5zZXEgPT09IDApIHtcbiAgICAgICAgICAgIHN0YXRlLm1zZWNzKys7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHN0YXRlO1xufVxuZXhwb3J0cy51cGRhdGVWN1N0YXRlID0gdXBkYXRlVjdTdGF0ZTtcbmZ1bmN0aW9uIHY3Qnl0ZXMocm5kcywgbXNlY3MsIHNlcSwgYnVmLCBvZmZzZXQgPSAwKSB7XG4gICAgaWYgKHJuZHMubGVuZ3RoIDwgMTYpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdSYW5kb20gYnl0ZXMgbGVuZ3RoIG11c3QgYmUgPj0gMTYnKTtcbiAgICB9XG4gICAgaWYgKCFidWYpIHtcbiAgICAgICAgYnVmID0gbmV3IFVpbnQ4QXJyYXkoMTYpO1xuICAgICAgICBvZmZzZXQgPSAwO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaWYgKG9mZnNldCA8IDAgfHwgb2Zmc2V0ICsgMTYgPiBidWYubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihgVVVJRCBieXRlIHJhbmdlICR7b2Zmc2V0fToke29mZnNldCArIDE1fSBpcyBvdXQgb2YgYnVmZmVyIGJvdW5kc2ApO1xuICAgICAgICB9XG4gICAgfVxuICAgIG1zZWNzID8/PSBEYXRlLm5vdygpO1xuICAgIHNlcSA/Pz0gKChybmRzWzZdICogMHg3ZikgPDwgMjQpIHwgKHJuZHNbN10gPDwgMTYpIHwgKHJuZHNbOF0gPDwgOCkgfCBybmRzWzldO1xuICAgIGJ1ZltvZmZzZXQrK10gPSAobXNlY3MgLyAweDEwMDAwMDAwMDAwKSAmIDB4ZmY7XG4gICAgYnVmW29mZnNldCsrXSA9IChtc2VjcyAvIDB4MTAwMDAwMDAwKSAmIDB4ZmY7XG4gICAgYnVmW29mZnNldCsrXSA9IChtc2VjcyAvIDB4MTAwMDAwMCkgJiAweGZmO1xuICAgIGJ1ZltvZmZzZXQrK10gPSAobXNlY3MgLyAweDEwMDAwKSAmIDB4ZmY7XG4gICAgYnVmW29mZnNldCsrXSA9IChtc2VjcyAvIDB4MTAwKSAmIDB4ZmY7XG4gICAgYnVmW29mZnNldCsrXSA9IG1zZWNzICYgMHhmZjtcbiAgICBidWZbb2Zmc2V0KytdID0gMHg3MCB8ICgoc2VxID4+PiAyOCkgJiAweDBmKTtcbiAgICBidWZbb2Zmc2V0KytdID0gKHNlcSA+Pj4gMjApICYgMHhmZjtcbiAgICBidWZbb2Zmc2V0KytdID0gMHg4MCB8ICgoc2VxID4+PiAxNCkgJiAweDNmKTtcbiAgICBidWZbb2Zmc2V0KytdID0gKHNlcSA+Pj4gNikgJiAweGZmO1xuICAgIGJ1ZltvZmZzZXQrK10gPSAoKHNlcSA8PCAyKSAmIDB4ZmYpIHwgKHJuZHNbMTBdICYgMHgwMyk7XG4gICAgYnVmW29mZnNldCsrXSA9IHJuZHNbMTFdO1xuICAgIGJ1ZltvZmZzZXQrK10gPSBybmRzWzEyXTtcbiAgICBidWZbb2Zmc2V0KytdID0gcm5kc1sxM107XG4gICAgYnVmW29mZnNldCsrXSA9IHJuZHNbMTRdO1xuICAgIGJ1ZltvZmZzZXQrK10gPSBybmRzWzE1XTtcbiAgICByZXR1cm4gYnVmO1xufVxuZXhwb3J0cy5kZWZhdWx0ID0gdjc7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmZ1bmN0aW9uIG1kNShieXRlcykge1xuICAgIGNvbnN0IHdvcmRzID0gdWludDhUb1VpbnQzMihieXRlcyk7XG4gICAgY29uc3QgbWQ1Qnl0ZXMgPSB3b3Jkc1RvTWQ1KHdvcmRzLCBieXRlcy5sZW5ndGggKiA4KTtcbiAgICByZXR1cm4gdWludDMyVG9VaW50OChtZDVCeXRlcyk7XG59XG5mdW5jdGlvbiB1aW50MzJUb1VpbnQ4KGlucHV0KSB7XG4gICAgY29uc3QgYnl0ZXMgPSBuZXcgVWludDhBcnJheShpbnB1dC5sZW5ndGggKiA0KTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGlucHV0Lmxlbmd0aCAqIDQ7IGkrKykge1xuICAgICAgICBieXRlc1tpXSA9IChpbnB1dFtpID4+IDJdID4+PiAoKGkgJSA0KSAqIDgpKSAmIDB4ZmY7XG4gICAgfVxuICAgIHJldHVybiBieXRlcztcbn1cbmZ1bmN0aW9uIGdldE91dHB1dExlbmd0aChpbnB1dExlbmd0aDgpIHtcbiAgICByZXR1cm4gKCgoaW5wdXRMZW5ndGg4ICsgNjQpID4+PiA5KSA8PCA0KSArIDE0ICsgMTtcbn1cbmZ1bmN0aW9uIHdvcmRzVG9NZDUoeCwgbGVuKSB7XG4gICAgY29uc3QgeHBhZCA9IG5ldyBVaW50MzJBcnJheShnZXRPdXRwdXRMZW5ndGgobGVuKSkuZmlsbCgwKTtcbiAgICB4cGFkLnNldCh4KTtcbiAgICB4cGFkW2xlbiA+PiA1XSB8PSAweDgwIDw8IGxlbiAlIDMyO1xuICAgIHhwYWRbeHBhZC5sZW5ndGggLSAxXSA9IGxlbjtcbiAgICB4ID0geHBhZDtcbiAgICBsZXQgYSA9IDE3MzI1ODQxOTM7XG4gICAgbGV0IGIgPSAtMjcxNzMzODc5O1xuICAgIGxldCBjID0gLTE3MzI1ODQxOTQ7XG4gICAgbGV0IGQgPSAyNzE3MzM4Nzg7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB4Lmxlbmd0aDsgaSArPSAxNikge1xuICAgICAgICBjb25zdCBvbGRhID0gYTtcbiAgICAgICAgY29uc3Qgb2xkYiA9IGI7XG4gICAgICAgIGNvbnN0IG9sZGMgPSBjO1xuICAgICAgICBjb25zdCBvbGRkID0gZDtcbiAgICAgICAgYSA9IG1kNWZmKGEsIGIsIGMsIGQsIHhbaV0sIDcsIC02ODA4NzY5MzYpO1xuICAgICAgICBkID0gbWQ1ZmYoZCwgYSwgYiwgYywgeFtpICsgMV0sIDEyLCAtMzg5NTY0NTg2KTtcbiAgICAgICAgYyA9IG1kNWZmKGMsIGQsIGEsIGIsIHhbaSArIDJdLCAxNywgNjA2MTA1ODE5KTtcbiAgICAgICAgYiA9IG1kNWZmKGIsIGMsIGQsIGEsIHhbaSArIDNdLCAyMiwgLTEwNDQ1MjUzMzApO1xuICAgICAgICBhID0gbWQ1ZmYoYSwgYiwgYywgZCwgeFtpICsgNF0sIDcsIC0xNzY0MTg4OTcpO1xuICAgICAgICBkID0gbWQ1ZmYoZCwgYSwgYiwgYywgeFtpICsgNV0sIDEyLCAxMjAwMDgwNDI2KTtcbiAgICAgICAgYyA9IG1kNWZmKGMsIGQsIGEsIGIsIHhbaSArIDZdLCAxNywgLTE0NzMyMzEzNDEpO1xuICAgICAgICBiID0gbWQ1ZmYoYiwgYywgZCwgYSwgeFtpICsgN10sIDIyLCAtNDU3MDU5ODMpO1xuICAgICAgICBhID0gbWQ1ZmYoYSwgYiwgYywgZCwgeFtpICsgOF0sIDcsIDE3NzAwMzU0MTYpO1xuICAgICAgICBkID0gbWQ1ZmYoZCwgYSwgYiwgYywgeFtpICsgOV0sIDEyLCAtMTk1ODQxNDQxNyk7XG4gICAgICAgIGMgPSBtZDVmZihjLCBkLCBhLCBiLCB4W2kgKyAxMF0sIDE3LCAtNDIwNjMpO1xuICAgICAgICBiID0gbWQ1ZmYoYiwgYywgZCwgYSwgeFtpICsgMTFdLCAyMiwgLTE5OTA0MDQxNjIpO1xuICAgICAgICBhID0gbWQ1ZmYoYSwgYiwgYywgZCwgeFtpICsgMTJdLCA3LCAxODA0NjAzNjgyKTtcbiAgICAgICAgZCA9IG1kNWZmKGQsIGEsIGIsIGMsIHhbaSArIDEzXSwgMTIsIC00MDM0MTEwMSk7XG4gICAgICAgIGMgPSBtZDVmZihjLCBkLCBhLCBiLCB4W2kgKyAxNF0sIDE3LCAtMTUwMjAwMjI5MCk7XG4gICAgICAgIGIgPSBtZDVmZihiLCBjLCBkLCBhLCB4W2kgKyAxNV0sIDIyLCAxMjM2NTM1MzI5KTtcbiAgICAgICAgYSA9IG1kNWdnKGEsIGIsIGMsIGQsIHhbaSArIDFdLCA1LCAtMTY1Nzk2NTEwKTtcbiAgICAgICAgZCA9IG1kNWdnKGQsIGEsIGIsIGMsIHhbaSArIDZdLCA5LCAtMTA2OTUwMTYzMik7XG4gICAgICAgIGMgPSBtZDVnZyhjLCBkLCBhLCBiLCB4W2kgKyAxMV0sIDE0LCA2NDM3MTc3MTMpO1xuICAgICAgICBiID0gbWQ1Z2coYiwgYywgZCwgYSwgeFtpXSwgMjAsIC0zNzM4OTczMDIpO1xuICAgICAgICBhID0gbWQ1Z2coYSwgYiwgYywgZCwgeFtpICsgNV0sIDUsIC03MDE1NTg2OTEpO1xuICAgICAgICBkID0gbWQ1Z2coZCwgYSwgYiwgYywgeFtpICsgMTBdLCA5LCAzODAxNjA4Myk7XG4gICAgICAgIGMgPSBtZDVnZyhjLCBkLCBhLCBiLCB4W2kgKyAxNV0sIDE0LCAtNjYwNDc4MzM1KTtcbiAgICAgICAgYiA9IG1kNWdnKGIsIGMsIGQsIGEsIHhbaSArIDRdLCAyMCwgLTQwNTUzNzg0OCk7XG4gICAgICAgIGEgPSBtZDVnZyhhLCBiLCBjLCBkLCB4W2kgKyA5XSwgNSwgNTY4NDQ2NDM4KTtcbiAgICAgICAgZCA9IG1kNWdnKGQsIGEsIGIsIGMsIHhbaSArIDE0XSwgOSwgLTEwMTk4MDM2OTApO1xuICAgICAgICBjID0gbWQ1Z2coYywgZCwgYSwgYiwgeFtpICsgM10sIDE0LCAtMTg3MzYzOTYxKTtcbiAgICAgICAgYiA9IG1kNWdnKGIsIGMsIGQsIGEsIHhbaSArIDhdLCAyMCwgMTE2MzUzMTUwMSk7XG4gICAgICAgIGEgPSBtZDVnZyhhLCBiLCBjLCBkLCB4W2kgKyAxM10sIDUsIC0xNDQ0NjgxNDY3KTtcbiAgICAgICAgZCA9IG1kNWdnKGQsIGEsIGIsIGMsIHhbaSArIDJdLCA5LCAtNTE0MDM3ODQpO1xuICAgICAgICBjID0gbWQ1Z2coYywgZCwgYSwgYiwgeFtpICsgN10sIDE0LCAxNzM1MzI4NDczKTtcbiAgICAgICAgYiA9IG1kNWdnKGIsIGMsIGQsIGEsIHhbaSArIDEyXSwgMjAsIC0xOTI2NjA3NzM0KTtcbiAgICAgICAgYSA9IG1kNWhoKGEsIGIsIGMsIGQsIHhbaSArIDVdLCA0LCAtMzc4NTU4KTtcbiAgICAgICAgZCA9IG1kNWhoKGQsIGEsIGIsIGMsIHhbaSArIDhdLCAxMSwgLTIwMjI1NzQ0NjMpO1xuICAgICAgICBjID0gbWQ1aGgoYywgZCwgYSwgYiwgeFtpICsgMTFdLCAxNiwgMTgzOTAzMDU2Mik7XG4gICAgICAgIGIgPSBtZDVoaChiLCBjLCBkLCBhLCB4W2kgKyAxNF0sIDIzLCAtMzUzMDk1NTYpO1xuICAgICAgICBhID0gbWQ1aGgoYSwgYiwgYywgZCwgeFtpICsgMV0sIDQsIC0xNTMwOTkyMDYwKTtcbiAgICAgICAgZCA9IG1kNWhoKGQsIGEsIGIsIGMsIHhbaSArIDRdLCAxMSwgMTI3Mjg5MzM1Myk7XG4gICAgICAgIGMgPSBtZDVoaChjLCBkLCBhLCBiLCB4W2kgKyA3XSwgMTYsIC0xNTU0OTc2MzIpO1xuICAgICAgICBiID0gbWQ1aGgoYiwgYywgZCwgYSwgeFtpICsgMTBdLCAyMywgLTEwOTQ3MzA2NDApO1xuICAgICAgICBhID0gbWQ1aGgoYSwgYiwgYywgZCwgeFtpICsgMTNdLCA0LCA2ODEyNzkxNzQpO1xuICAgICAgICBkID0gbWQ1aGgoZCwgYSwgYiwgYywgeFtpXSwgMTEsIC0zNTg1MzcyMjIpO1xuICAgICAgICBjID0gbWQ1aGgoYywgZCwgYSwgYiwgeFtpICsgM10sIDE2LCAtNzIyNTIxOTc5KTtcbiAgICAgICAgYiA9IG1kNWhoKGIsIGMsIGQsIGEsIHhbaSArIDZdLCAyMywgNzYwMjkxODkpO1xuICAgICAgICBhID0gbWQ1aGgoYSwgYiwgYywgZCwgeFtpICsgOV0sIDQsIC02NDAzNjQ0ODcpO1xuICAgICAgICBkID0gbWQ1aGgoZCwgYSwgYiwgYywgeFtpICsgMTJdLCAxMSwgLTQyMTgxNTgzNSk7XG4gICAgICAgIGMgPSBtZDVoaChjLCBkLCBhLCBiLCB4W2kgKyAxNV0sIDE2LCA1MzA3NDI1MjApO1xuICAgICAgICBiID0gbWQ1aGgoYiwgYywgZCwgYSwgeFtpICsgMl0sIDIzLCAtOTk1MzM4NjUxKTtcbiAgICAgICAgYSA9IG1kNWlpKGEsIGIsIGMsIGQsIHhbaV0sIDYsIC0xOTg2MzA4NDQpO1xuICAgICAgICBkID0gbWQ1aWkoZCwgYSwgYiwgYywgeFtpICsgN10sIDEwLCAxMTI2ODkxNDE1KTtcbiAgICAgICAgYyA9IG1kNWlpKGMsIGQsIGEsIGIsIHhbaSArIDE0XSwgMTUsIC0xNDE2MzU0OTA1KTtcbiAgICAgICAgYiA9IG1kNWlpKGIsIGMsIGQsIGEsIHhbaSArIDVdLCAyMSwgLTU3NDM0MDU1KTtcbiAgICAgICAgYSA9IG1kNWlpKGEsIGIsIGMsIGQsIHhbaSArIDEyXSwgNiwgMTcwMDQ4NTU3MSk7XG4gICAgICAgIGQgPSBtZDVpaShkLCBhLCBiLCBjLCB4W2kgKyAzXSwgMTAsIC0xODk0OTg2NjA2KTtcbiAgICAgICAgYyA9IG1kNWlpKGMsIGQsIGEsIGIsIHhbaSArIDEwXSwgMTUsIC0xMDUxNTIzKTtcbiAgICAgICAgYiA9IG1kNWlpKGIsIGMsIGQsIGEsIHhbaSArIDFdLCAyMSwgLTIwNTQ5MjI3OTkpO1xuICAgICAgICBhID0gbWQ1aWkoYSwgYiwgYywgZCwgeFtpICsgOF0sIDYsIDE4NzMzMTMzNTkpO1xuICAgICAgICBkID0gbWQ1aWkoZCwgYSwgYiwgYywgeFtpICsgMTVdLCAxMCwgLTMwNjExNzQ0KTtcbiAgICAgICAgYyA9IG1kNWlpKGMsIGQsIGEsIGIsIHhbaSArIDZdLCAxNSwgLTE1NjAxOTgzODApO1xuICAgICAgICBiID0gbWQ1aWkoYiwgYywgZCwgYSwgeFtpICsgMTNdLCAyMSwgMTMwOTE1MTY0OSk7XG4gICAgICAgIGEgPSBtZDVpaShhLCBiLCBjLCBkLCB4W2kgKyA0XSwgNiwgLTE0NTUyMzA3MCk7XG4gICAgICAgIGQgPSBtZDVpaShkLCBhLCBiLCBjLCB4W2kgKyAxMV0sIDEwLCAtMTEyMDIxMDM3OSk7XG4gICAgICAgIGMgPSBtZDVpaShjLCBkLCBhLCBiLCB4W2kgKyAyXSwgMTUsIDcxODc4NzI1OSk7XG4gICAgICAgIGIgPSBtZDVpaShiLCBjLCBkLCBhLCB4W2kgKyA5XSwgMjEsIC0zNDM0ODU1NTEpO1xuICAgICAgICBhID0gc2FmZUFkZChhLCBvbGRhKTtcbiAgICAgICAgYiA9IHNhZmVBZGQoYiwgb2xkYik7XG4gICAgICAgIGMgPSBzYWZlQWRkKGMsIG9sZGMpO1xuICAgICAgICBkID0gc2FmZUFkZChkLCBvbGRkKTtcbiAgICB9XG4gICAgcmV0dXJuIFVpbnQzMkFycmF5Lm9mKGEsIGIsIGMsIGQpO1xufVxuZnVuY3Rpb24gdWludDhUb1VpbnQzMihpbnB1dCkge1xuICAgIGlmIChpbnB1dC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIG5ldyBVaW50MzJBcnJheSgpO1xuICAgIH1cbiAgICBjb25zdCBvdXRwdXQgPSBuZXcgVWludDMyQXJyYXkoZ2V0T3V0cHV0TGVuZ3RoKGlucHV0Lmxlbmd0aCAqIDgpKS5maWxsKDApO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5wdXQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgb3V0cHV0W2kgPj4gMl0gfD0gKGlucHV0W2ldICYgMHhmZikgPDwgKChpICUgNCkgKiA4KTtcbiAgICB9XG4gICAgcmV0dXJuIG91dHB1dDtcbn1cbmZ1bmN0aW9uIHNhZmVBZGQoeCwgeSkge1xuICAgIGNvbnN0IGxzdyA9ICh4ICYgMHhmZmZmKSArICh5ICYgMHhmZmZmKTtcbiAgICBjb25zdCBtc3cgPSAoeCA+PiAxNikgKyAoeSA+PiAxNikgKyAobHN3ID4+IDE2KTtcbiAgICByZXR1cm4gKG1zdyA8PCAxNikgfCAobHN3ICYgMHhmZmZmKTtcbn1cbmZ1bmN0aW9uIGJpdFJvdGF0ZUxlZnQobnVtLCBjbnQpIHtcbiAgICByZXR1cm4gKG51bSA8PCBjbnQpIHwgKG51bSA+Pj4gKDMyIC0gY250KSk7XG59XG5mdW5jdGlvbiBtZDVjbW4ocSwgYSwgYiwgeCwgcywgdCkge1xuICAgIHJldHVybiBzYWZlQWRkKGJpdFJvdGF0ZUxlZnQoc2FmZUFkZChzYWZlQWRkKGEsIHEpLCBzYWZlQWRkKHgsIHQpKSwgcyksIGIpO1xufVxuZnVuY3Rpb24gbWQ1ZmYoYSwgYiwgYywgZCwgeCwgcywgdCkge1xuICAgIHJldHVybiBtZDVjbW4oKGIgJiBjKSB8ICh+YiAmIGQpLCBhLCBiLCB4LCBzLCB0KTtcbn1cbmZ1bmN0aW9uIG1kNWdnKGEsIGIsIGMsIGQsIHgsIHMsIHQpIHtcbiAgICByZXR1cm4gbWQ1Y21uKChiICYgZCkgfCAoYyAmIH5kKSwgYSwgYiwgeCwgcywgdCk7XG59XG5mdW5jdGlvbiBtZDVoaChhLCBiLCBjLCBkLCB4LCBzLCB0KSB7XG4gICAgcmV0dXJuIG1kNWNtbihiIF4gYyBeIGQsIGEsIGIsIHgsIHMsIHQpO1xufVxuZnVuY3Rpb24gbWQ1aWkoYSwgYiwgYywgZCwgeCwgcywgdCkge1xuICAgIHJldHVybiBtZDVjbW4oYyBeIChiIHwgfmQpLCBhLCBiLCB4LCBzLCB0KTtcbn1cbmV4cG9ydHMuZGVmYXVsdCA9IG1kNTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuY29uc3Qgc3RyaW5naWZ5X2pzXzEgPSByZXF1aXJlKFwiLi9zdHJpbmdpZnkuanNcIik7XG5jb25zdCB2MV9qc18xID0gcmVxdWlyZShcIi4vdjEuanNcIik7XG5jb25zdCB2MVRvVjZfanNfMSA9IHJlcXVpcmUoXCIuL3YxVG9WNi5qc1wiKTtcbmZ1bmN0aW9uIHY2KG9wdGlvbnMsIGJ1Ziwgb2Zmc2V0KSB7XG4gICAgb3B0aW9ucyA/Pz0ge307XG4gICAgb2Zmc2V0ID8/PSAwO1xuICAgIGxldCBieXRlcyA9ICgwLCB2MV9qc18xLmRlZmF1bHQpKHsgLi4ub3B0aW9ucywgX3Y2OiB0cnVlIH0sIG5ldyBVaW50OEFycmF5KDE2KSk7XG4gICAgYnl0ZXMgPSAoMCwgdjFUb1Y2X2pzXzEuZGVmYXVsdCkoYnl0ZXMpO1xuICAgIGlmIChidWYpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAxNjsgaSsrKSB7XG4gICAgICAgICAgICBidWZbb2Zmc2V0ICsgaV0gPSBieXRlc1tpXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYnVmO1xuICAgIH1cbiAgICByZXR1cm4gKDAsIHN0cmluZ2lmeV9qc18xLnVuc2FmZVN0cmluZ2lmeSkoYnl0ZXMpO1xufVxuZXhwb3J0cy5kZWZhdWx0ID0gdjY7XG4iLCIvKiogVXRpbGl0eTogY2FzZS1pbnNlbnNpdGl2ZSBjaGVjayBmb3IgdGhlIHdvcmQgXCJwYXNzd29yZFwiIHVzaW5nIG9wdGlvbmFsIGNoYWluaW5nICovXG5leHBvcnQgY29uc3QgY29udGFpbnNQYXNzd29yZCA9ICh2YWw/OiBzdHJpbmcgfCBudWxsKTogYm9vbGVhbiA9PiB7XG4gIHRyeSB7XG4gICAgcmV0dXJuICEhdmFsPy50b0xvd2VyQ2FzZT8uKCkuaW5jbHVkZXM/LigncGFzc3dvcmQnKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59O1xuXG4vKipcbiAqIERldGVybWluZSBpZiBhIGZpZWxkIHNob3VsZCBiZSB0cmVhdGVkIGFzIHBhc3N3b3JkLWxpa2UuXG4gKiBFdmFsdWF0ZXMgaW5wdXQudHlwZSwgaW5wdXQubmFtZSwgaW5wdXQuaWQsIGlucHV0LnBsYWNlaG9sZGVyIGFuZCBvcHRpb25hbCBsYWJlbCB0ZXh0LlxuICovXG5leHBvcnQgY29uc3QgaXNQYXNzd29yZExpa2VGaWVsZCA9IChcbiAgaW5wdXQ6IEhUTUxJbnB1dEVsZW1lbnQgfCBIVE1MU2VsZWN0RWxlbWVudCB8IEhUTUxUZXh0QXJlYUVsZW1lbnQsXG4gIGxhYmVsVGV4dD86IHN0cmluZyB8IG51bGxcbik6IGJvb2xlYW4gPT4ge1xuICByZXR1cm4gKFxuICAgIGNvbnRhaW5zUGFzc3dvcmQoKGlucHV0IGFzIGFueSk/LnR5cGUpIHx8XG4gICAgY29udGFpbnNQYXNzd29yZCgoaW5wdXQgYXMgYW55KT8ubmFtZSkgfHxcbiAgICBjb250YWluc1Bhc3N3b3JkKChpbnB1dCBhcyBhbnkpPy5pZCkgfHxcbiAgICBjb250YWluc1Bhc3N3b3JkKChpbnB1dCBhcyBhbnkpPy5wbGFjZWhvbGRlcikgfHxcbiAgICBjb250YWluc1Bhc3N3b3JkKGxhYmVsVGV4dClcbiAgKTtcbn07XG5cbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy51cGRhdGVWMVN0YXRlID0gdm9pZCAwO1xuY29uc3Qgcm5nX2pzXzEgPSByZXF1aXJlKFwiLi9ybmcuanNcIik7XG5jb25zdCBzdHJpbmdpZnlfanNfMSA9IHJlcXVpcmUoXCIuL3N0cmluZ2lmeS5qc1wiKTtcbmNvbnN0IF9zdGF0ZSA9IHt9O1xuZnVuY3Rpb24gdjEob3B0aW9ucywgYnVmLCBvZmZzZXQpIHtcbiAgICBsZXQgYnl0ZXM7XG4gICAgY29uc3QgaXNWNiA9IG9wdGlvbnM/Ll92NiA/PyBmYWxzZTtcbiAgICBpZiAob3B0aW9ucykge1xuICAgICAgICBjb25zdCBvcHRpb25zS2V5cyA9IE9iamVjdC5rZXlzKG9wdGlvbnMpO1xuICAgICAgICBpZiAob3B0aW9uc0tleXMubGVuZ3RoID09PSAxICYmIG9wdGlvbnNLZXlzWzBdID09PSAnX3Y2Jykge1xuICAgICAgICAgICAgb3B0aW9ucyA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAob3B0aW9ucykge1xuICAgICAgICBieXRlcyA9IHYxQnl0ZXMob3B0aW9ucy5yYW5kb20gPz8gb3B0aW9ucy5ybmc/LigpID8/ICgwLCBybmdfanNfMS5kZWZhdWx0KSgpLCBvcHRpb25zLm1zZWNzLCBvcHRpb25zLm5zZWNzLCBvcHRpb25zLmNsb2Nrc2VxLCBvcHRpb25zLm5vZGUsIGJ1Ziwgb2Zmc2V0KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gICAgICAgIGNvbnN0IHJuZHMgPSAoMCwgcm5nX2pzXzEuZGVmYXVsdCkoKTtcbiAgICAgICAgdXBkYXRlVjFTdGF0ZShfc3RhdGUsIG5vdywgcm5kcyk7XG4gICAgICAgIGJ5dGVzID0gdjFCeXRlcyhybmRzLCBfc3RhdGUubXNlY3MsIF9zdGF0ZS5uc2VjcywgaXNWNiA/IHVuZGVmaW5lZCA6IF9zdGF0ZS5jbG9ja3NlcSwgaXNWNiA/IHVuZGVmaW5lZCA6IF9zdGF0ZS5ub2RlLCBidWYsIG9mZnNldCk7XG4gICAgfVxuICAgIHJldHVybiBidWYgPz8gKDAsIHN0cmluZ2lmeV9qc18xLnVuc2FmZVN0cmluZ2lmeSkoYnl0ZXMpO1xufVxuZnVuY3Rpb24gdXBkYXRlVjFTdGF0ZShzdGF0ZSwgbm93LCBybmRzKSB7XG4gICAgc3RhdGUubXNlY3MgPz89IC1JbmZpbml0eTtcbiAgICBzdGF0ZS5uc2VjcyA/Pz0gMDtcbiAgICBpZiAobm93ID09PSBzdGF0ZS5tc2Vjcykge1xuICAgICAgICBzdGF0ZS5uc2VjcysrO1xuICAgICAgICBpZiAoc3RhdGUubnNlY3MgPj0gMTAwMDApIHtcbiAgICAgICAgICAgIHN0YXRlLm5vZGUgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBzdGF0ZS5uc2VjcyA9IDA7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAobm93ID4gc3RhdGUubXNlY3MpIHtcbiAgICAgICAgc3RhdGUubnNlY3MgPSAwO1xuICAgIH1cbiAgICBlbHNlIGlmIChub3cgPCBzdGF0ZS5tc2Vjcykge1xuICAgICAgICBzdGF0ZS5ub2RlID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpZiAoIXN0YXRlLm5vZGUpIHtcbiAgICAgICAgc3RhdGUubm9kZSA9IHJuZHMuc2xpY2UoMTAsIDE2KTtcbiAgICAgICAgc3RhdGUubm9kZVswXSB8PSAweDAxO1xuICAgICAgICBzdGF0ZS5jbG9ja3NlcSA9ICgocm5kc1s4XSA8PCA4KSB8IHJuZHNbOV0pICYgMHgzZmZmO1xuICAgIH1cbiAgICBzdGF0ZS5tc2VjcyA9IG5vdztcbiAgICByZXR1cm4gc3RhdGU7XG59XG5leHBvcnRzLnVwZGF0ZVYxU3RhdGUgPSB1cGRhdGVWMVN0YXRlO1xuZnVuY3Rpb24gdjFCeXRlcyhybmRzLCBtc2VjcywgbnNlY3MsIGNsb2Nrc2VxLCBub2RlLCBidWYsIG9mZnNldCA9IDApIHtcbiAgICBpZiAocm5kcy5sZW5ndGggPCAxNikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1JhbmRvbSBieXRlcyBsZW5ndGggbXVzdCBiZSA+PSAxNicpO1xuICAgIH1cbiAgICBpZiAoIWJ1Zikge1xuICAgICAgICBidWYgPSBuZXcgVWludDhBcnJheSgxNik7XG4gICAgICAgIG9mZnNldCA9IDA7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBpZiAob2Zmc2V0IDwgMCB8fCBvZmZzZXQgKyAxNiA+IGJ1Zi5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKGBVVUlEIGJ5dGUgcmFuZ2UgJHtvZmZzZXR9OiR7b2Zmc2V0ICsgMTV9IGlzIG91dCBvZiBidWZmZXIgYm91bmRzYCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgbXNlY3MgPz89IERhdGUubm93KCk7XG4gICAgbnNlY3MgPz89IDA7XG4gICAgY2xvY2tzZXEgPz89ICgocm5kc1s4XSA8PCA4KSB8IHJuZHNbOV0pICYgMHgzZmZmO1xuICAgIG5vZGUgPz89IHJuZHMuc2xpY2UoMTAsIDE2KTtcbiAgICBtc2VjcyArPSAxMjIxOTI5MjgwMDAwMDtcbiAgICBjb25zdCB0bCA9ICgobXNlY3MgJiAweGZmZmZmZmYpICogMTAwMDAgKyBuc2VjcykgJSAweDEwMDAwMDAwMDtcbiAgICBidWZbb2Zmc2V0KytdID0gKHRsID4+PiAyNCkgJiAweGZmO1xuICAgIGJ1ZltvZmZzZXQrK10gPSAodGwgPj4+IDE2KSAmIDB4ZmY7XG4gICAgYnVmW29mZnNldCsrXSA9ICh0bCA+Pj4gOCkgJiAweGZmO1xuICAgIGJ1ZltvZmZzZXQrK10gPSB0bCAmIDB4ZmY7XG4gICAgY29uc3QgdG1oID0gKChtc2VjcyAvIDB4MTAwMDAwMDAwKSAqIDEwMDAwKSAmIDB4ZmZmZmZmZjtcbiAgICBidWZbb2Zmc2V0KytdID0gKHRtaCA+Pj4gOCkgJiAweGZmO1xuICAgIGJ1ZltvZmZzZXQrK10gPSB0bWggJiAweGZmO1xuICAgIGJ1ZltvZmZzZXQrK10gPSAoKHRtaCA+Pj4gMjQpICYgMHhmKSB8IDB4MTA7XG4gICAgYnVmW29mZnNldCsrXSA9ICh0bWggPj4+IDE2KSAmIDB4ZmY7XG4gICAgYnVmW29mZnNldCsrXSA9IChjbG9ja3NlcSA+Pj4gOCkgfCAweDgwO1xuICAgIGJ1ZltvZmZzZXQrK10gPSBjbG9ja3NlcSAmIDB4ZmY7XG4gICAgZm9yIChsZXQgbiA9IDA7IG4gPCA2OyArK24pIHtcbiAgICAgICAgYnVmW29mZnNldCsrXSA9IG5vZGVbbl07XG4gICAgfVxuICAgIHJldHVybiBidWY7XG59XG5leHBvcnRzLmRlZmF1bHQgPSB2MTtcbiIsImltcG9ydCB7XG4gIFRyYWNraW5nSWRSZXNwb25zZSxcbiAgVHJhY2tpbmdFdmVudCxcbiAgRm9ybVN1Ym1pc3Npb25FdmVudCxcbiAgRXZlbnRUeXBlLFxufSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCB7XG4gIGxvZ2dlcixcbiAgZ2V0U2Vzc2lvbklkRnJvbUNvb2tpZSxcbiAgZ2V0VXNlckRhdGEsXG4gIGdldEZvcm1hdHRlZFRpbWV6b25lLFxufSBmcm9tIFwiLi4vdXRpbHNcIjtcbmltcG9ydCB7IEV2ZW50UXVldWUsIFF1ZXVlQ29uZmlnIH0gZnJvbSBcIi4uL2NvcmUvcXVldWUtc3lzdGVtXCI7XG5pbXBvcnQgeyBBUElfRU5EUE9JTlRTLCBTQ1JJUFRfQkFTRU5BTUUgfSBmcm9tIFwiLi4vY29uZmlnL2NvbW1vblwiO1xuXG4vLyBCb3QgcHJldmVudGlvbiBjb25zdGFudHNcbmNvbnN0IFJBVEVfTElNSVRfRVZFTlRTX1BFUl9TRUNPTkQgPSA1O1xuXG4vKipcbiAqIEFQSSBDbGllbnQgZm9yIGV4dGVybmFsIHRyYWNraW5nXG4gKi9cbmV4cG9ydCBjbGFzcyBBcGlDbGllbnQge1xuICBwcml2YXRlIGFwaUVuZHBvaW50OiBzdHJpbmc7XG4gIHByaXZhdGUgdHJhY2tpbmdJZDogc3RyaW5nO1xuICBwcml2YXRlIGxvY2F0aW9uSWQ/OiBzdHJpbmc7XG4gIHByaXZhdGUgc2Vzc2lvbklkPzogc3RyaW5nO1xuICBwcml2YXRlIGV2ZW50UXVldWU6IEV2ZW50UXVldWU7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgdHJhY2tpbmdJZDogc3RyaW5nLFxuICAgIGFwaUVuZHBvaW50Pzogc3RyaW5nXG4gICkge1xuICAgIHRoaXMudHJhY2tpbmdJZCA9IHRyYWNraW5nSWQ7XG4gICAgdGhpcy5hcGlFbmRwb2ludCA9IGFwaUVuZHBvaW50IHx8IHRoaXMuZGV0ZXJtaW5lQXBpRW5kcG9pbnQoKTtcbiAgICBcbiAgICAvLyBJbml0aWFsaXplIHRoZSBldmVudCBxdWV1ZSB3aXRoIGJvdCBwcmV2ZW50aW9uXG4gICAgY29uc3QgcXVldWVDb25maWc6IFF1ZXVlQ29uZmlnID0ge1xuICAgICAgbWF4RXZlbnRzUGVyU2Vjb25kOiBSQVRFX0xJTUlUX0VWRU5UU19QRVJfU0VDT05ELFxuICAgICAgbWF4UmV0cmllczogMyxcbiAgICAgIHJldHJ5RGVsYXlNczogMTAwMCxcbiAgICAgIG1heFF1ZXVlU2l6ZTogMTAwLFxuICAgIH07XG4gICAgXG4gICAgdGhpcy5ldmVudFF1ZXVlID0gbmV3IEV2ZW50UXVldWUocXVldWVDb25maWcpO1xuICAgIFxuICAgIC8vIFNldCB1cCB0aGUgcXVldWUgc2VuZGVyIHRvIHVzZSB0aGUgYWN0dWFsIEFQSSBzZW5kaW5nIGxvZ2ljXG4gICAgdGhpcy5ldmVudFF1ZXVlLnNldFNlbmRlcihhc3luYyAocGF5bG9hZDogYW55KSA9PiB7XG4gICAgICBhd2FpdCB0aGlzLnNlbmRFdmVudERpcmVjdGx5KHBheWxvYWQpO1xuICAgIH0pO1xuICAgIFxuICAgIGxvZ2dlci5sb2coJ0FwaUNsaWVudCBpbml0aWFsaXplZCB3aXRoIHJhdGUgbGltaXQ6JywgcXVldWVDb25maWcubWF4RXZlbnRzUGVyU2Vjb25kLCAnZXZlbnRzIHBlciBzZWNvbmQnKTtcbiAgfVxuXG4gIFxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmUgQVBJIGVuZHBvaW50IGJhc2VkIG9uIHNjcmlwdCBzb3VyY2UgVVJMXG4gICAqL1xuICBwcml2YXRlIGRldGVybWluZUFwaUVuZHBvaW50KCk6IHN0cmluZyB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIEZpbmQgdGhlIGN1cnJlbnQgc2NyaXB0IHRhZyB0aGF0IGxvYWRlZCB0aGlzIHRyYWNraW5nIHNjcmlwdFxuICAgICAgY29uc3QgY3VycmVudFNjcmlwdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYHNjcmlwdFtzcmMqPVwiJHtTQ1JJUFRfQkFTRU5BTUV9XCJdYCkgYXMgSFRNTFNjcmlwdEVsZW1lbnQ7XG4gICAgICBcbiAgICAgIGlmIChjdXJyZW50U2NyaXB0Py5zcmMpIHtcbiAgICAgICAgY29uc3Qgc2NyaXB0U3JjID0gY3VycmVudFNjcmlwdC5zcmM7XG4gICAgICAgIGxvZ2dlci5hcGkoJ1NjcmlwdCBzb3VyY2UgZGV0ZWN0ZWQ6Jywgc2NyaXB0U3JjKTtcbiAgICAgICAgXG4gICAgICAgIC8vIENoZWNrIGZvciBzdGFnaW5nIGVudmlyb25tZW50XG4gICAgICAgIGlmIChzY3JpcHRTcmMuaW5jbHVkZXMoJ3N0YWdpbmcnKSkge1xuICAgICAgICAgIGxvZ2dlci5hcGkoJ1N0YWdpbmcgZW52aXJvbm1lbnQgZGV0ZWN0ZWQsIHVzaW5nIHN0YWdpbmcgQVBJIGVuZHBvaW50Jyk7XG4gICAgICAgICAgcmV0dXJuIEFQSV9FTkRQT0lOVFMuc3RhZ2luZztcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gQ2hlY2sgZm9yIGxvY2FsaG9zdCBlbnZpcm9ubWVudFxuICAgICAgICBpZiAoc2NyaXB0U3JjLmluY2x1ZGVzKCdsb2NhbGhvc3QnKSkge1xuICAgICAgICAgIGxvZ2dlci5hcGkoJ0xvY2FsaG9zdCBlbnZpcm9ubWVudCBkZXRlY3RlZCwgdXNpbmcgbG9jYWxob3N0IEFQSSBlbmRwb2ludCcpO1xuICAgICAgICAgIHJldHVybiBBUElfRU5EUE9JTlRTLmxvY2FsO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBEZWZhdWx0IHRvIHByb2R1Y3Rpb25cbiAgICAgICAgbG9nZ2VyLmFwaSgnUHJvZHVjdGlvbiBlbnZpcm9ubWVudCBkZXRlY3RlZCwgdXNpbmcgcHJvZHVjdGlvbiBBUEkgZW5kcG9pbnQnKTtcbiAgICAgICAgcmV0dXJuIEFQSV9FTkRQT0lOVFMucHJvZHVjdGlvbjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxvZ2dlci5hcGkoJ05vIHNjcmlwdCB0YWcgZm91bmQsIGRlZmF1bHRpbmcgdG8gcHJvZHVjdGlvbiBBUEkgZW5kcG9pbnQnKTtcbiAgICAgICAgcmV0dXJuIEFQSV9FTkRQT0lOVFMucHJvZHVjdGlvbjtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgbG9nZ2VyLmVycm9yKCdFcnJvciBkZXRlcm1pbmluZyBBUEkgZW5kcG9pbnQ6JywgZXJyb3IpO1xuICAgICAgLy8gRmFsbGJhY2sgdG8gcHJvZHVjdGlvbiBpZiBkZXRlY3Rpb24gZmFpbHNcbiAgICAgIGxvZ2dlci5hcGkoJ0ZhbGxpbmcgYmFjayB0byBwcm9kdWN0aW9uIEFQSSBlbmRwb2ludCBkdWUgdG8gZXJyb3InKTtcbiAgICAgIHJldHVybiBBUElfRU5EUE9JTlRTLnByb2R1Y3Rpb247XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0cmFja2luZyBjb250ZXh0IGZyb20gdHJhY2tlciBzdGF0ZVxuICAgKi9cbiAgc2V0VHJhY2tpbmdDb250ZXh0KHNlc3Npb25JZDogc3RyaW5nLCBsb2NhdGlvbklkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLnNlc3Npb25JZCA9IHNlc3Npb25JZDtcbiAgICB0aGlzLmxvY2F0aW9uSWQgPSBsb2NhdGlvbklkO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIGxvY2F0aW9uIElEIGZyb20gdHJhY2tpbmcgSURcbiAgICovXG4gIGFzeW5jIGZldGNoTG9jYXRpb25JZCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKFxuICAgICAgICBgJHt0aGlzLmFwaUVuZHBvaW50fS9leHRlcm5hbC10cmFja2luZy90cmFja2luZy8ke3RoaXMudHJhY2tpbmdJZH1gXG4gICAgICApO1xuXG4gICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIGZldGNoIGxvY2F0aW9uIElEOiAke3Jlc3BvbnNlLnN0YXR1c1RleHR9YCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGRhdGE6IFRyYWNraW5nSWRSZXNwb25zZSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICAgIHRoaXMubG9jYXRpb25JZCA9IGRhdGEubG9jYXRpb25JZDtcbiAgICAgIGxvZ2dlci5hcGkoXCJMb2NhdGlvbiBJRCBmZXRjaGVkOlwiLCB0aGlzLmxvY2F0aW9uSWQpO1xuICAgICAgcmV0dXJuIHRoaXMubG9jYXRpb25JZDtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgbG9nZ2VyLmVycm9yKFwiRXJyb3IgZmV0Y2hpbmcgbG9jYXRpb24gSUQ6XCIsIGVycm9yKTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIHRyYWNraW5nIGV2ZW50IHRvIGJhY2tlbmQgKHF1ZXVlZCB3aXRoIHJhdGUgbGltaXRpbmcpXG4gICAqL1xuICBhc3luYyBzZW5kRXZlbnQoZXZlbnQ6IFRyYWNraW5nRXZlbnQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIXRoaXMubG9jYXRpb25JZCkge1xuICAgICAgYXdhaXQgdGhpcy5mZXRjaExvY2F0aW9uSWQoKTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgLy8gVXNlIHNlc3Npb25JZCBmcm9tIHRyYWNrZXIgc3RhdGUsIGZhbGxiYWNrIHRvIGNvb2tpZVxuICAgICAgY29uc3Qgc2Vzc2lvbklkID1cbiAgICAgICAgdGhpcy5zZXNzaW9uSWQgfHwgZ2V0U2Vzc2lvbklkRnJvbUNvb2tpZSh0aGlzLmxvY2F0aW9uSWQgfHwgXCJcIik7XG4gICAgICBjb25zdCB1c2VyRGF0YSA9IGdldFVzZXJEYXRhKCk7XG5cbiAgICAgIGxldCBlbmhhbmNlZEV2ZW50OiBUcmFja2luZ0V2ZW50ID0geyAuLi5ldmVudCB9O1xuXG4gICAgICAvLyBGb3IgZm9ybSBzdWJtaXNzaW9ucywgZW5oYW5jZSB3aXRoIHRpbWV6b25lXG4gICAgICBpZiAoZXZlbnQudHlwZSA9PT0gRXZlbnRUeXBlLkZPUk1fU1VCTUlTU0lPTiAmJiBcImZvcm1EYXRhXCIgaW4gZXZlbnQpIHtcbiAgICAgICAgY29uc3QgZm9ybUV2ZW50ID0gZXZlbnQgYXMgRm9ybVN1Ym1pc3Npb25FdmVudDtcblxuICAgICAgICAvLyBBZGQgdGltZXpvbmUgdG8gZm9ybSBkYXRhXG4gICAgICAgIGNvbnN0IGVuaGFuY2VkRm9ybUV2ZW50OiBGb3JtU3VibWlzc2lvbkV2ZW50ID0ge1xuICAgICAgICAgIC4uLmZvcm1FdmVudCxcbiAgICAgICAgICBmb3JtRGF0YToge1xuICAgICAgICAgICAgLi4uZm9ybUV2ZW50LmZvcm1EYXRhLFxuICAgICAgICAgICAgVGltZXpvbmU6IGdldEZvcm1hdHRlZFRpbWV6b25lKCksXG4gICAgICAgICAgfSxcbiAgICAgICAgfTtcblxuICAgICAgICBlbmhhbmNlZEV2ZW50ID0gZW5oYW5jZWRGb3JtRXZlbnQ7XG5cbiAgICAgICAgbG9nZ2VyLmFwaShcIkVuaGFuY2VkIGZvcm0gZGF0YSB3aXRoIHRpbWV6b25lOlwiLCB7XG4gICAgICAgICAgdGltZXpvbmU6IGVuaGFuY2VkRm9ybUV2ZW50LmZvcm1EYXRhLlRpbWV6b25lLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgY29uc3QgcGF5bG9hZCA9IHtcbiAgICAgICAgLi4uZW5oYW5jZWRFdmVudCxcbiAgICAgICAgdHJhY2tpbmdJZDogdGhpcy50cmFja2luZ0lkLFxuICAgICAgICBsb2NhdGlvbklkOiB0aGlzLmxvY2F0aW9uSWQsXG4gICAgICAgIHNlc3Npb25JZCwgLy8gVVVJRCBmb3Igc2Vzc2lvbiB0cmFja2luZ1xuICAgICAgICBjb250YWN0SWQ6IHVzZXJEYXRhPy5jb250YWN0SWQsIC8vIElmIGF2YWlsYWJsZSBmcm9tIHN0b3JlZCB1c2VyIGRhdGFcbiAgICAgICAgdXNlcklkOiB1c2VyRGF0YT8udXNlcklkLCAvLyBJZiBhdmFpbGFibGVcbiAgICAgIH07XG5cbiAgICAgIGxvZ2dlci5hcGkoXCJRdWV1ZWluZyBldmVudCBwYXlsb2FkOlwiLCB7XG4gICAgICAgIHR5cGU6IGVuaGFuY2VkRXZlbnQudHlwZSxcbiAgICAgICAgc2Vzc2lvbklkLCBcbiAgICAgICAgdHJhY2tpbmdJZDogdGhpcy50cmFja2luZ0lkLFxuICAgICAgfSk7XG5cbiAgICAgIC8vIEFkZCBldmVudCB0byBxdWV1ZSBmb3IgcmF0ZS1saW1pdGVkIHByb2Nlc3NpbmdcbiAgICAgIGF3YWl0IHRoaXMuZXZlbnRRdWV1ZS5lbnF1ZXVlKHBheWxvYWQpO1xuICAgICAgXG4gICAgICBsb2dnZXIuYXBpKFwiRXZlbnQgcXVldWVkIHN1Y2Nlc3NmdWxseTpcIiwgZW5oYW5jZWRFdmVudC50eXBlKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgbG9nZ2VyLmVycm9yKFwiRXJyb3IgcXVldWVpbmcgZXZlbnQ6XCIsIGVycm9yKTtcbiAgICAgIC8vIERvbid0IHRocm93IC0gd2UgZG9uJ3Qgd2FudCB0cmFja2luZyBlcnJvcnMgdG8gYnJlYWsgdGhlIHVzZXIncyBzaXRlXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgdHJhY2tpbmcgZXZlbnQgZGlyZWN0bHkgdG8gYmFja2VuZCAoYnlwYXNzaW5nIHF1ZXVlKVxuICAgKiBUaGlzIGlzIHVzZWQgaW50ZXJuYWxseSBieSB0aGUgcXVldWUgc3lzdGVtXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHNlbmRFdmVudERpcmVjdGx5KHBheWxvYWQ6IGFueSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goXG4gICAgICBgJHt0aGlzLmFwaUVuZHBvaW50fS9leHRlcm5hbC10cmFja2luZy9ldmVudHNgLFxuICAgICAge1xuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgICAgIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHBheWxvYWQpLFxuICAgICAgfVxuICAgICk7XG5cbiAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBzZW5kIGV2ZW50OiAke3Jlc3BvbnNlLnN0YXR1c1RleHR9YCk7XG4gICAgfVxuXG4gICAgbG9nZ2VyLmFwaShcIkV2ZW50IHNlbnQgc3VjY2Vzc2Z1bGx5OlwiLCBwYXlsb2FkLnR5cGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFN1Ym1pdCBmb3JtIGRhdGFcbiAgICogU2VuZHMgZm9ybSBzdWJtaXNzaW9uIGV2ZW50cyB3aXRoIGVuaGFuY2VkIGRhdGFcbiAgICovXG4gIGFzeW5jIHN1Ym1pdEZvcm0oZXZlbnQ6IEZvcm1TdWJtaXNzaW9uRXZlbnQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIXRoaXMubG9jYXRpb25JZCkge1xuICAgICAgYXdhaXQgdGhpcy5mZXRjaExvY2F0aW9uSWQoKTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgbG9nZ2VyLmFwaShcIkZvcm0gc3VibWlzc2lvbjpcIiwgZXZlbnQuZm9ybURhdGEpO1xuICAgICAgXG4gICAgICAvLyBTZW5kIGZvcm0gZGF0YSBhcyBhIHRyYWNraW5nIGV2ZW50XG4gICAgICBhd2FpdCB0aGlzLnNlbmRFdmVudChldmVudCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGxvZ2dlci5lcnJvcihcIkVycm9yIHN1Ym1pdHRpbmcgZm9ybTpcIiwgZXJyb3IpO1xuICAgIH1cbiAgfVxufVxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmRlZmF1bHQgPSAnMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAwJztcbiIsImltcG9ydCB7IFRyYWNraW5nQ29uZmlnIH0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0IHsgR0xPQkFMX1RSQUNLSU5HX0tFWSwgU0NSSVBUX0JBU0VOQU1FIH0gZnJvbSAnLi9jb21tb24nO1xuXG4vKipcbiAqIFJlYWRzIGNvbmZpZ3VyYXRpb24gZnJvbSBzY3JpcHQgdGFnIGF0dHJpYnV0ZXNcbiAqIFxuICogQHJldHVybnMgVHJhY2tpbmdDb25maWcgaWYgdmFsaWQgYXR0cmlidXRlcyBmb3VuZCwgbnVsbCBvdGhlcndpc2VcbiAqIFxuICogTG9naWMgZmxvdzpcbiAqIDEuIEZpbmQgdGhlIGN1cnJlbnQgc2NyaXB0IHRhZyB1c2luZyBkb2N1bWVudC5jdXJyZW50U2NyaXB0IG9yIHNlbGVjdG9yXG4gKiAyLiBFeHRyYWN0IGRhdGEgYXR0cmlidXRlcyBmcm9tIHRoZSBzY3JpcHQgdGFnXG4gKiAzLiBWYWxpZGF0ZSByZXF1aXJlZCB0cmFja2luZ0lkIGF0dHJpYnV0ZVxuICogNC4gUGFyc2Ugb3B0aW9uYWwgY29uZmlndXJhdGlvbiBhdHRyaWJ1dGVzXG4gKiA1LiBSZXR1cm4gY29tcGxldGUgY29uZmlndXJhdGlvbiBvYmplY3RcbiAqL1xuZXhwb3J0IGNvbnN0IGdldENvbmZpZ0Zyb21TY3JpcHRBdHRyaWJ1dGVzID0gKCk6IFRyYWNraW5nQ29uZmlnIHwgbnVsbCA9PiB7XG4gIHRyeSB7XG4gICAgLy8gRmluZCB0aGUgY3VycmVudCBzY3JpcHQgdGFnXG4gICAgY29uc3QgY3VycmVudFNjcmlwdCA9IGRvY3VtZW50LmN1cnJlbnRTY3JpcHQgfHwgXG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBzY3JpcHRbc3JjKj1cIiR7U0NSSVBUX0JBU0VOQU1FfVwiXWApO1xuICAgIFxuICAgIGlmICghY3VycmVudFNjcmlwdCkge1xuICAgICAgbG9nZ2VyLndhcm4oJ0NvdWxkIG5vdCBmaW5kIHNjcmlwdCB0YWcgZm9yIGNvbmZpZ3VyYXRpb24nKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8vIEVuYWJsZSBkZWJ1ZyBtb2RlIGVhcmx5IGlmIHNwZWNpZmllZCwgc28gd2UgY2FuIHNlZSB2YWxpZGF0aW9uIGVycm9yc1xuICAgIGNvbnN0IGRlYnVnID0gY3VycmVudFNjcmlwdC5nZXRBdHRyaWJ1dGUoJ2RhdGEtZGVidWcnKTtcbiAgICBpZiAoZGVidWcgPT09ICd0cnVlJykge1xuICAgICAgY29uc3QgdyA9IHdpbmRvdyBhcyBhbnk7XG4gICAgICB3W0dMT0JBTF9UUkFDS0lOR19LRVldID0gd1tHTE9CQUxfVFJBQ0tJTkdfS0VZXSB8fCB7fTtcbiAgICAgIHdbR0xPQkFMX1RSQUNLSU5HX0tFWV0uZGVidWcgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIFJlYWQgcmVxdWlyZWQgZGF0YSBhdHRyaWJ1dGVzXG4gICAgY29uc3QgdHJhY2tpbmdJZCA9IGN1cnJlbnRTY3JpcHQuZ2V0QXR0cmlidXRlKCdkYXRhLXRyYWNraW5nLWlkJyk7XG4gICAgXG4gICAgaWYgKCF0cmFja2luZ0lkKSB7XG4gICAgICBsb2dnZXIuY3JpdGljYWwoJ1JlcXVpcmVkIGRhdGEtdHJhY2tpbmctaWQgYXR0cmlidXRlIG5vdCBmb3VuZCcpO1xuICAgICAgbG9nZ2VyLmNyaXRpY2FsKCdQbGVhc2UgYWRkIGRhdGEtdHJhY2tpbmctaWQ9XCJ5b3VyLXRyYWNraW5nLWlkXCIgdG8gdGhlIHNjcmlwdCB0YWcnKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbmZpZzogVHJhY2tpbmdDb25maWcgPSB7XG4gICAgICB0cmFja2luZ0lkLFxuICAgIH07XG5cbiAgICAvLyBBZGQgZGVidWcgdG8gY29uZmlnIGlmIGVuYWJsZWRcbiAgICBpZiAoZGVidWcgPT09ICd0cnVlJykge1xuICAgICAgY29uZmlnLmRlYnVnID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBQYXJzZSBvcHRpb25hbCBBUEkgZW5kcG9pbnQgYXR0cmlidXRlXG4gICAgY29uc3QgYXBpRW5kcG9pbnQgPSBjdXJyZW50U2NyaXB0LmdldEF0dHJpYnV0ZSgnZGF0YS1hcGktZW5kcG9pbnQnKTtcbiAgICBpZiAoYXBpRW5kcG9pbnQpIHtcbiAgICAgIGNvbmZpZy5hcGlFbmRwb2ludCA9IGFwaUVuZHBvaW50O1xuICAgIH1cblxuICAgIGxvZ2dlci5sb2coJ0NvbmZpZ3VyYXRpb24gbG9hZGVkIGZyb20gc2NyaXB0IGF0dHJpYnV0ZXM6JywgY29uZmlnKTtcbiAgICByZXR1cm4gY29uZmlnO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGxvZ2dlci5jcml0aWNhbCgnRXJyb3IgcmVhZGluZyBzY3JpcHQgYXR0cmlidXRlczonLCBlcnJvcik7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn07XG5cbi8qKlxuICogVmFsaWRhdGVzIGEgdHJhY2tpbmcgY29uZmlndXJhdGlvbiBvYmplY3RcbiAqIFxuICogQHBhcmFtIGNvbmZpZyAtIENvbmZpZ3VyYXRpb24gb2JqZWN0IHRvIHZhbGlkYXRlXG4gKiBAcmV0dXJucyBib29sZWFuIGluZGljYXRpbmcgaWYgY29uZmlndXJhdGlvbiBpcyB2YWxpZFxuICovXG5leHBvcnQgY29uc3QgdmFsaWRhdGVDb25maWcgPSAoY29uZmlnOiBUcmFja2luZ0NvbmZpZyk6IGJvb2xlYW4gPT4ge1xuICBpZiAoIWNvbmZpZyB8fCB0eXBlb2YgY29uZmlnICE9PSAnb2JqZWN0Jykge1xuICAgIGxvZ2dlci5jcml0aWNhbCgnSW52YWxpZCBjb25maWd1cmF0aW9uOiBtdXN0IGJlIGFuIG9iamVjdCcpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmICghY29uZmlnLnRyYWNraW5nSWQgfHwgdHlwZW9mIGNvbmZpZy50cmFja2luZ0lkICE9PSAnc3RyaW5nJykge1xuICAgIGxvZ2dlci5jcml0aWNhbCgnSW52YWxpZCBjb25maWd1cmF0aW9uOiB0cmFja2luZ0lkIG11c3QgYmUgYSBub24tZW1wdHkgc3RyaW5nJyk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKGNvbmZpZy5hcGlFbmRwb2ludCAmJiB0eXBlb2YgY29uZmlnLmFwaUVuZHBvaW50ICE9PSAnc3RyaW5nJykge1xuICAgIGxvZ2dlci5jcml0aWNhbCgnSW52YWxpZCBjb25maWd1cmF0aW9uOiBhcGlFbmRwb2ludCBtdXN0IGJlIGEgc3RyaW5nJyk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKGNvbmZpZy5kZWJ1ZyAmJiB0eXBlb2YgY29uZmlnLmRlYnVnICE9PSAnYm9vbGVhbicpIHtcbiAgICBsb2dnZXIuY3JpdGljYWwoJ0ludmFsaWQgY29uZmlndXJhdGlvbjogZGVidWcgbXVzdCBiZSBhIGJvb2xlYW4nKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07ICIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5VUkwgPSBleHBvcnRzLkROUyA9IHZvaWQgMDtcbmNvbnN0IHNoYTFfanNfMSA9IHJlcXVpcmUoXCIuL3NoYTEuanNcIik7XG5jb25zdCB2MzVfanNfMSA9IHJlcXVpcmUoXCIuL3YzNS5qc1wiKTtcbnZhciB2MzVfanNfMiA9IHJlcXVpcmUoXCIuL3YzNS5qc1wiKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIkROU1wiLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gdjM1X2pzXzIuRE5TOyB9IH0pO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiVVJMXCIsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiB2MzVfanNfMi5VUkw7IH0gfSk7XG5mdW5jdGlvbiB2NSh2YWx1ZSwgbmFtZXNwYWNlLCBidWYsIG9mZnNldCkge1xuICAgIHJldHVybiAoMCwgdjM1X2pzXzEuZGVmYXVsdCkoMHg1MCwgc2hhMV9qc18xLmRlZmF1bHQsIHZhbHVlLCBuYW1lc3BhY2UsIGJ1Ziwgb2Zmc2V0KTtcbn1cbnY1LkROUyA9IHYzNV9qc18xLkROUztcbnY1LlVSTCA9IHYzNV9qc18xLlVSTDtcbmV4cG9ydHMuZGVmYXVsdCA9IHY1O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5jb25zdCBwYXJzZV9qc18xID0gcmVxdWlyZShcIi4vcGFyc2UuanNcIik7XG5jb25zdCBzdHJpbmdpZnlfanNfMSA9IHJlcXVpcmUoXCIuL3N0cmluZ2lmeS5qc1wiKTtcbmZ1bmN0aW9uIHYxVG9WNih1dWlkKSB7XG4gICAgY29uc3QgdjFCeXRlcyA9IHR5cGVvZiB1dWlkID09PSAnc3RyaW5nJyA/ICgwLCBwYXJzZV9qc18xLmRlZmF1bHQpKHV1aWQpIDogdXVpZDtcbiAgICBjb25zdCB2NkJ5dGVzID0gX3YxVG9WNih2MUJ5dGVzKTtcbiAgICByZXR1cm4gdHlwZW9mIHV1aWQgPT09ICdzdHJpbmcnID8gKDAsIHN0cmluZ2lmeV9qc18xLnVuc2FmZVN0cmluZ2lmeSkodjZCeXRlcykgOiB2NkJ5dGVzO1xufVxuZXhwb3J0cy5kZWZhdWx0ID0gdjFUb1Y2O1xuZnVuY3Rpb24gX3YxVG9WNih2MUJ5dGVzKSB7XG4gICAgcmV0dXJuIFVpbnQ4QXJyYXkub2YoKCh2MUJ5dGVzWzZdICYgMHgwZikgPDwgNCkgfCAoKHYxQnl0ZXNbN10gPj4gNCkgJiAweDBmKSwgKCh2MUJ5dGVzWzddICYgMHgwZikgPDwgNCkgfCAoKHYxQnl0ZXNbNF0gJiAweGYwKSA+PiA0KSwgKCh2MUJ5dGVzWzRdICYgMHgwZikgPDwgNCkgfCAoKHYxQnl0ZXNbNV0gJiAweGYwKSA+PiA0KSwgKCh2MUJ5dGVzWzVdICYgMHgwZikgPDwgNCkgfCAoKHYxQnl0ZXNbMF0gJiAweGYwKSA+PiA0KSwgKCh2MUJ5dGVzWzBdICYgMHgwZikgPDwgNCkgfCAoKHYxQnl0ZXNbMV0gJiAweGYwKSA+PiA0KSwgKCh2MUJ5dGVzWzFdICYgMHgwZikgPDwgNCkgfCAoKHYxQnl0ZXNbMl0gJiAweGYwKSA+PiA0KSwgMHg2MCB8ICh2MUJ5dGVzWzJdICYgMHgwZiksIHYxQnl0ZXNbM10sIHYxQnl0ZXNbOF0sIHYxQnl0ZXNbOV0sIHYxQnl0ZXNbMTBdLCB2MUJ5dGVzWzExXSwgdjFCeXRlc1sxMl0sIHYxQnl0ZXNbMTNdLCB2MUJ5dGVzWzE0XSwgdjFCeXRlc1sxNV0pO1xufVxuIiwiLyoqXG4gKiBDb25maWd1cmF0aW9uIG9wdGlvbnMgZm9yIHRoZSBleHRlcm5hbCB0cmFja2luZyBzeXN0ZW1cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUcmFja2luZ0NvbmZpZyB7XG4gIHRyYWNraW5nSWQ6IHN0cmluZztcbiAgYXBpRW5kcG9pbnQ/OiBzdHJpbmc7XG4gIGRlYnVnPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBJbnRlcm5hbCB0cmFja2luZyBzdGF0ZVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRyYWNraW5nU3RhdGUge1xuICBpbml0aWFsaXplZDogYm9vbGVhbjtcbiAgdHJhY2tpbmdJZDogc3RyaW5nO1xuICBsb2NhdGlvbklkPzogc3RyaW5nO1xuICB1c2VySWQ/OiBzdHJpbmc7XG4gIHVzZXJQcm9wZXJ0aWVzPzogVXNlclByb3BlcnRpZXM7XG4gIHNlc3Npb25JZD86IHN0cmluZztcbn1cblxuLyoqXG4gKiBFdmVudCB0eXBlcyB0aGF0IGNhbiBiZSB0cmFja2VkXG4gKi9cbmV4cG9ydCBlbnVtIEV2ZW50VHlwZSB7XG4gIFNDUklQVF9QQUdFX1ZJRVcgPSAnZXh0ZXJuYWxfc2NyaXB0X3BhZ2VfdmlldycsXG4gIEZPUk1fU1VCTUlTU0lPTiA9ICdleHRlcm5hbF9mb3JtX3N1Ym1pc3Npb24nLFxufVxuXG4vKipcbiAqIEJhc2UgZXZlbnQgc3RydWN0dXJlXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVHJhY2tpbmdFdmVudCB7XG4gIHR5cGU6IEV2ZW50VHlwZTtcbiAgdGltZXN0YW1wOiBudW1iZXI7XG4gIHVybDogc3RyaW5nO1xuICByZWZlcnJlcjogc3RyaW5nO1xuICB1c2VyQWdlbnQ6IHN0cmluZztcbiAgcHJvcGVydGllcz86IEV2ZW50UHJvcGVydGllcztcbn1cblxuLyoqXG4gKiBQYWdlIHZpZXcgZXZlbnRcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBQYWdlVmlld0V2ZW50IGV4dGVuZHMgVHJhY2tpbmdFdmVudCB7XG4gIHR5cGU6IEV2ZW50VHlwZS5TQ1JJUFRfUEFHRV9WSUVXO1xuICB0aXRsZTogc3RyaW5nO1xuICBwYXRoOiBzdHJpbmc7XG4gIGZvcm1JZD86IHN0cmluZztcbn1cblxuLyoqXG4gKiBGb3JtIHN1Ym1pc3Npb24gZXZlbnRcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBGb3JtU3VibWlzc2lvbkV2ZW50IGV4dGVuZHMgVHJhY2tpbmdFdmVudCB7XG4gIHR5cGU6IEV2ZW50VHlwZS5GT1JNX1NVQk1JU1NJT047XG4gIGZvcm1JZDogc3RyaW5nO1xuICBmb3JtRGF0YTogUmVjb3JkPHN0cmluZywgYW55PjtcbiAgZm9ybUxhYmVscz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG59XG5cbi8qKlxuICogQ3VzdG9tIGV2ZW50IHByb3BlcnRpZXNcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBFdmVudFByb3BlcnRpZXMge1xuICBba2V5OiBzdHJpbmddOiBhbnk7XG59XG5cbi8qKlxuICogVXNlciBwcm9wZXJ0aWVzIGZvciBpZGVudGlmaWNhdGlvblxuICovXG5leHBvcnQgaW50ZXJmYWNlIFVzZXJQcm9wZXJ0aWVzIHtcbiAgZW1haWw/OiBzdHJpbmc7XG4gIG5hbWU/OiBzdHJpbmc7XG4gIHBob25lPzogc3RyaW5nO1xuICBba2V5OiBzdHJpbmddOiBhbnk7XG59XG5cbi8qKlxuICogQVBJIHJlc3BvbnNlIGZvciB0cmFja2luZyBJRCBsb29rdXBcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUcmFja2luZ0lkUmVzcG9uc2Uge1xuICB0cmFja2luZ0lkOiBzdHJpbmc7XG4gIGxvY2F0aW9uSWQ6IHN0cmluZztcbn1cblxuICIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5VUkwgPSBleHBvcnRzLkROUyA9IHZvaWQgMDtcbmNvbnN0IG1kNV9qc18xID0gcmVxdWlyZShcIi4vbWQ1LmpzXCIpO1xuY29uc3QgdjM1X2pzXzEgPSByZXF1aXJlKFwiLi92MzUuanNcIik7XG52YXIgdjM1X2pzXzIgPSByZXF1aXJlKFwiLi92MzUuanNcIik7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJETlNcIiwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHYzNV9qc18yLkROUzsgfSB9KTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIlVSTFwiLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gdjM1X2pzXzIuVVJMOyB9IH0pO1xuZnVuY3Rpb24gdjModmFsdWUsIG5hbWVzcGFjZSwgYnVmLCBvZmZzZXQpIHtcbiAgICByZXR1cm4gKDAsIHYzNV9qc18xLmRlZmF1bHQpKDB4MzAsIG1kNV9qc18xLmRlZmF1bHQsIHZhbHVlLCBuYW1lc3BhY2UsIGJ1Ziwgb2Zmc2V0KTtcbn1cbnYzLkROUyA9IHYzNV9qc18xLkROUztcbnYzLlVSTCA9IHYzNV9qc18xLlVSTDtcbmV4cG9ydHMuZGVmYXVsdCA9IHYzO1xuIiwiLyoqXG4gKiBTYWZlIGNvbnNvbGUgbG9nZ2VyIGZvciBkZWJ1ZyBtb2RlXG4gKiBPbmx5IGxvZ3Mgd2hlbiBkZWJ1ZyBtb2RlIGlzIGVuYWJsZWQgaW4gZ2xvYmFsIHRyYWNraW5nIGNvbmZpZ3VyYXRpb25cbiAqL1xuaW1wb3J0IHsgTE9HR0VSX0VSUk9SX1BSRUZJWCwgTE9HR0VSX1BSRUZJWCwgR0xPQkFMX1RSQUNLSU5HX0tFWSB9IGZyb20gJy4uL2NvbmZpZy9jb21tb24nO1xuXG5leHBvcnQgY29uc3QgbG9nZ2VyID0ge1xuICAvKipcbiAgICogTG9nIEFQSS1yZWxhdGVkIG1lc3NhZ2VzIChvbmx5IGluIGRlYnVnIG1vZGUpXG4gICAqIFxuICAgKiBAcGFyYW0gbWVzc2FnZSAtIE1lc3NhZ2UgdG8gbG9nXG4gICAqIEBwYXJhbSBhcmdzIC0gQWRkaXRpb25hbCBhcmd1bWVudHMgdG8gbG9nXG4gICAqL1xuICBhcGk6IChtZXNzYWdlOiBzdHJpbmcsIC4uLmFyZ3M6IGFueVtdKTogdm9pZCA9PiB7XG4gICAgaWYgKGlzRGVidWdNb2RlKCkpIHtcbiAgICAgIGNvbnNvbGUubG9nKGAke0xPR0dFUl9QUkVGSVh9ICR7bWVzc2FnZX1gLCAuLi5hcmdzKTtcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIExvZyBlcnJvciBtZXNzYWdlcyAob25seSBpbiBkZWJ1ZyBtb2RlKVxuICAgKiBcbiAgICogQHBhcmFtIG1lc3NhZ2UgLSBFcnJvciBtZXNzYWdlIHRvIGxvZ1xuICAgKiBAcGFyYW0gYXJncyAtIEFkZGl0aW9uYWwgYXJndW1lbnRzIHRvIGxvZ1xuICAgKi9cbiAgZXJyb3I6IChtZXNzYWdlOiBzdHJpbmcsIC4uLmFyZ3M6IGFueVtdKTogdm9pZCA9PiB7XG4gICAgaWYgKGlzRGVidWdNb2RlKCkpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYCR7TE9HR0VSX1BSRUZJWH0gJHttZXNzYWdlfWAsIC4uLmFyZ3MpO1xuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogTG9nIGNyaXRpY2FsIGVycm9ycyAoQUxXQVlTIHZpc2libGUsIHJlZ2FyZGxlc3Mgb2YgZGVidWcgbW9kZSlcbiAgICogXG4gICAqIEBwYXJhbSBtZXNzYWdlIC0gQ3JpdGljYWwgZXJyb3IgbWVzc2FnZSB0byBsb2dcbiAgICogQHBhcmFtIGFyZ3MgLSBBZGRpdGlvbmFsIGFyZ3VtZW50cyB0byBsb2dcbiAgICovXG4gIGNyaXRpY2FsOiAobWVzc2FnZTogc3RyaW5nLCAuLi5hcmdzOiBhbnlbXSk6IHZvaWQgPT4ge1xuICAgIGNvbnNvbGUuZXJyb3IoYCR7TE9HR0VSX0VSUk9SX1BSRUZJWH0gJHttZXNzYWdlfWAsIC4uLmFyZ3MpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBMb2cgZ2VuZXJhbCBtZXNzYWdlcyAob25seSBpbiBkZWJ1ZyBtb2RlKVxuICAgKiBcbiAgICogQHBhcmFtIG1lc3NhZ2UgLSBNZXNzYWdlIHRvIGxvZ1xuICAgKiBAcGFyYW0gYXJncyAtIEFkZGl0aW9uYWwgYXJndW1lbnRzIHRvIGxvZ1xuICAgKi9cbiAgbG9nOiAobWVzc2FnZTogc3RyaW5nLCAuLi5hcmdzOiBhbnlbXSk6IHZvaWQgPT4ge1xuICAgIGlmIChpc0RlYnVnTW9kZSgpKSB7XG4gICAgICBjb25zb2xlLmxvZyhgJHtMT0dHRVJfUFJFRklYfSAke21lc3NhZ2V9YCwgLi4uYXJncyk7XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBMb2cgd2FybmluZyBtZXNzYWdlcyAob25seSBpbiBkZWJ1ZyBtb2RlKVxuICAgKiBcbiAgICogQHBhcmFtIG1lc3NhZ2UgLSBXYXJuaW5nIG1lc3NhZ2UgdG8gbG9nXG4gICAqIEBwYXJhbSBhcmdzIC0gQWRkaXRpb25hbCBhcmd1bWVudHMgdG8gbG9nXG4gICAqL1xuICB3YXJuOiAobWVzc2FnZTogc3RyaW5nLCAuLi5hcmdzOiBhbnlbXSk6IHZvaWQgPT4ge1xuICAgIGlmIChpc0RlYnVnTW9kZSgpKSB7XG4gICAgICBjb25zb2xlLndhcm4oYCR7TE9HR0VSX1BSRUZJWH0gJHttZXNzYWdlfWAsIC4uLmFyZ3MpO1xuICAgIH1cbiAgfSxcbn07XG5cbi8qKlxuICogQ2hlY2tzIGlmIGRlYnVnIG1vZGUgaXMgZW5hYmxlZFxuICogXG4gKiBAcmV0dXJucyBib29sZWFuIGluZGljYXRpbmcgaWYgZGVidWcgbW9kZSBpcyBhY3RpdmVcbiAqL1xuY29uc3QgaXNEZWJ1Z01vZGUgPSAoKTogYm9vbGVhbiA9PiB7XG4gIGlmICh0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJykgcmV0dXJuIGZhbHNlO1xuICBjb25zdCB3ID0gd2luZG93IGFzIGFueTtcbiAgcmV0dXJuIEJvb2xlYW4odz8uW0dMT0JBTF9UUkFDS0lOR19LRVldPy5kZWJ1Zyk7XG59O1xuXG4gIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmRlZmF1bHQgPSAvXig/OlswLTlhLWZdezh9LVswLTlhLWZdezR9LVsxLThdWzAtOWEtZl17M30tWzg5YWJdWzAtOWEtZl17M30tWzAtOWEtZl17MTJ9fDAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMHxmZmZmZmZmZi1mZmZmLWZmZmYtZmZmZi1mZmZmZmZmZmZmZmYpJC9pO1xuIiwiaW1wb3J0IHsgRXZlbnRUeXBlLCBQYWdlVmlld0V2ZW50LCBGb3JtU3VibWlzc2lvbkV2ZW50IH0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0IHsgZ2V0UGFnZU1ldGFkYXRhLCBwYXJzZUZvcm1EYXRhLCBsb2dnZXIsIGdldEZvcm1JZGVudGlmaWVyIH0gZnJvbSAnLi4vdXRpbHMnO1xuXG4vKipcbiAqIFN0YXJ0IHBhZ2UgdHJhY2tpbmcgLSB0cmFja3MgdGhlIGluaXRpYWwgcGFnZSB2aWV3IGltbWVkaWF0ZWx5XG4gKi9cbmV4cG9ydCBjb25zdCBzdGFydFBhZ2VUcmFja2luZyA9IChjYWxsYmFjazogKGV2ZW50OiBQYWdlVmlld0V2ZW50KSA9PiB2b2lkKTogdm9pZCA9PiB7XG4gIGxvZ2dlci5sb2coJ1RyYWNraW5nIGluaXRpYWwgcGFnZSB2aWV3Jyk7XG4gIFxuICBjb25zdCBtZXRhZGF0YSA9IGdldFBhZ2VNZXRhZGF0YSgpO1xuICBjb25zdCBmb3JtSWQgPSBnZXRGb3JtSWRlbnRpZmllcigpO1xuICBjb25zdCBldmVudDogUGFnZVZpZXdFdmVudCA9IHtcbiAgICB0eXBlOiBFdmVudFR5cGUuU0NSSVBUX1BBR0VfVklFVyxcbiAgICB0aW1lc3RhbXA6IERhdGUubm93KCksXG4gICAgLi4ubWV0YWRhdGEsXG4gICAgLi4uKGZvcm1JZCA/IHsgZm9ybUlkIH0gOiB7fSksXG4gIH07XG5cbiAgY2FsbGJhY2soZXZlbnQpO1xufTtcblxuLyoqXG4gKiBTdGFydCBmb3JtIHRyYWNraW5nIC0gdHJhY2tzIHRoZSBmaXJzdCBmb3JtIGZvdW5kIG9uIHRoZSBwYWdlXG4gKi9cbmV4cG9ydCBjb25zdCBzdGFydEZvcm1UcmFja2luZyA9IChjYWxsYmFjazogKGV2ZW50OiBGb3JtU3VibWlzc2lvbkV2ZW50KSA9PiB2b2lkKTogdm9pZCA9PiB7XG4gIGxvZ2dlci5sb2coJ1N0YXJ0aW5nIGZvcm0gc3VibWlzc2lvbiB0cmFja2luZycpO1xuICBcbiAgY29uc3QgZm9ybSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2Zvcm0nKTtcbiAgaWYgKCFmb3JtKSB7XG4gICAgbG9nZ2VyLmxvZygnTm8gZm9ybXMgZm91bmQgb24gcGFnZScpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIExpc3RlbiBmb3Igc3VibWl0IGV2ZW50XG4gIGZvcm0uYWRkRXZlbnRMaXN0ZW5lcignc3VibWl0JywgKF9ldmVudCkgPT4ge1xuICAgIGhhbmRsZUZvcm1TdWJtaXQoZm9ybSBhcyBIVE1MRm9ybUVsZW1lbnQsIGNhbGxiYWNrKTtcbiAgfSwgeyBjYXB0dXJlOiB0cnVlIH0pO1xuXG4gIGNvbnN0IGZvcm1JZGVudGlmaWVyID0gZ2V0Rm9ybUlkZW50aWZpZXIoZm9ybSBhcyBIVE1MRm9ybUVsZW1lbnQpIHx8ICdVbmlkZW50aWZpZWQgRm9ybSc7XG4gIGxvZ2dlci5sb2coJ1RyYWNraW5nIGZvcm06JywgZm9ybUlkZW50aWZpZXIpO1xufTtcblxuLyoqXG4gKiBIYW5kbGUgZm9ybSBzdWJtaXNzaW9uXG4gKi9cbmNvbnN0IGhhbmRsZUZvcm1TdWJtaXQgPSAoZm9ybTogSFRNTEZvcm1FbGVtZW50LCBjYWxsYmFjazogKGV2ZW50OiBGb3JtU3VibWlzc2lvbkV2ZW50KSA9PiB2b2lkKTogdm9pZCA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgeyBmaWVsZERhdGEsIGZpZWxkTGFiZWxzIH0gPSBwYXJzZUZvcm1EYXRhKGZvcm0pO1xuICAgIGNvbnN0IG1ldGFkYXRhID0gZ2V0UGFnZU1ldGFkYXRhKCk7XG4gICAgXG4gICAgY29uc3QgdHJhY2tpbmdFdmVudDogRm9ybVN1Ym1pc3Npb25FdmVudCA9IHtcbiAgICAgIHR5cGU6IEV2ZW50VHlwZS5GT1JNX1NVQk1JU1NJT04sXG4gICAgICB0aW1lc3RhbXA6IERhdGUubm93KCksXG4gICAgICBmb3JtSWQ6IGdldEZvcm1JZGVudGlmaWVyKGZvcm0pIHx8ICdVbmlkZW50aWZpZWQgRm9ybScsXG4gICAgICBmb3JtRGF0YTogZmllbGREYXRhLFxuICAgICAgZm9ybUxhYmVsczogZmllbGRMYWJlbHMsXG4gICAgICAuLi5tZXRhZGF0YSxcbiAgICB9O1xuXG4gICAgY2FsbGJhY2sodHJhY2tpbmdFdmVudCk7XG4gICAgXG4gICAgbG9nZ2VyLmxvZygnRm9ybSBzdWJtaXNzaW9uIHRyYWNrZWQ6JywgdHJhY2tpbmdFdmVudC5mb3JtSWQpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGxvZ2dlci5lcnJvcignRXJyb3IgdHJhY2tpbmcgZm9ybSBzdWJtaXNzaW9uOicsIGVycm9yKTtcbiAgfVxufTsgIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5jb25zdCByZWdleF9qc18xID0gcmVxdWlyZShcIi4vcmVnZXguanNcIik7XG5mdW5jdGlvbiB2YWxpZGF0ZSh1dWlkKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB1dWlkID09PSAnc3RyaW5nJyAmJiByZWdleF9qc18xLmRlZmF1bHQudGVzdCh1dWlkKTtcbn1cbmV4cG9ydHMuZGVmYXVsdCA9IHZhbGlkYXRlO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5jb25zdCB2YWxpZGF0ZV9qc18xID0gcmVxdWlyZShcIi4vdmFsaWRhdGUuanNcIik7XG5mdW5jdGlvbiB2ZXJzaW9uKHV1aWQpIHtcbiAgICBpZiAoISgwLCB2YWxpZGF0ZV9qc18xLmRlZmF1bHQpKHV1aWQpKSB7XG4gICAgICAgIHRocm93IFR5cGVFcnJvcignSW52YWxpZCBVVUlEJyk7XG4gICAgfVxuICAgIHJldHVybiBwYXJzZUludCh1dWlkLnNsaWNlKDE0LCAxNSksIDE2KTtcbn1cbmV4cG9ydHMuZGVmYXVsdCA9IHZlcnNpb247XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmNvbnN0IHJhbmRvbVVVSUQgPSB0eXBlb2YgY3J5cHRvICE9PSAndW5kZWZpbmVkJyAmJiBjcnlwdG8ucmFuZG9tVVVJRCAmJiBjcnlwdG8ucmFuZG9tVVVJRC5iaW5kKGNyeXB0byk7XG5leHBvcnRzLmRlZmF1bHQgPSB7IHJhbmRvbVVVSUQgfTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuY29uc3QgdmFsaWRhdGVfanNfMSA9IHJlcXVpcmUoXCIuL3ZhbGlkYXRlLmpzXCIpO1xuZnVuY3Rpb24gcGFyc2UodXVpZCkge1xuICAgIGlmICghKDAsIHZhbGlkYXRlX2pzXzEuZGVmYXVsdCkodXVpZCkpIHtcbiAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdJbnZhbGlkIFVVSUQnKTtcbiAgICB9XG4gICAgbGV0IHY7XG4gICAgcmV0dXJuIFVpbnQ4QXJyYXkub2YoKHYgPSBwYXJzZUludCh1dWlkLnNsaWNlKDAsIDgpLCAxNikpID4+PiAyNCwgKHYgPj4+IDE2KSAmIDB4ZmYsICh2ID4+PiA4KSAmIDB4ZmYsIHYgJiAweGZmLCAodiA9IHBhcnNlSW50KHV1aWQuc2xpY2UoOSwgMTMpLCAxNikpID4+PiA4LCB2ICYgMHhmZiwgKHYgPSBwYXJzZUludCh1dWlkLnNsaWNlKDE0LCAxOCksIDE2KSkgPj4+IDgsIHYgJiAweGZmLCAodiA9IHBhcnNlSW50KHV1aWQuc2xpY2UoMTksIDIzKSwgMTYpKSA+Pj4gOCwgdiAmIDB4ZmYsICgodiA9IHBhcnNlSW50KHV1aWQuc2xpY2UoMjQsIDM2KSwgMTYpKSAvIDB4MTAwMDAwMDAwMDApICYgMHhmZiwgKHYgLyAweDEwMDAwMDAwMCkgJiAweGZmLCAodiA+Pj4gMjQpICYgMHhmZiwgKHYgPj4+IDE2KSAmIDB4ZmYsICh2ID4+PiA4KSAmIDB4ZmYsIHYgJiAweGZmKTtcbn1cbmV4cG9ydHMuZGVmYXVsdCA9IHBhcnNlO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiBmKHMsIHgsIHksIHopIHtcbiAgICBzd2l0Y2ggKHMpIHtcbiAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgcmV0dXJuICh4ICYgeSkgXiAofnggJiB6KTtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgcmV0dXJuIHggXiB5IF4gejtcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgcmV0dXJuICh4ICYgeSkgXiAoeCAmIHopIF4gKHkgJiB6KTtcbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgcmV0dXJuIHggXiB5IF4gejtcbiAgICB9XG59XG5mdW5jdGlvbiBST1RMKHgsIG4pIHtcbiAgICByZXR1cm4gKHggPDwgbikgfCAoeCA+Pj4gKDMyIC0gbikpO1xufVxuZnVuY3Rpb24gc2hhMShieXRlcykge1xuICAgIGNvbnN0IEsgPSBbMHg1YTgyNzk5OSwgMHg2ZWQ5ZWJhMSwgMHg4ZjFiYmNkYywgMHhjYTYyYzFkNl07XG4gICAgY29uc3QgSCA9IFsweDY3NDUyMzAxLCAweGVmY2RhYjg5LCAweDk4YmFkY2ZlLCAweDEwMzI1NDc2LCAweGMzZDJlMWYwXTtcbiAgICBjb25zdCBuZXdCeXRlcyA9IG5ldyBVaW50OEFycmF5KGJ5dGVzLmxlbmd0aCArIDEpO1xuICAgIG5ld0J5dGVzLnNldChieXRlcyk7XG4gICAgbmV3Qnl0ZXNbYnl0ZXMubGVuZ3RoXSA9IDB4ODA7XG4gICAgYnl0ZXMgPSBuZXdCeXRlcztcbiAgICBjb25zdCBsID0gYnl0ZXMubGVuZ3RoIC8gNCArIDI7XG4gICAgY29uc3QgTiA9IE1hdGguY2VpbChsIC8gMTYpO1xuICAgIGNvbnN0IE0gPSBuZXcgQXJyYXkoTik7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBOOyArK2kpIHtcbiAgICAgICAgY29uc3QgYXJyID0gbmV3IFVpbnQzMkFycmF5KDE2KTtcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCAxNjsgKytqKSB7XG4gICAgICAgICAgICBhcnJbal0gPVxuICAgICAgICAgICAgICAgIChieXRlc1tpICogNjQgKyBqICogNF0gPDwgMjQpIHxcbiAgICAgICAgICAgICAgICAgICAgKGJ5dGVzW2kgKiA2NCArIGogKiA0ICsgMV0gPDwgMTYpIHxcbiAgICAgICAgICAgICAgICAgICAgKGJ5dGVzW2kgKiA2NCArIGogKiA0ICsgMl0gPDwgOCkgfFxuICAgICAgICAgICAgICAgICAgICBieXRlc1tpICogNjQgKyBqICogNCArIDNdO1xuICAgICAgICB9XG4gICAgICAgIE1baV0gPSBhcnI7XG4gICAgfVxuICAgIE1bTiAtIDFdWzE0XSA9ICgoYnl0ZXMubGVuZ3RoIC0gMSkgKiA4KSAvIE1hdGgucG93KDIsIDMyKTtcbiAgICBNW04gLSAxXVsxNF0gPSBNYXRoLmZsb29yKE1bTiAtIDFdWzE0XSk7XG4gICAgTVtOIC0gMV1bMTVdID0gKChieXRlcy5sZW5ndGggLSAxKSAqIDgpICYgMHhmZmZmZmZmZjtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IE47ICsraSkge1xuICAgICAgICBjb25zdCBXID0gbmV3IFVpbnQzMkFycmF5KDgwKTtcbiAgICAgICAgZm9yIChsZXQgdCA9IDA7IHQgPCAxNjsgKyt0KSB7XG4gICAgICAgICAgICBXW3RdID0gTVtpXVt0XTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGxldCB0ID0gMTY7IHQgPCA4MDsgKyt0KSB7XG4gICAgICAgICAgICBXW3RdID0gUk9UTChXW3QgLSAzXSBeIFdbdCAtIDhdIF4gV1t0IC0gMTRdIF4gV1t0IC0gMTZdLCAxKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgYSA9IEhbMF07XG4gICAgICAgIGxldCBiID0gSFsxXTtcbiAgICAgICAgbGV0IGMgPSBIWzJdO1xuICAgICAgICBsZXQgZCA9IEhbM107XG4gICAgICAgIGxldCBlID0gSFs0XTtcbiAgICAgICAgZm9yIChsZXQgdCA9IDA7IHQgPCA4MDsgKyt0KSB7XG4gICAgICAgICAgICBjb25zdCBzID0gTWF0aC5mbG9vcih0IC8gMjApO1xuICAgICAgICAgICAgY29uc3QgVCA9IChST1RMKGEsIDUpICsgZihzLCBiLCBjLCBkKSArIGUgKyBLW3NdICsgV1t0XSkgPj4+IDA7XG4gICAgICAgICAgICBlID0gZDtcbiAgICAgICAgICAgIGQgPSBjO1xuICAgICAgICAgICAgYyA9IFJPVEwoYiwgMzApID4+PiAwO1xuICAgICAgICAgICAgYiA9IGE7XG4gICAgICAgICAgICBhID0gVDtcbiAgICAgICAgfVxuICAgICAgICBIWzBdID0gKEhbMF0gKyBhKSA+Pj4gMDtcbiAgICAgICAgSFsxXSA9IChIWzFdICsgYikgPj4+IDA7XG4gICAgICAgIEhbMl0gPSAoSFsyXSArIGMpID4+PiAwO1xuICAgICAgICBIWzNdID0gKEhbM10gKyBkKSA+Pj4gMDtcbiAgICAgICAgSFs0XSA9IChIWzRdICsgZSkgPj4+IDA7XG4gICAgfVxuICAgIHJldHVybiBVaW50OEFycmF5Lm9mKEhbMF0gPj4gMjQsIEhbMF0gPj4gMTYsIEhbMF0gPj4gOCwgSFswXSwgSFsxXSA+PiAyNCwgSFsxXSA+PiAxNiwgSFsxXSA+PiA4LCBIWzFdLCBIWzJdID4+IDI0LCBIWzJdID4+IDE2LCBIWzJdID4+IDgsIEhbMl0sIEhbM10gPj4gMjQsIEhbM10gPj4gMTYsIEhbM10gPj4gOCwgSFszXSwgSFs0XSA+PiAyNCwgSFs0XSA+PiAxNiwgSFs0XSA+PiA4LCBIWzRdKTtcbn1cbmV4cG9ydHMuZGVmYXVsdCA9IHNoYTE7XG4iLCJpbXBvcnQgeyBFeHRlcm5hbFRyYWNrZXIgfSBmcm9tICcuL3RyYWNrZXInO1xuaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0IHsgZ2V0Q29uZmlnRnJvbVNjcmlwdEF0dHJpYnV0ZXMgfSBmcm9tICcuLi9jb25maWcvc2NyaXB0LWNvbmZpZyc7XG5pbXBvcnQgeyBjcmVhdGVUcmFja2VyIH0gZnJvbSAnLi4vY29uZmlnL2ZhY3RvcnknO1xuaW1wb3J0IHsgR0xPQkFMX1RSQUNLSU5HX0tFWSB9IGZyb20gJy4uL2NvbmZpZy9jb21tb24nO1xuXG4vKipcbiAqIEluaXRpYWxpemUgdHJhY2tlciBmcm9tIHNjcmlwdCBhdHRyaWJ1dGVzXG4gKiBcbiAqIEByZXR1cm5zIFRyYWNrZXIgaW5zdGFuY2UgaWYgc3VjY2Vzc2Z1bCwgbnVsbCBvdGhlcndpc2VcbiAqL1xuZXhwb3J0IGNvbnN0IGluaXRpYWxpemVGcm9tU2NyaXB0ID0gKCk6IEV4dGVybmFsVHJhY2tlciB8IG51bGwgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHNjcmlwdENvbmZpZyA9IGdldENvbmZpZ0Zyb21TY3JpcHRBdHRyaWJ1dGVzKCk7XG4gICAgXG4gICAgaWYgKCFzY3JpcHRDb25maWcpIHtcbiAgICAgIGxvZ2dlci5jcml0aWNhbCgnRmFpbGVkIHRvIGluaXRpYWxpemU6IGludmFsaWQgb3IgbWlzc2luZyBzY3JpcHQgYXR0cmlidXRlcycpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgbG9nZ2VyLmxvZygnSW5pdGlhbGl6aW5nIGZyb20gc2NyaXB0IGF0dHJpYnV0ZXMnKTtcbiAgICBcbiAgICB0cnkge1xuICAgICAgY29uc3QgdHJhY2tlciA9IGNyZWF0ZVRyYWNrZXIoc2NyaXB0Q29uZmlnKTtcbiAgICAgIFxuICAgICAgLy8gU3RvcmUgaW4gZ2xvYmFsIHRyYWNraW5nIG9iamVjdFxuICAgICAgY29uc3QgdyA9IHdpbmRvdyBhcyBhbnk7XG4gICAgICB3W0dMT0JBTF9UUkFDS0lOR19LRVldID0gd1tHTE9CQUxfVFJBQ0tJTkdfS0VZXSB8fCB7fTtcbiAgICAgIHdbR0xPQkFMX1RSQUNLSU5HX0tFWV0udHJhY2tlciA9IHRyYWNrZXI7XG4gICAgICB3W0dMT0JBTF9UUkFDS0lOR19LRVldLmNvbmZpZyA9IHNjcmlwdENvbmZpZztcbiAgICAgIFxuICAgICAgbG9nZ2VyLmxvZygnVHJhY2tlciBpbml0aWFsaXplZCBzdWNjZXNzZnVsbHknKTtcbiAgICAgIHJldHVybiB0cmFja2VyO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBsb2dnZXIuY3JpdGljYWwoJ0ZhaWxlZCB0byBjcmVhdGUgdHJhY2tlcjonLCBlcnJvcik7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgbG9nZ2VyLmNyaXRpY2FsKCdFcnJvciBkdXJpbmcgaW5pdGlhbGl6YXRpb246JywgZXJyb3IpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG59OyAiLCIvKipcbiAqIENvbW1vbiBjb25zdGFudHMgc2hhcmVkIGFjcm9zcyB0aGUgdHJhY2tpbmcgbGlicmFyeVxuICovXG5cbmV4cG9ydCBjb25zdCBBUElfRU5EUE9JTlRTID0ge1xuICBwcm9kdWN0aW9uOiAnaHR0cHM6Ly9iYWNrZW5kLmxlYWRjb25uZWN0b3JocS5jb20nLFxuICBzdGFnaW5nOiAnaHR0cHM6Ly9zdGFnaW5nLmJhY2tlbmQubGVhZGNvbm5lY3RvcmhxLmNvbScsXG4gIGxvY2FsOiAnaHR0cDovL2xvY2FsaG9zdDo2MTAwJyxcbn0gYXMgY29uc3Q7XG5cbmV4cG9ydCBjb25zdCBMT0dHRVJfUFJFRklYID0gJ1tMQyBUcmFja2luZ10nO1xuZXhwb3J0IGNvbnN0IExPR0dFUl9FUlJPUl9QUkVGSVggPSAnW0xDIFRyYWNraW5nIEVSUk9SXSc7XG5cbi8vIE5hbWUgb2YgdGhlIGdsb2JhbCB3aW5kb3cga2V5IGZvciB0b2dnbGVzIGFuZCByZWZlcmVuY2VzXG5leHBvcnQgY29uc3QgR0xPQkFMX1RSQUNLSU5HX0tFWSA9ICdfbGNUcmFja2luZyc7XG5cbi8vIFNjcmlwdCBiYXNlIG5hbWUgdG8gZGV0ZWN0IHJ1bm5pbmcgY29udGV4dFxuZXhwb3J0IGNvbnN0IFNDUklQVF9CQVNFTkFNRSA9ICdleHRlcm5hbC10cmFja2luZyc7XG5cblxuIiwiLyoqXG4gKiBJbnRlcmZhY2UgZm9yIGZvcm0gcGFyc2luZyByZXN1bHRzXG4gKi9cbmltcG9ydCB7IGlzUGFzc3dvcmRMaWtlRmllbGQgfSBmcm9tICcuL2ZpZWxkLXV0aWxzJztcblxuZXhwb3J0IGludGVyZmFjZSBGb3JtUGFyc2VSZXN1bHQge1xuICBmaWVsZERhdGE6IFJlY29yZDxzdHJpbmcsIGFueT47XG4gIGZpZWxkTGFiZWxzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG5cbi8qKlxuICogUGFyc2UgZm9ybSBkYXRhIGZyb20gSFRNTCBmb3JtIGVsZW1lbnQgd2l0aCBsYWJlbCBhbmFseXNpc1xuICogT25seSBjYXB0dXJlcyB2aXNpYmxlLCBlbmFibGVkIGZpZWxkcyB3aXRoIG5hbWUgYXR0cmlidXRlc1xuICogXG4gKiBAcGFyYW0gZm9ybSAtIEhUTUwgZm9ybSBlbGVtZW50IHRvIHBhcnNlXG4gKiBAcmV0dXJucyBPYmplY3QgY29udGFpbmluZyBmaWVsZCBkYXRhIGFuZCBsYWJlbHNcbiAqIFxuICogTG9naWMgZmxvdzpcbiAqIDEuIEV4dHJhY3QgZmllbGQgZGF0YSBmcm9tIGZvcm0gdXNpbmcgRm9ybURhdGEgQVBJXG4gKiAyLiBFeHRyYWN0IGZpZWxkIGxhYmVscyBieSBhbmFseXppbmcgZm9ybSBzdHJ1Y3R1cmVcbiAqIDMuIFJldHVybiBib3RoIGRhdGEgYW5kIGxhYmVscyBmb3IgY29tcGxldGUgZm9ybSBjb250ZXh0XG4gKi9cbmV4cG9ydCBjb25zdCBwYXJzZUZvcm1EYXRhID0gKGZvcm06IEhUTUxGb3JtRWxlbWVudCk6IEZvcm1QYXJzZVJlc3VsdCA9PiB7XG4gIGNvbnN0IGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKGZvcm0pO1xuICBjb25zdCBmaWVsZERhdGE6IFJlY29yZDxzdHJpbmcsIGFueT4gPSB7fTtcbiAgY29uc3QgZmllbGRMYWJlbHM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcbiAgXG4gIC8vIEV4dHJhY3QgZmllbGQgZGF0YSB3aXRoIFwibGFzdCB2YWx1ZSB3aW5zXCIgZm9yIGR1cGxpY2F0ZXNcbiAgZm9ybURhdGEuZm9yRWFjaCgodmFsdWUsIGtleSkgPT4ge1xuICAgIGZpZWxkRGF0YVtrZXldID0gdmFsdWU7XG4gIH0pO1xuICBcbiAgLy8gRXh0cmFjdCBmaWVsZCBsYWJlbHMgZm9yIG1hcHBpbmdcbiAgY29uc3QgaW5wdXRzID0gZm9ybS5xdWVyeVNlbGVjdG9yQWxsKCdpbnB1dCwgc2VsZWN0LCB0ZXh0YXJlYScpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGlucHV0cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGVsZW1lbnQgPSBpbnB1dHNbaV07XG4gICAgY29uc3QgaW5wdXQgPSBlbGVtZW50IGFzIEhUTUxJbnB1dEVsZW1lbnQgfCBIVE1MU2VsZWN0RWxlbWVudCB8IEhUTUxUZXh0QXJlYUVsZW1lbnQ7XG4gICAgY29uc3QgZmllbGROYW1lID0gaW5wdXQubmFtZTtcblxuICAgIC8vIFNraXAgaW52YWxpZCBvciBleGNsdWRlZCBmaWVsZHNcbiAgICBpZiAoIXNob3VsZEluY2x1ZGVGaWVsZChpbnB1dCwgZmllbGROYW1lLCBmaWVsZERhdGEpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBFeHRyYWN0IGxhYmVsIHRvIGV2YWx1YXRlIHNlbnNpdGl2aXR5IGFuZCBmb3IgbWFwcGluZyBpZiBub24tc2Vuc2l0aXZlXG4gICAgY29uc3QgbGFiZWxUZXh0ID0gZXh0cmFjdEZpZWxkTGFiZWwoZm9ybSwgaW5wdXQpO1xuICAgIFxuICAgIGlmIChpc1Bhc3N3b3JkTGlrZUZpZWxkKGlucHV0LCBsYWJlbFRleHQpKSB7XG4gICAgICAvLyBSZW1vdmUgYW55IHByZXZpb3VzbHkgY2FwdHVyZWQgdmFsdWUgZm9yIHRoaXMgc2Vuc2l0aXZlIGZpZWxkXG4gICAgICBpZiAoZmllbGROYW1lIGluIGZpZWxkRGF0YSkge1xuICAgICAgICBkZWxldGUgZmllbGREYXRhW2ZpZWxkTmFtZV07XG4gICAgICB9XG4gICAgICAvLyBEbyBub3QgcmVjb3JkIGEgbGFiZWwgZm9yIHNlbnNpdGl2ZSBmaWVsZHNcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIEV4dHJhY3QgbGFiZWwgdGV4dCBmb3IgdGhpcyBub24tc2Vuc2l0aXZlIGZpZWxkXG4gICAgaWYgKGxhYmVsVGV4dCkge1xuICAgICAgZmllbGRMYWJlbHNbZmllbGROYW1lXSA9IGxhYmVsVGV4dDtcbiAgICB9XG4gIH1cbiAgXG4gIHJldHVybiB7IGZpZWxkRGF0YSwgZmllbGRMYWJlbHMgfTtcbn07XG5cbi8qKlxuICogRGV0ZXJtaW5lcyBpZiBhIGZpZWxkIHNob3VsZCBiZSBpbmNsdWRlZCBpbiBmb3JtIGRhdGFcbiAqIFxuICogQHBhcmFtIGlucHV0IC0gSFRNTCBpbnB1dCBlbGVtZW50XG4gKiBAcGFyYW0gZmllbGROYW1lIC0gTmFtZSBhdHRyaWJ1dGUgb2YgdGhlIGZpZWxkXG4gKiBAcGFyYW0gZmllbGREYXRhIC0gQ3VycmVudCBmaWVsZCBkYXRhIG9iamVjdFxuICogQHJldHVybnMgYm9vbGVhbiBpbmRpY2F0aW5nIGlmIGZpZWxkIHNob3VsZCBiZSBpbmNsdWRlZFxuICovXG5jb25zdCBzaG91bGRJbmNsdWRlRmllbGQgPSAoXG4gIGlucHV0OiBIVE1MSW5wdXRFbGVtZW50IHwgSFRNTFNlbGVjdEVsZW1lbnQgfCBIVE1MVGV4dEFyZWFFbGVtZW50LFxuICBmaWVsZE5hbWU6IHN0cmluZyxcbiAgZmllbGREYXRhOiBSZWNvcmQ8c3RyaW5nLCBhbnk+XG4pOiBib29sZWFuID0+IHtcbiAgLy8gU2tpcCBmaWVsZHMgd2l0aG91dCBuYW1lIGF0dHJpYnV0ZVxuICBpZiAoIWZpZWxkTmFtZSkgcmV0dXJuIGZhbHNlO1xuICBcbiAgLy8gU2tpcCBoaWRkZW4gb3IgZGlzYWJsZWQgaW5wdXRzICBcbiAgaWYgKGlucHV0LmRpc2FibGVkKSByZXR1cm4gZmFsc2U7XG4gIGlmIChpbnB1dC50eXBlID09PSAnaGlkZGVuJykgcmV0dXJuIGZhbHNlO1xuICBcbiAgLy8gU2tpcCBpbnZpc2libGUgaW5wdXRzXG4gIGlmICghaXNGaWVsZFZpc2libGUoaW5wdXQpKSByZXR1cm4gZmFsc2U7XG4gIFxuICAvLyBTa2lwIGlmIGZpZWxkIGlzIG5vdCBpbiB0aGUgc3VibWl0dGVkIGZvcm0gZGF0YVxuICBpZiAoIShmaWVsZE5hbWUgaW4gZmllbGREYXRhKSkgcmV0dXJuIGZhbHNlO1xuICBcbiAgcmV0dXJuIHRydWU7XG59O1xuXG4vKipcbiAqIENoZWNrcyBpZiBhIGZvcm0gZmllbGQgaXMgdmlzaWJsZSB0byB0aGUgdXNlclxuICogXG4gKiBAcGFyYW0gaW5wdXQgLSBIVE1MIGlucHV0IGVsZW1lbnQgdG8gY2hlY2tcbiAqIEByZXR1cm5zIGJvb2xlYW4gaW5kaWNhdGluZyBpZiBmaWVsZCBpcyB2aXNpYmxlXG4gKi9cbmNvbnN0IGlzRmllbGRWaXNpYmxlID0gKGlucHV0OiBIVE1MSW5wdXRFbGVtZW50IHwgSFRNTFNlbGVjdEVsZW1lbnQgfCBIVE1MVGV4dEFyZWFFbGVtZW50KTogYm9vbGVhbiA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgY29tcHV0ZWRTdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGlucHV0KTtcbiAgICByZXR1cm4gIShcbiAgICAgIGNvbXB1dGVkU3R5bGUuZGlzcGxheSA9PT0gJ25vbmUnIHx8XG4gICAgICBjb21wdXRlZFN0eWxlLnZpc2liaWxpdHkgPT09ICdoaWRkZW4nIHx8XG4gICAgICAoY29tcHV0ZWRTdHlsZS5vcGFjaXR5ID8/ICcxJykgPT09ICcwJ1xuICAgICk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICAvLyBMb2cgZXJyb3JcbiAgICB0cnkgeyBjb25zb2xlLmVycm9yKCdMQyBUcmFja2luZyBmb3JtIHZpc2liaWxpdHkgY2hlY2sgZXJyb3I6JywgZSk7IH0gY2F0Y2gge31cbiAgICAvLyBJZiB3ZSBjYW4ndCBnZXQgY29tcHV0ZWQgc3R5bGUsIGFzc3VtZSB2aXNpYmxlXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn07XG5cbi8qKlxuICogRXh0cmFjdHMgbGFiZWwgdGV4dCBmb3IgYSBmb3JtIGZpZWxkIHVzaW5nIG11bHRpcGxlIHN0cmF0ZWdpZXNcbiAqIFxuICogQHBhcmFtIGZvcm0gLSBIVE1MIGZvcm0gZWxlbWVudFxuICogQHBhcmFtIGlucHV0IC0gSFRNTCBpbnB1dCBlbGVtZW50XG4gKiBAcmV0dXJucyBMYWJlbCB0ZXh0IG9yIGVtcHR5IHN0cmluZyBpZiBub3QgZm91bmRcbiAqL1xuY29uc3QgZXh0cmFjdEZpZWxkTGFiZWwgPSAoXG4gIGZvcm06IEhUTUxGb3JtRWxlbWVudCxcbiAgaW5wdXQ6IEhUTUxJbnB1dEVsZW1lbnQgfCBIVE1MU2VsZWN0RWxlbWVudCB8IEhUTUxUZXh0QXJlYUVsZW1lbnRcbik6IHN0cmluZyA9PiB7XG4gIC8vIFRyeSBleHBsaWNpdCBsYWJlbCBhc3NvY2lhdGlvbiBmaXJzdFxuICBsZXQgbGFiZWxUZXh0ID0gZ2V0TGFiZWxCeUZvckF0dHJpYnV0ZShmb3JtLCBpbnB1dCk7XG4gIGlmIChsYWJlbFRleHQpIHJldHVybiBsYWJlbFRleHQ7XG4gIFxuICAvLyBUcnkgcGFyZW50IGxhYmVsIGVsZW1lbnRcbiAgbGFiZWxUZXh0ID0gZ2V0UGFyZW50TGFiZWwoaW5wdXQpO1xuICBpZiAobGFiZWxUZXh0KSByZXR1cm4gbGFiZWxUZXh0O1xuICBcbiAgLy8gVHJ5IGFkamFjZW50IGxhYmVsIChwcmV2aW91cyBzaWJsaW5nKVxuICBsYWJlbFRleHQgPSBnZXRBZGphY2VudExhYmVsKGlucHV0KTtcbiAgaWYgKGxhYmVsVGV4dCkgcmV0dXJuIGxhYmVsVGV4dDtcbiAgXG4gIHJldHVybiAnJztcbn07XG5cbi8qKlxuICogR2V0cyBsYWJlbCB0ZXh0IHVzaW5nICdmb3InIGF0dHJpYnV0ZSBhc3NvY2lhdGlvblxuICogXG4gKiBAcGFyYW0gZm9ybSAtIEhUTUwgZm9ybSBlbGVtZW50XG4gKiBAcGFyYW0gaW5wdXQgLSBIVE1MIGlucHV0IGVsZW1lbnRcbiAqIEByZXR1cm5zIExhYmVsIHRleHQgb3IgZW1wdHkgc3RyaW5nXG4gKi9cbmNvbnN0IGdldExhYmVsQnlGb3JBdHRyaWJ1dGUgPSAoXG4gIGZvcm06IEhUTUxGb3JtRWxlbWVudCxcbiAgaW5wdXQ6IEhUTUxJbnB1dEVsZW1lbnQgfCBIVE1MU2VsZWN0RWxlbWVudCB8IEhUTUxUZXh0QXJlYUVsZW1lbnRcbik6IHN0cmluZyA9PiB7XG4gIGlmICghaW5wdXQuaWQpIHJldHVybiAnJztcbiAgXG4gIGNvbnN0IGFzc29jaWF0ZWRMYWJlbCA9IGZvcm0ucXVlcnlTZWxlY3RvcihgbGFiZWxbZm9yPVwiJHtpbnB1dC5pZH1cIl1gKSBhcyBIVE1MTGFiZWxFbGVtZW50O1xuICByZXR1cm4gYXNzb2NpYXRlZExhYmVsID8gKGFzc29jaWF0ZWRMYWJlbC50ZXh0Q29udGVudD8udHJpbSgpIHx8ICcnKSA6ICcnO1xufTtcblxuLyoqXG4gKiBHZXRzIGxhYmVsIHRleHQgZnJvbSBwYXJlbnQgbGFiZWwgZWxlbWVudFxuICogXG4gKiBAcGFyYW0gaW5wdXQgLSBIVE1MIGlucHV0IGVsZW1lbnRcbiAqIEByZXR1cm5zIExhYmVsIHRleHQgb3IgZW1wdHkgc3RyaW5nXG4gKi9cbmNvbnN0IGdldFBhcmVudExhYmVsID0gKGlucHV0OiBIVE1MSW5wdXRFbGVtZW50IHwgSFRNTFNlbGVjdEVsZW1lbnQgfCBIVE1MVGV4dEFyZWFFbGVtZW50KTogc3RyaW5nID0+IHtcbiAgY29uc3QgcGFyZW50TGFiZWwgPSBpbnB1dC5jbG9zZXN0KCdsYWJlbCcpIGFzIEhUTUxMYWJlbEVsZW1lbnQ7XG4gIGlmICghcGFyZW50TGFiZWwpIHJldHVybiAnJztcbiAgXG4gIC8vIENsb25lIGFuZCByZW1vdmUgY2hpbGQgaW5wdXRzIHRvIGdldCBjbGVhbiBsYWJlbCB0ZXh0XG4gIGNvbnN0IGNsb25lZExhYmVsID0gcGFyZW50TGFiZWwuY2xvbmVOb2RlKHRydWUpIGFzIEhUTUxMYWJlbEVsZW1lbnQ7XG4gIGNvbnN0IGNoaWxkSW5wdXRzID0gY2xvbmVkTGFiZWwucXVlcnlTZWxlY3RvckFsbCgnaW5wdXQsIHNlbGVjdCwgdGV4dGFyZWEnKTtcbiAgZm9yIChsZXQgaiA9IDA7IGogPCBjaGlsZElucHV0cy5sZW5ndGg7IGorKykge1xuICAgIGNoaWxkSW5wdXRzW2pdLnJlbW92ZSgpO1xuICB9XG4gIFxuICByZXR1cm4gY2xvbmVkTGFiZWwudGV4dENvbnRlbnQ/LnRyaW0oKSB8fCAnJztcbn07XG5cbi8qKlxuICogR2V0cyBsYWJlbCB0ZXh0IGZyb20gYWRqYWNlbnQgbGFiZWwgZWxlbWVudFxuICogXG4gKiBAcGFyYW0gaW5wdXQgLSBIVE1MIGlucHV0IGVsZW1lbnRcbiAqIEByZXR1cm5zIExhYmVsIHRleHQgb3IgZW1wdHkgc3RyaW5nXG4gKi9cbmNvbnN0IGdldEFkamFjZW50TGFiZWwgPSAoaW5wdXQ6IEhUTUxJbnB1dEVsZW1lbnQgfCBIVE1MU2VsZWN0RWxlbWVudCB8IEhUTUxUZXh0QXJlYUVsZW1lbnQpOiBzdHJpbmcgPT4ge1xuICBsZXQgcHJldlNpYmxpbmcgPSBpbnB1dC5wcmV2aW91c0VsZW1lbnRTaWJsaW5nO1xuICB3aGlsZSAocHJldlNpYmxpbmcpIHtcbiAgICBpZiAocHJldlNpYmxpbmcudGFnTmFtZSA9PT0gJ0xBQkVMJykge1xuICAgICAgcmV0dXJuIHByZXZTaWJsaW5nLnRleHRDb250ZW50Py50cmltKCkgfHwgJyc7XG4gICAgfVxuICAgIHByZXZTaWJsaW5nID0gcHJldlNpYmxpbmcucHJldmlvdXNFbGVtZW50U2libGluZztcbiAgfVxuICByZXR1cm4gJyc7XG59OyBcbiIsIi8qKlxuICogUXVldWUgc3lzdGVtIGZvciBib3QgcHJldmVudGlvbiB3aXRoIGNvbmZpZ3VyYWJsZSByYXRlIGxpbWl0aW5nXG4gKiBcbiAqIEBkZXNjcmlwdGlvbiBNYW5hZ2VzIGV2ZW50IHF1ZXVpbmcgYW5kIHJhdGUgbGltaXRpbmcgdG8gcHJldmVudCBib3QtbGlrZSBiZWhhdmlvclxuICogQGF1dGhvciBBc3Npc3RhbnRcbiAqL1xuXG5pbXBvcnQgeyBsb2dnZXIgfSBmcm9tICcuLi91dGlscyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUXVldWVkRXZlbnQge1xuICBpZDogc3RyaW5nO1xuICBwYXlsb2FkOiBhbnk7XG4gIHRpbWVzdGFtcDogbnVtYmVyO1xuICByZXRyeUNvdW50OiBudW1iZXI7XG4gIG1heFJldHJpZXM6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBRdWV1ZUNvbmZpZyB7XG4gIG1heEV2ZW50c1BlclNlY29uZDogbnVtYmVyO1xuICBtYXhSZXRyaWVzOiBudW1iZXI7XG4gIHJldHJ5RGVsYXlNczogbnVtYmVyO1xuICBtYXhRdWV1ZVNpemU6IG51bWJlcjtcbn1cblxuLyoqXG4gKiBFdmVudCBxdWV1ZSBzeXN0ZW0gd2l0aCByYXRlIGxpbWl0aW5nIGZvciBib3QgcHJldmVudGlvblxuICovXG5leHBvcnQgY2xhc3MgRXZlbnRRdWV1ZSB7XG4gIHByaXZhdGUgcXVldWU6IFF1ZXVlZEV2ZW50W10gPSBbXTtcbiAgcHJpdmF0ZSBwcm9jZXNzaW5nOiBib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgY29uZmlnOiBRdWV1ZUNvbmZpZztcbiAgcHJpdmF0ZSBldmVudFRpbWVzOiBudW1iZXJbXSA9IFtdO1xuICBwcml2YXRlIGV2ZW50SWRDb3VudGVyOiBudW1iZXIgPSAwO1xuXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogUXVldWVDb25maWcpIHtcbiAgICB0aGlzLmNvbmZpZyA9IHtcbiAgICAgIG1heEV2ZW50c1BlclNlY29uZDogY29uZmlnLm1heEV2ZW50c1BlclNlY29uZCB8fCA1LCAvLyBGaXhlZCByYXRlIGxpbWl0IGZvciBib3QgcHJldmVudGlvblxuICAgICAgbWF4UmV0cmllczogY29uZmlnLm1heFJldHJpZXMgfHwgMyxcbiAgICAgIHJldHJ5RGVsYXlNczogY29uZmlnLnJldHJ5RGVsYXlNcyB8fCAxMDAwLFxuICAgICAgbWF4UXVldWVTaXplOiBjb25maWcubWF4UXVldWVTaXplIHx8IDEwMCxcbiAgICB9O1xuICAgIFxuICAgIGxvZ2dlci5sb2coJ0V2ZW50UXVldWUgaW5pdGlhbGl6ZWQgd2l0aCBjb25maWc6JywgdGhpcy5jb25maWcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBldmVudCB0byBxdWV1ZSBmb3IgcHJvY2Vzc2luZ1xuICAgKiBcbiAgICogQHBhcmFtIHBheWxvYWQgLSBFdmVudCBwYXlsb2FkIHRvIGJlIHNlbnRcbiAgICogQHBhcmFtIG1heFJldHJpZXMgLSBNYXhpbXVtIG51bWJlciBvZiByZXRyeSBhdHRlbXB0cyBmb3IgdGhpcyBldmVudFxuICAgKiBAcmV0dXJucyBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiBldmVudCBpcyBwcm9jZXNzZWQgc3VjY2Vzc2Z1bGx5XG4gICAqL1xuICBhc3luYyBlbnF1ZXVlKHBheWxvYWQ6IGFueSwgbWF4UmV0cmllczogbnVtYmVyID0gdGhpcy5jb25maWcubWF4UmV0cmllcyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAvLyBDaGVjayBpZiBxdWV1ZSBpcyBmdWxsXG4gICAgICBpZiAodGhpcy5xdWV1ZS5sZW5ndGggPj0gdGhpcy5jb25maWcubWF4UXVldWVTaXplKSB7XG4gICAgICAgIGxvZ2dlci53YXJuKCdRdWV1ZSBpcyBmdWxsLCBkcm9wcGluZyBvbGRlc3QgZXZlbnQnKTtcbiAgICAgICAgdGhpcy5xdWV1ZS5zaGlmdCgpOyAvLyBSZW1vdmUgb2xkZXN0IGV2ZW50XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGV2ZW50OiBRdWV1ZWRFdmVudCA9IHtcbiAgICAgICAgaWQ6IGBldmVudF8keysrdGhpcy5ldmVudElkQ291bnRlcn1gLFxuICAgICAgICBwYXlsb2FkLFxuICAgICAgICB0aW1lc3RhbXA6IERhdGUubm93KCksXG4gICAgICAgIHJldHJ5Q291bnQ6IDAsXG4gICAgICAgIG1heFJldHJpZXMsXG4gICAgICB9O1xuXG4gICAgICAvLyBBZGQgcmVzb2x2ZS9yZWplY3QgY2FsbGJhY2tzIHRvIGV2ZW50IGZvciBwcm9taXNlIGhhbmRsaW5nXG4gICAgICAoZXZlbnQgYXMgYW55KS5yZXNvbHZlID0gcmVzb2x2ZTtcbiAgICAgIChldmVudCBhcyBhbnkpLnJlamVjdCA9IHJlamVjdDtcblxuICAgICAgdGhpcy5xdWV1ZS5wdXNoKGV2ZW50KTtcbiAgICAgIGxvZ2dlci5sb2coYEV2ZW50ICR7ZXZlbnQuaWR9IGFkZGVkIHRvIHF1ZXVlLiBRdWV1ZSBsZW5ndGg6ICR7dGhpcy5xdWV1ZS5sZW5ndGh9YCk7XG5cbiAgICAgIC8vIFN0YXJ0IHByb2Nlc3NpbmcgaWYgbm90IGFscmVhZHkgcnVubmluZ1xuICAgICAgaWYgKCF0aGlzLnByb2Nlc3NpbmcpIHtcbiAgICAgICAgdGhpcy5wcm9jZXNzUXVldWUoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcm9jZXNzIHF1ZXVlZCBldmVudHMgd2l0aCByYXRlIGxpbWl0aW5nXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHByb2Nlc3NRdWV1ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5wcm9jZXNzaW5nIHx8IHRoaXMucXVldWUubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5wcm9jZXNzaW5nID0gdHJ1ZTtcbiAgICBsb2dnZXIubG9nKCdTdGFydGluZyBxdWV1ZSBwcm9jZXNzaW5nJyk7XG5cbiAgICB3aGlsZSAodGhpcy5xdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBldmVudCA9IHRoaXMucXVldWVbMF07XG4gICAgICBcbiAgICAgIC8vIENoZWNrIGlmIHdlIGNhbiBzZW5kIHRoaXMgZXZlbnQgKHJhdGUgbGltaXRpbmcpXG4gICAgICBpZiAodGhpcy5jYW5TZW5kRXZlbnQoKSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIC8vIFJlbW92ZSBldmVudCBmcm9tIHF1ZXVlIGJlZm9yZSBwcm9jZXNzaW5nXG4gICAgICAgICAgdGhpcy5xdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIFJlY29yZCB0aGUgZXZlbnQgdGltZSBmb3IgcmF0ZSBsaW1pdGluZ1xuICAgICAgICAgIHRoaXMucmVjb3JkRXZlbnRUaW1lKCk7XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gUHJvY2VzcyB0aGUgZXZlbnRcbiAgICAgICAgICBhd2FpdCB0aGlzLnNlbmRFdmVudChldmVudCk7XG4gICAgICAgICAgXG4gICAgICAgICAgbG9nZ2VyLmxvZyhgRXZlbnQgJHtldmVudC5pZH0gcHJvY2Vzc2VkIHN1Y2Nlc3NmdWxseWApO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIFJlc29sdmUgdGhlIHByb21pc2VcbiAgICAgIGlmICgoZXZlbnQgYXMgYW55KT8ucmVzb2x2ZSkge1xuICAgICAgICAgICAgKGV2ZW50IGFzIGFueSkucmVzb2x2ZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBsb2dnZXIuZXJyb3IoYEVycm9yIHByb2Nlc3NpbmcgZXZlbnQgJHtldmVudC5pZH06YCwgZXJyb3IpO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIEhhbmRsZSByZXRyeSBsb2dpY1xuICAgICAgICAgIGlmICgoZXZlbnQ/LnJldHJ5Q291bnQgPz8gMCkgPCAoZXZlbnQ/Lm1heFJldHJpZXMgPz8gMCkpIHtcbiAgICAgICAgICAgIGV2ZW50LnJldHJ5Q291bnQrKztcbiAgICAgICAgICAgIGxvZ2dlci5sb2coYFJldHJ5aW5nIGV2ZW50ICR7ZXZlbnQuaWR9IChhdHRlbXB0ICR7ZXZlbnQucmV0cnlDb3VudH0vJHtldmVudC5tYXhSZXRyaWVzfSlgKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gQWRkIGJhY2sgdG8gcXVldWUgd2l0aCBkZWxheVxuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMucXVldWUudW5zaGlmdChldmVudCk7XG4gICAgICAgICAgICAgIGlmICghdGhpcy5wcm9jZXNzaW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcm9jZXNzUXVldWUoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgdGhpcy5jb25maWcucmV0cnlEZWxheU1zICogZXZlbnQucmV0cnlDb3VudCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxvZ2dlci5lcnJvcihgRXZlbnQgJHtldmVudC5pZH0gZmFpbGVkIGFmdGVyICR7ZXZlbnQubWF4UmV0cmllc30gcmV0cmllc2ApO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBSZWplY3QgdGhlIHByb21pc2VcbiAgICAgICAgICAgIGlmICgoZXZlbnQgYXMgYW55KT8ucmVqZWN0KSB7XG4gICAgICAgICAgICAgIChldmVudCBhcyBhbnkpLnJlamVjdChlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBXYWl0IGJlZm9yZSBjaGVja2luZyBhZ2FpblxuICAgICAgICBhd2FpdCB0aGlzLndhaXRGb3JSYXRlTGltaXQoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnByb2Nlc3NpbmcgPSBmYWxzZTtcbiAgICBsb2dnZXIubG9nKCdRdWV1ZSBwcm9jZXNzaW5nIGNvbXBsZXRlZCcpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIHdlIGNhbiBzZW5kIGFuIGV2ZW50IGJhc2VkIG9uIHJhdGUgbGltaXRpbmdcbiAgICogXG4gICAqIEByZXR1cm5zIGJvb2xlYW4gaW5kaWNhdGluZyBpZiBldmVudCBjYW4gYmUgc2VudFxuICAgKi9cbiAgcHJpdmF0ZSBjYW5TZW5kRXZlbnQoKTogYm9vbGVhbiB7XG4gICAgdGhpcy5jbGVhbnVwT2xkRXZlbnRUaW1lcygpO1xuICAgIHJldHVybiB0aGlzLmV2ZW50VGltZXMubGVuZ3RoIDwgdGhpcy5jb25maWcubWF4RXZlbnRzUGVyU2Vjb25kO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlY29yZCB0aGUgY3VycmVudCB0aW1lIGZvciByYXRlIGxpbWl0aW5nIGNhbGN1bGF0aW9uc1xuICAgKi9cbiAgcHJpdmF0ZSByZWNvcmRFdmVudFRpbWUoKTogdm9pZCB7XG4gICAgdGhpcy5ldmVudFRpbWVzLnB1c2goRGF0ZS5ub3coKSk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIGV2ZW50IHRpbWVzIG9sZGVyIHRoYW4gMSBzZWNvbmRcbiAgICovXG4gIHByaXZhdGUgY2xlYW51cE9sZEV2ZW50VGltZXMoKTogdm9pZCB7XG4gICAgY29uc3Qgb25lU2Vjb25kQWdvID0gRGF0ZS5ub3coKSAtIDEwMDA7XG4gICAgdGhpcy5ldmVudFRpbWVzID0gdGhpcy5ldmVudFRpbWVzLmZpbHRlcih0aW1lID0+IHRpbWUgPiBvbmVTZWNvbmRBZ28pO1xuICB9XG5cbiAgLyoqXG4gICAqIFdhaXQgZm9yIHJhdGUgbGltaXQgdG8gYWxsb3cgbmV4dCBldmVudFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyB3YWl0Rm9yUmF0ZUxpbWl0KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHdhaXRUaW1lID0gdGhpcy5jYWxjdWxhdGVXYWl0VGltZSgpO1xuICAgIGxvZ2dlci5sb2coYFJhdGUgbGltaXQgcmVhY2hlZCwgd2FpdGluZyAke3dhaXRUaW1lfW1zYCk7XG4gICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIHdhaXRUaW1lKSk7XG4gIH1cblxuICAvKipcbiAgICogQ2FsY3VsYXRlIGhvdyBsb25nIHRvIHdhaXQgYmVmb3JlIG5leHQgZXZlbnQgY2FuIGJlIHNlbnRcbiAgICogXG4gICAqIEByZXR1cm5zIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gd2FpdFxuICAgKi9cbiAgcHJpdmF0ZSBjYWxjdWxhdGVXYWl0VGltZSgpOiBudW1iZXIge1xuICAgIGlmICh0aGlzLmV2ZW50VGltZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG5cbiAgICBjb25zdCBvbGRlc3RFdmVudFRpbWUgPSB0aGlzLmV2ZW50VGltZXNbMF07XG4gICAgY29uc3QgdGltZVNpbmNlT2xkZXN0ID0gRGF0ZS5ub3coKSAtIG9sZGVzdEV2ZW50VGltZTtcbiAgICBjb25zdCB0aW1lVG9XYWl0ID0gTWF0aC5tYXgoMCwgMTAwMCAtIHRpbWVTaW5jZU9sZGVzdCk7XG4gICAgXG4gICAgcmV0dXJuIHRpbWVUb1dhaXQgKyAxMDsgLy8gQWRkIHNtYWxsIGJ1ZmZlclxuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgZXZlbnQgdXNpbmcgcHJvdmlkZWQgc2VuZGVyIGZ1bmN0aW9uXG4gICAqIFRoaXMgbWV0aG9kIHNob3VsZCBiZSBvdmVycmlkZGVuIG9yIGhhdmUgc2VuZGVyIGZ1bmN0aW9uIGluamVjdGVkXG4gICAqIFxuICAgKiBAcGFyYW0gX2V2ZW50IC0gRXZlbnQgdG8gc2VuZFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBzZW5kRXZlbnQoX2V2ZW50OiBRdWV1ZWRFdmVudCk6IFByb21pc2U8dm9pZD4ge1xuICAgIC8vIFRoaXMgd2lsbCBiZSBpbXBsZW1lbnRlZCBieSB0aGUgQXBpQ2xpZW50XG4gICAgdGhyb3cgbmV3IEVycm9yKCdzZW5kRXZlbnQgbWV0aG9kIG5vdCBpbXBsZW1lbnRlZCcpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgZXZlbnQgc2VuZGVyIGZ1bmN0aW9uXG4gICAqIFxuICAgKiBAcGFyYW0gc2VuZGVyIC0gRnVuY3Rpb24gdG8gc2VuZCBldmVudHNcbiAgICovXG4gIHNldFNlbmRlcihzZW5kZXI6IChwYXlsb2FkOiBhbnkpID0+IFByb21pc2U8dm9pZD4pOiB2b2lkIHtcbiAgICB0aGlzLnNlbmRFdmVudCA9IGFzeW5jIChldmVudDogUXVldWVkRXZlbnQpID0+IHtcbiAgICAgIGF3YWl0IHNlbmRlcihldmVudC5wYXlsb2FkKTtcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBjdXJyZW50IHF1ZXVlIHN0YXR1c1xuICAgKiBcbiAgICogQHJldHVybnMgT2JqZWN0IHdpdGggcXVldWUgc3RhdGlzdGljc1xuICAgKi9cbiAgZ2V0U3RhdHVzKCk6IHtcbiAgICBxdWV1ZUxlbmd0aDogbnVtYmVyO1xuICAgIHByb2Nlc3Npbmc6IGJvb2xlYW47XG4gICAgZXZlbnRzSW5MYXN0U2Vjb25kOiBudW1iZXI7XG4gICAgbWF4RXZlbnRzUGVyU2Vjb25kOiBudW1iZXI7XG4gIH0ge1xuICAgIHRoaXMuY2xlYW51cE9sZEV2ZW50VGltZXMoKTtcbiAgICByZXR1cm4ge1xuICAgICAgcXVldWVMZW5ndGg6IHRoaXMucXVldWUubGVuZ3RoLFxuICAgICAgcHJvY2Vzc2luZzogdGhpcy5wcm9jZXNzaW5nLFxuICAgICAgZXZlbnRzSW5MYXN0U2Vjb25kOiB0aGlzLmV2ZW50VGltZXMubGVuZ3RoLFxuICAgICAgbWF4RXZlbnRzUGVyU2Vjb25kOiB0aGlzLmNvbmZpZy5tYXhFdmVudHNQZXJTZWNvbmQsXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhciBhbGwgZXZlbnRzIGZyb20gcXVldWVcbiAgICovXG4gIGNsZWFyKCk6IHZvaWQge1xuICAgIHRoaXMucXVldWUuZm9yRWFjaChldmVudCA9PiB7XG4gICAgICBpZiAoKGV2ZW50IGFzIGFueSk/LnJlamVjdCkge1xuICAgICAgICAoZXZlbnQgYXMgYW55KS5yZWplY3QobmV3IEVycm9yKCdRdWV1ZSBjbGVhcmVkJykpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMucXVldWUgPSBbXTtcbiAgICB0aGlzLmV2ZW50VGltZXMgPSBbXTtcbiAgICBsb2dnZXIubG9nKCdRdWV1ZSBjbGVhcmVkJyk7XG4gIH1cbn0gIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlVSTCA9IGV4cG9ydHMuRE5TID0gZXhwb3J0cy5zdHJpbmdUb0J5dGVzID0gdm9pZCAwO1xuY29uc3QgcGFyc2VfanNfMSA9IHJlcXVpcmUoXCIuL3BhcnNlLmpzXCIpO1xuY29uc3Qgc3RyaW5naWZ5X2pzXzEgPSByZXF1aXJlKFwiLi9zdHJpbmdpZnkuanNcIik7XG5mdW5jdGlvbiBzdHJpbmdUb0J5dGVzKHN0cikge1xuICAgIHN0ciA9IHVuZXNjYXBlKGVuY29kZVVSSUNvbXBvbmVudChzdHIpKTtcbiAgICBjb25zdCBieXRlcyA9IG5ldyBVaW50OEFycmF5KHN0ci5sZW5ndGgpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGJ5dGVzW2ldID0gc3RyLmNoYXJDb2RlQXQoaSk7XG4gICAgfVxuICAgIHJldHVybiBieXRlcztcbn1cbmV4cG9ydHMuc3RyaW5nVG9CeXRlcyA9IHN0cmluZ1RvQnl0ZXM7XG5leHBvcnRzLkROUyA9ICc2YmE3YjgxMC05ZGFkLTExZDEtODBiNC0wMGMwNGZkNDMwYzgnO1xuZXhwb3J0cy5VUkwgPSAnNmJhN2I4MTEtOWRhZC0xMWQxLTgwYjQtMDBjMDRmZDQzMGM4JztcbmZ1bmN0aW9uIHYzNSh2ZXJzaW9uLCBoYXNoLCB2YWx1ZSwgbmFtZXNwYWNlLCBidWYsIG9mZnNldCkge1xuICAgIGNvbnN0IHZhbHVlQnl0ZXMgPSB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnID8gc3RyaW5nVG9CeXRlcyh2YWx1ZSkgOiB2YWx1ZTtcbiAgICBjb25zdCBuYW1lc3BhY2VCeXRlcyA9IHR5cGVvZiBuYW1lc3BhY2UgPT09ICdzdHJpbmcnID8gKDAsIHBhcnNlX2pzXzEuZGVmYXVsdCkobmFtZXNwYWNlKSA6IG5hbWVzcGFjZTtcbiAgICBpZiAodHlwZW9mIG5hbWVzcGFjZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgbmFtZXNwYWNlID0gKDAsIHBhcnNlX2pzXzEuZGVmYXVsdCkobmFtZXNwYWNlKTtcbiAgICB9XG4gICAgaWYgKG5hbWVzcGFjZT8ubGVuZ3RoICE9PSAxNikge1xuICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ05hbWVzcGFjZSBtdXN0IGJlIGFycmF5LWxpa2UgKDE2IGl0ZXJhYmxlIGludGVnZXIgdmFsdWVzLCAwLTI1NSknKTtcbiAgICB9XG4gICAgbGV0IGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoMTYgKyB2YWx1ZUJ5dGVzLmxlbmd0aCk7XG4gICAgYnl0ZXMuc2V0KG5hbWVzcGFjZUJ5dGVzKTtcbiAgICBieXRlcy5zZXQodmFsdWVCeXRlcywgbmFtZXNwYWNlQnl0ZXMubGVuZ3RoKTtcbiAgICBieXRlcyA9IGhhc2goYnl0ZXMpO1xuICAgIGJ5dGVzWzZdID0gKGJ5dGVzWzZdICYgMHgwZikgfCB2ZXJzaW9uO1xuICAgIGJ5dGVzWzhdID0gKGJ5dGVzWzhdICYgMHgzZikgfCAweDgwO1xuICAgIGlmIChidWYpIHtcbiAgICAgICAgb2Zmc2V0ID0gb2Zmc2V0IHx8IDA7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTY7ICsraSkge1xuICAgICAgICAgICAgYnVmW29mZnNldCArIGldID0gYnl0ZXNbaV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGJ1ZjtcbiAgICB9XG4gICAgcmV0dXJuICgwLCBzdHJpbmdpZnlfanNfMS51bnNhZmVTdHJpbmdpZnkpKGJ5dGVzKTtcbn1cbmV4cG9ydHMuZGVmYXVsdCA9IHYzNTtcbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBzdGFydHVwXG4vLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbi8vIFRoaXMgZW50cnkgbW9kdWxlIGlzIHJlZmVyZW5jZWQgYnkgb3RoZXIgbW9kdWxlcyBzbyBpdCBjYW4ndCBiZSBpbmxpbmVkXG52YXIgX193ZWJwYWNrX2V4cG9ydHNfXyA9IF9fd2VicGFja19yZXF1aXJlX18oMTU2KTtcbiJdLCJuYW1lcyI6WyJyb290IiwiZmFjdG9yeSIsImV4cG9ydHMiLCJtb2R1bGUiLCJkZWZpbmUiLCJhbWQiLCJzZWxmIiwidGhpcyIsIk9iamVjdCIsImRlZmluZVByb3BlcnR5IiwidmFsdWUiLCJ1bnNhZmVTdHJpbmdpZnkiLCJ2YWxpZGF0ZV9qc18xIiwiYnl0ZVRvSGV4IiwiaSIsInB1c2giLCJ0b1N0cmluZyIsInNsaWNlIiwiYXJyIiwib2Zmc2V0IiwidG9Mb3dlckNhc2UiLCJ1dWlkIiwiZGVmYXVsdCIsIlR5cGVFcnJvciIsImNvbnN0cnVjdG9yIiwiY29uZmlnIiwic3RhdGUiLCJpbml0aWFsaXplZCIsInRyYWNraW5nSWQiLCJhcGlDbGllbnQiLCJBcGlDbGllbnQiLCJhcGlFbmRwb2ludCIsImRlYnVnIiwidyIsIndpbmRvdyIsIkdMT0JBTF9UUkFDS0lOR19LRVkiLCJsb2dnZXIiLCJsb2ciLCJpbml0Iiwid2FybiIsImxvY2F0aW9uSWQiLCJmZXRjaExvY2F0aW9uSWQiLCJzZXNzaW9uSWQiLCJnZW5lcmF0ZVNlc3Npb25JZCIsInN0b3JlU2Vzc2lvbklkSW5Db29raWUiLCJzZXRUcmFja2luZ0NvbnRleHQiLCJzdGFydFBhZ2VUcmFja2luZyIsImFzeW5jIiwiZXZlbnQiLCJwcm9wZXJ0aWVzIiwic2VuZEV2ZW50Iiwic3RhcnRGb3JtVHJhY2tpbmciLCJzdWJtaXRGb3JtIiwiZXJyb3IiLCJ1c2VySWQiLCJ1c2VyUHJvcGVydGllcyIsImNyZWF0ZVRyYWNrZXIiLCJ2YWxpZGF0ZUNvbmZpZyIsIkVycm9yIiwiY3JpdGljYWwiLCJ0cmFja2VyIiwiRXh0ZXJuYWxUcmFja2VyIiwiaW5pdGlhbGl6ZUZyb21TY3JpcHQiLCJpbml0aWFsaXplIiwidmVyc2lvbiIsInZhbGlkYXRlIiwidjciLCJ2NlRvVjEiLCJ2NiIsInY1IiwidjQiLCJ2MyIsInYxVG9WNiIsInYxIiwic3RyaW5naWZ5IiwicGFyc2UiLCJOSUwiLCJNQVgiLCJtYXhfanNfMSIsImVudW1lcmFibGUiLCJnZXQiLCJuaWxfanNfMSIsInBhcnNlX2pzXzEiLCJzdHJpbmdpZnlfanNfMSIsInYxX2pzXzEiLCJ2MVRvVjZfanNfMSIsInYzX2pzXzEiLCJ2NF9qc18xIiwidjVfanNfMSIsInY2X2pzXzEiLCJ2NlRvVjFfanNfMSIsInY3X2pzXzEiLCJ2ZXJzaW9uX2pzXzEiLCJwYXJzZUZvcm1EYXRhIiwiY29udGFpbnNQYXNzd29yZCIsImlzUGFzc3dvcmRMaWtlRmllbGQiLCJnZXRDb29raWUiLCJuYW1lIiwicGFydHMiLCJkb2N1bWVudCIsImNvb2tpZSIsInNwbGl0IiwibGVuZ3RoIiwicG9wIiwic2hpZnQiLCJlIiwic2V0Q29va2llIiwiZGF5cyIsImRhdGUiLCJEYXRlIiwic2V0VGltZSIsImdldFRpbWUiLCJleHBpcmVzIiwidG9VVENTdHJpbmciLCJzdG9yZVVzZXJEYXRhIiwiZGF0YSIsImxvY2FsU3RvcmFnZSIsInNldEl0ZW0iLCJKU09OIiwiZ2V0VXNlckRhdGEiLCJnZXRJdGVtIiwicGFyc2VkIiwiY2lkIiwiY3VzdG9tZXJfaWQiLCJub3JtYWxpemVkIiwiU3RyaW5nIiwidHJpbSIsImNvbnRhY3RJZCIsImNvb2tpZU5hbWUiLCJzZXNzaW9uU3RvcmFnZSIsImFwaSIsImdldFNlc3Npb25JZEZyb21Db29raWUiLCJjb29raWVSZXN1bHQiLCJzZXNzaW9uU3RvcmFnZVJlc3VsdCIsImdldEZyb21TdG9yYWdlIiwia2V5Iiwic2V0SW5TdG9yYWdlIiwiZGVib3VuY2UiLCJmdW5jIiwid2FpdCIsInRpbWVvdXQiLCJhcmdzIiwiY2xlYXJUaW1lb3V0Iiwic2V0VGltZW91dCIsImdldFBhZ2VNZXRhZGF0YSIsInRpdGxlIiwidXJsIiwibG9jYXRpb24iLCJocmVmIiwicGF0aCIsInBhdGhuYW1lIiwicmVmZXJyZXIiLCJ1c2VyQWdlbnQiLCJuYXZpZ2F0b3IiLCJnZXRMb2NhbFRpbWVab25lIiwiSW50bCIsIkRhdGVUaW1lRm9ybWF0IiwicmVzb2x2ZWRPcHRpb25zIiwidGltZVpvbmUiLCJnZXRMb2NhbFRpbWVab25lT2Zmc2V0IiwibWF0Y2giLCJnZXRGb3JtYXR0ZWRUaW1lem9uZSIsImdldEZvcm1JZGVudGlmaWVyIiwidGFyZ2V0Rm9ybSIsIkhUTUxGb3JtRWxlbWVudCIsInF1ZXJ5U2VsZWN0b3IiLCJodG1sRm9ybSIsImlkIiwiZ2V0QXR0cmlidXRlIiwidjFCeXRlcyIsInY2Qnl0ZXMiLCJVaW50OEFycmF5Iiwib2YiLCJuYXRpdmVfanNfMSIsInJuZ19qc18xIiwib3B0aW9ucyIsImJ1ZiIsInJhbmRvbVVVSUQiLCJybmRzIiwicmFuZG9tIiwicm5nIiwiUmFuZ2VFcnJvciIsImdldFJhbmRvbVZhbHVlcyIsInJuZHM4IiwiY3J5cHRvIiwiYmluZCIsInVwZGF0ZVY3U3RhdGUiLCJfc3RhdGUiLCJub3ciLCJtc2VjcyIsInNlcSIsInY3Qnl0ZXMiLCJieXRlcyIsImdldE91dHB1dExlbmd0aCIsImlucHV0TGVuZ3RoOCIsInNhZmVBZGQiLCJ4IiwieSIsImxzdyIsIm1kNWNtbiIsInEiLCJhIiwiYiIsInMiLCJ0IiwibnVtIiwiY250IiwibWQ1ZmYiLCJjIiwiZCIsIm1kNWdnIiwibWQ1aGgiLCJtZDVpaSIsImlucHV0IiwidWludDMyVG9VaW50OCIsImxlbiIsInhwYWQiLCJVaW50MzJBcnJheSIsImZpbGwiLCJzZXQiLCJvbGRhIiwib2xkYiIsIm9sZGMiLCJvbGRkIiwid29yZHNUb01kNSIsIm91dHB1dCIsInVpbnQ4VG9VaW50MzIiLCJfdjYiLCJ2YWwiLCJpbmNsdWRlcyIsImxhYmVsVGV4dCIsInR5cGUiLCJwbGFjZWhvbGRlciIsInVwZGF0ZVYxU3RhdGUiLCJuc2VjcyIsIm5vZGUiLCJ1bmRlZmluZWQiLCJjbG9ja3NlcSIsInRsIiwidG1oIiwibiIsImlzVjYiLCJvcHRpb25zS2V5cyIsImtleXMiLCJkZXRlcm1pbmVBcGlFbmRwb2ludCIsInF1ZXVlQ29uZmlnIiwibWF4RXZlbnRzUGVyU2Vjb25kIiwibWF4UmV0cmllcyIsInJldHJ5RGVsYXlNcyIsIm1heFF1ZXVlU2l6ZSIsImV2ZW50UXVldWUiLCJFdmVudFF1ZXVlIiwic2V0U2VuZGVyIiwicGF5bG9hZCIsInNlbmRFdmVudERpcmVjdGx5IiwiY3VycmVudFNjcmlwdCIsIlNDUklQVF9CQVNFTkFNRSIsInNyYyIsInNjcmlwdFNyYyIsIkFQSV9FTkRQT0lOVFMiLCJzdGFnaW5nIiwibG9jYWwiLCJwcm9kdWN0aW9uIiwicmVzcG9uc2UiLCJmZXRjaCIsIm9rIiwic3RhdHVzVGV4dCIsImpzb24iLCJ1c2VyRGF0YSIsImVuaGFuY2VkRXZlbnQiLCJFdmVudFR5cGUiLCJGT1JNX1NVQk1JU1NJT04iLCJmb3JtRXZlbnQiLCJlbmhhbmNlZEZvcm1FdmVudCIsImZvcm1EYXRhIiwiVGltZXpvbmUiLCJ0aW1lem9uZSIsImVucXVldWUiLCJtZXRob2QiLCJoZWFkZXJzIiwiYm9keSIsImdldENvbmZpZ0Zyb21TY3JpcHRBdHRyaWJ1dGVzIiwiVVJMIiwiRE5TIiwic2hhMV9qc18xIiwidjM1X2pzXzEiLCJ2MzVfanNfMiIsIm5hbWVzcGFjZSIsIm1kNV9qc18xIiwibWVzc2FnZSIsImlzRGVidWdNb2RlIiwiY29uc29sZSIsIkxPR0dFUl9QUkVGSVgiLCJMT0dHRVJfRVJST1JfUFJFRklYIiwiQm9vbGVhbiIsImNhbGxiYWNrIiwibWV0YWRhdGEiLCJmb3JtSWQiLCJTQ1JJUFRfUEFHRV9WSUVXIiwidGltZXN0YW1wIiwiZm9ybSIsImFkZEV2ZW50TGlzdGVuZXIiLCJfZXZlbnQiLCJoYW5kbGVGb3JtU3VibWl0IiwiY2FwdHVyZSIsImZvcm1JZGVudGlmaWVyIiwiZmllbGREYXRhIiwiZmllbGRMYWJlbHMiLCJ0cmFja2luZ0V2ZW50IiwiZm9ybUxhYmVscyIsInJlZ2V4X2pzXzEiLCJ0ZXN0IiwicGFyc2VJbnQiLCJ2IiwiZiIsInoiLCJST1RMIiwiSyIsIkgiLCJuZXdCeXRlcyIsImwiLCJOIiwiTWF0aCIsImNlaWwiLCJNIiwiQXJyYXkiLCJqIiwicG93IiwiZmxvb3IiLCJXIiwiVCIsInNjcmlwdENvbmZpZyIsIkZvcm1EYXRhIiwiZm9yRWFjaCIsImlucHV0cyIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJmaWVsZE5hbWUiLCJzaG91bGRJbmNsdWRlRmllbGQiLCJleHRyYWN0RmllbGRMYWJlbCIsImRpc2FibGVkIiwiaXNGaWVsZFZpc2libGUiLCJjb21wdXRlZFN0eWxlIiwiZ2V0Q29tcHV0ZWRTdHlsZSIsImRpc3BsYXkiLCJ2aXNpYmlsaXR5Iiwib3BhY2l0eSIsImdldExhYmVsQnlGb3JBdHRyaWJ1dGUiLCJnZXRQYXJlbnRMYWJlbCIsImdldEFkamFjZW50TGFiZWwiLCJhc3NvY2lhdGVkTGFiZWwiLCJ0ZXh0Q29udGVudCIsInBhcmVudExhYmVsIiwiY2xvc2VzdCIsImNsb25lZExhYmVsIiwiY2xvbmVOb2RlIiwiY2hpbGRJbnB1dHMiLCJyZW1vdmUiLCJwcmV2U2libGluZyIsInByZXZpb3VzRWxlbWVudFNpYmxpbmciLCJ0YWdOYW1lIiwicXVldWUiLCJwcm9jZXNzaW5nIiwiZXZlbnRUaW1lcyIsImV2ZW50SWRDb3VudGVyIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJyZXRyeUNvdW50IiwicHJvY2Vzc1F1ZXVlIiwiY2FuU2VuZEV2ZW50IiwicmVjb3JkRXZlbnRUaW1lIiwidW5zaGlmdCIsIndhaXRGb3JSYXRlTGltaXQiLCJjbGVhbnVwT2xkRXZlbnRUaW1lcyIsIm9uZVNlY29uZEFnbyIsImZpbHRlciIsInRpbWUiLCJ3YWl0VGltZSIsImNhbGN1bGF0ZVdhaXRUaW1lIiwib2xkZXN0RXZlbnRUaW1lIiwidGltZVNpbmNlT2xkZXN0IiwibWF4Iiwic2VuZGVyIiwiZ2V0U3RhdHVzIiwicXVldWVMZW5ndGgiLCJldmVudHNJbkxhc3RTZWNvbmQiLCJjbGVhciIsInN0cmluZ1RvQnl0ZXMiLCJzdHIiLCJ1bmVzY2FwZSIsImVuY29kZVVSSUNvbXBvbmVudCIsImNoYXJDb2RlQXQiLCJoYXNoIiwidmFsdWVCeXRlcyIsIm5hbWVzcGFjZUJ5dGVzIiwiX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fIiwiX193ZWJwYWNrX2V4cG9ydHNfXyIsIl9fd2VicGFja19yZXF1aXJlX18iLCJtb2R1bGVJZCIsImNhY2hlZE1vZHVsZSIsIl9fd2VicGFja19tb2R1bGVzX18iLCJjYWxsIl0sInNvdXJjZVJvb3QiOiIifQ==
