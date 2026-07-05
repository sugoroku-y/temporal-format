function e(...t) {
	let n = Array.isArray(t[0]) ? t[0].reduce((e, n, r) => `${e}${t[r]}${n}`) : t[0], r = Error(n);
	throw Error.captureStackTrace(r, e), r;
}
function t(t, n) {
	t || e(n ?? "Assertion failed");
}
var n = {
	y: {
		l: [2, 4],
		p: ["year"]
	},
	M: {
		l: [
			1,
			2,
			3,
			4
		],
		p: ["monthCode"]
	},
	d: {
		l: [1, 2],
		p: ["day"]
	},
	E: {
		l: [
			1,
			2,
			3,
			4
		],
		p: ["dayOfWeek"]
	},
	a: {
		l: [1],
		p: ["hour"]
	},
	H: {
		l: [1, 2],
		p: ["hour"]
	},
	h: {
		l: [1, 2],
		p: ["hour"]
	},
	m: {
		l: [1, 2],
		p: ["minute"]
	},
	s: {
		l: [1, 2],
		p: ["second"]
	},
	S: {
		l: [
			1,
			2,
			3,
			4,
			5,
			6,
			7,
			8,
			9
		],
		p: [
			"millisecond",
			"microsecond",
			"nanosecond"
		]
	},
	X: {
		l: [
			1,
			2,
			3
		],
		p: ["offset"]
	},
	x: {
		l: [
			1,
			2,
			3
		],
		p: ["offset"]
	}
}, r = {
	"en-US": {
		month: {
			short: {
				M01: "Jan",
				M02: "Feb",
				M03: "Mar",
				M04: "Apr",
				M05: "May",
				M06: "Jun",
				M07: "Jul",
				M08: "Aug",
				M09: "Sep",
				M10: "Oct",
				M11: "Nov",
				M12: "Dec"
			},
			long: {
				M01: "January",
				M02: "February",
				M03: "March",
				M04: "April",
				M05: "May",
				M06: "June",
				M07: "July",
				M08: "August",
				M09: "September",
				M10: "October",
				M11: "November",
				M12: "December"
			}
		},
		dayOfWeek: {
			short: [
				"Mon",
				"Tue",
				"Wed",
				"Thu",
				"Fri",
				"Sat",
				"Sun"
			],
			long: [
				"Monday",
				"Tuesday",
				"Wednesday",
				"Thursday",
				"Friday",
				"Saturday",
				"Sunday"
			]
		},
		dayPeriod: { amPm: ["AM", "PM"] }
	},
	"ja-JP": {
		month: {
			short: {
				M01: "1月",
				M02: "2月",
				M03: "3月",
				M04: "4月",
				M05: "5月",
				M06: "6月",
				M07: "7月",
				M08: "8月",
				M09: "9月",
				M10: "10月",
				M11: "11月",
				M12: "12月"
			},
			long: {
				M01: "1月",
				M02: "2月",
				M03: "3月",
				M04: "4月",
				M05: "5月",
				M06: "6月",
				M07: "7月",
				M08: "8月",
				M09: "9月",
				M10: "10月",
				M11: "11月",
				M12: "12月"
			}
		},
		dayOfWeek: {
			short: [
				"月",
				"火",
				"水",
				"木",
				"金",
				"土",
				"日"
			],
			long: [
				"月曜日",
				"火曜日",
				"水曜日",
				"木曜日",
				"金曜日",
				"土曜日",
				"日曜日"
			]
		},
		dayPeriod: { amPm: ["午前", "午後"] }
	}
}, i = [
	"year",
	"monthCode",
	"day",
	"hour",
	"minute",
	"second",
	"millisecond",
	"microsecond",
	"nanosecond"
], a = {
	y: 1,
	M: 1,
	d: 1,
	a: 1,
	H: 1,
	h: 1,
	m: 1,
	s: 1,
	S: 1
}, o = {
	x: 1,
	X: 1
};
function s(e, t) {
	return e in t;
}
function c(e, t = 2) {
	return String(e).padStart(t, "0");
}
function l(e) {
	return s(e[0], n) && n[e[0]].l.includes(e[1]);
}
var u = /* @__PURE__ */ new Map();
function d(n) {
	let r = u.get(n);
	if (r) return r.result ?? e`${r.error}: ${n}`;
	try {
		let r = !1, i = [], a = (e) => {
			t(l(e), `無効な書式指定子です: ${e[0].repeat(e[1])}`), i.push(e), r = !0;
		}, o = (e) => {
			i.length > 0 && typeof i[i.length - 1] == "string" ? i[i.length - 1] += e : i.push(e);
		}, s = 0;
		for (let { index: e, 0: r, 1: i, 2: c, 3: l, 4: u } of n.matchAll(/([A-Za-z])\1*|(['"])([^'"]*(?:(?:''|"")[^'"]*)*)(['"]|$)/g)) {
			if (s < e && o(n.slice(s, e)), s = e + r.length, r === "''" || r === "\"\"") {
				o(r.charAt(0));
				continue;
			}
			if (c) {
				t(u, `引用符${c}が閉じられていません`), t(c === u, `単独の引用符${u}が使われています`), o(l.replace(/(['"])\1/g, "$1"));
				continue;
			}
			a([i, r.length]);
		}
		return s < n.length && o(n.slice(s)), r || e`書式文字列がありません`, u.set(n, { result: i }), i;
	} catch (r) {
		t(r instanceof Error), u.set(n, { error: r.message }), e(`${r.message}: ${n}`);
	}
}
function f(e, r, i, c) {
	let l = !1, u = !1, d = !1, f = !1;
	for (let c of e) {
		if (typeof c == "string") continue;
		let [e, p] = c;
		for (let a of n[e].p) t(s(a, r), `${r.constructor.name}にはプロパティ${a}がありません: ${e.repeat(p)}: ${i}`);
		l ||= e in a, u ||= e === "a", d ||= e === "h", f ||= e in o;
	}
	c !== "format" && (t("with" in r && typeof r.with == "function", `${r.constructor.name}にはメソッドwithがありません`), f && t("withTimeZone" in r && typeof r.withTimeZone == "function", `${r.constructor.name}にはメソッドwithTimeZoneがありません`), t(l, `日付か時刻の書式文字列がありません: ${i}`), u ? t(d, `午前/午後(a)がある場合、12時間表記(h/hh)も必要です: ${i}`) : t(!d, `12時間表記(h/hh)がある場合、午前/午後(a)も必要です: ${i}`));
}
function p(e, t) {
	return e.replace({
		1: /\D0?/g,
		2: /\D/g
	}[t], "");
}
function m(e, t, n) {
	let i = r[t].month[n];
	return s(e, i) ? i[e] : e;
}
function h(e, t, n) {
	return r[t].dayOfWeek[n][e - 1];
}
function g({ millisecond: e, microsecond: t, nanosecond: n }, r) {
	return `${c(e, 3)}${r > 3 ? c(t, 3) : ""}${r > 6 ? c(n, 3) : ""}`.slice(0, r);
}
function _(e, t, n) {
	return n && e === "+00:00" ? "Z" : e.replace({
		1: /:(?:00)?/,
		2: /:/,
		3: /^/
	}[t], "");
}
function v(e, t) {
	return {
		1: (e) => String(e),
		2: (e) => c(e)
	}[t](e);
}
var y = {
	y: ({ year: e }, t) => ({
		2: (e) => c(e % 100),
		4: (e) => String(e)
	})[t](e),
	M: ({ monthCode: e }, t, { locale: n }) => ({
		1: (e) => p(e, 1),
		2: (e) => p(e, 2),
		3: (e, t) => m(e, t, "short"),
		4: (e, t) => m(e, t, "long")
	})[t](e, n),
	d: ({ day: e }, t) => v(e, t),
	H: ({ hour: e }, t) => v(e, t),
	h: ({ hour: e }, t) => v((e + 11) % 12 + 1, t),
	a: ({ hour: e }, t, { locale: n }) => r[n].dayPeriod.amPm[Math.floor(e / 12)],
	m: ({ minute: e }, t) => v(e, t),
	s: ({ second: e }, t) => v(e, t),
	S: (e, t) => g(e, t),
	E: ({ dayOfWeek: e }, t, { locale: n }) => h(e, n, t === 4 ? "long" : "short"),
	X: ({ offset: e }, t) => _(e, t, !0),
	x: ({ offset: e }, t) => _(e, t)
};
function b(e, n, { locale: i = "en-US" } = {}) {
	t(s(i, r), `サポートしていないロケール: ${i}`), t(e.calendarId === void 0 || e.calendarId === "iso8601", `対応していないカレンダーです: ${e.calendarId}`);
	let a = { locale: i }, o = d(n);
	f(o, e, n, "format");
	let c = [];
	for (let t of o) {
		if (typeof t == "string") {
			c.push(t);
			continue;
		}
		let [n, r] = t, i = y[n];
		c.push(i(e, r, a));
	}
	return c.join("");
}
function x(e, t) {
	return e.input.startsWith(t, e.index) ? (e.index += t.length, !0) : !1;
}
function S(e, n) {
	t(n.global && n.sticky, `Pattern must have 'g' and 'y' flags: ${n}`), n.lastIndex = e.index;
	let r = n.exec(e.input);
	return r ? (e.index += r[0].length, r) : null;
}
function C(t, n, r) {
	for (let [e, r] of n.entries()) if (x(t, r)) return [e, r];
	e(`${r} not found`);
}
function w(e, t) {
	let n = e + 50;
	return t + (Math.floor(n / 100) - (t < n % 100 ? 0 : 1)) * 100;
}
function T(n, r) {
	let [i] = S(n, {
		2: /\d{2}/gy,
		4: /\d{4}/gy
	}[r]) ?? e`Year not found`, a = parseInt(i, 10);
	if (r === 4) {
		n.result.year = a;
		return;
	}
	t(n.referenceYear !== void 0), n.result.year = w(n.referenceYear, a);
}
function E(t, n) {
	if (n === 1 || n === 2) {
		let [r] = S(t, {
			1: /1[0-2]?|[2-9]/gsy,
			2: /0[1-9]|1[0-2]/gsy
		}[n]) ?? e`Month not found`;
		t.result.monthCode = `M${r.padStart(2, "0")}`;
		return;
	}
	let i = n === 3 ? "short" : "long", a = r[t.locale].month[i];
	for (let [e, n] of Object.entries(a)) if (x(t, n)) {
		t.result.monthCode = e;
		return;
	}
	e(`Month not found for type ${i} in locale ${t.locale}`);
}
function D(t, n, r) {
	let [i] = S(t, n) ?? e`${r} not found`;
	t.result[r] = parseInt(i, 10);
}
function O(e) {
	let [t] = C(e, r[e.locale].dayPeriod.amPm, "day period");
	e.isPm = t === 1;
}
function k(t, n) {
	let [r] = S(t, {
		1: /\d/gy,
		2: /\d{1,2}/gy,
		3: /\d{1,3}/gy,
		4: /\d{1,4}/gy,
		5: /\d{1,5}/gy,
		6: /\d{1,6}/gy,
		7: /\d{1,7}/gy,
		8: /\d{1,8}/gy,
		9: /\d{1,9}/gy
	}[n]) ?? e`Fractional second not found`;
	t.result.millisecond = parseInt(r.slice(0, 3).padEnd(3, "0"), 10), t.result.microsecond = r.length > 3 ? parseInt(r.slice(3, 6).padEnd(3, "0"), 10) : 0, t.result.nanosecond = r.length > 6 ? parseInt(r.slice(6, 9).padEnd(3, "0"), 10) : 0;
}
function A(e, t) {
	let n = t === 4 ? "long" : "short";
	C(e, r[e.locale].dayOfWeek[n], "Day of week");
}
function j(t, n, r) {
	if (r && x(t, "Z")) {
		t.offset = "UTC";
		return;
	}
	[t.offset] = S(t, {
		1: /[+-]\d{2}(?:\d{2})?/gy,
		2: /[+-]\d{4}/gy,
		3: /[+-]\d{2}:\d{2}/gy
	}[n]) ?? e`Time zone not found`;
}
var M = {
	y: (e, t) => T(e, t),
	M: (e, t) => E(e, t),
	d: (e, t) => D(e, {
		1: /([12]\d?|3[01]?|[4-9])/gy,
		2: /0[1-9]|[12]\d|3[01]/gy
	}[t], "day"),
	H: (e, t) => D(e, {
		1: /1\d?|2[0-3]?|[3-9]/gy,
		2: /0\d|1\d|2[0-3]/gy
	}[t], "hour"),
	h: (e, t) => D(e, {
		1: /1[0-2]?|[2-9]/gy,
		2: /0[1-9]|1[0-2]/gy
	}[t], "hour"),
	a: (e) => O(e),
	m: (e, t) => D(e, {
		1: /0|[1-5]?\d|[6-9]/gy,
		2: /[0-5]\d/gy
	}[t], "minute"),
	s: (e, t) => D(e, {
		1: /0|[1-5]?\d|[6-9]/gy,
		2: /[0-5]\d/gy
	}[t], "second"),
	S: (e, t) => k(e, t),
	E: (e, t) => A(e, t),
	X: (e, t) => j(e, t, !0),
	x: (e, t) => j(e, t, !1)
};
function N({ result: e }) {
	let t = !1;
	for (let n of i) {
		if (n in e) {
			t ||= !0;
			continue;
		}
		if (t) {
			if (n === "monthCode") {
				e.monthCode = "M01";
				continue;
			}
			e[n] = +(n === "day");
		}
	}
}
function P(e, n, r, i) {
	let a = {
		input: n,
		index: 0,
		locale: r,
		result: {},
		referenceYear: i
	};
	for (let t of e) {
		if (typeof t == "string") {
			if (!x(a, t)) return;
			continue;
		}
		try {
			M[t[0]](a, t[1]);
		} catch (e) {
			console.log(e);
			return;
		}
	}
	if (a.index === n.length) return a.isPm !== void 0 && (t(a.result.hour !== void 0), a.result.hour === 12 ? a.isPm || (a.result.hour = 0) : a.isPm && (a.result.hour += 12)), N(a), a;
}
function F(e, n, i, { locale: a = "en-US", overflow: o = "reject" } = {}) {
	t(s(a, r), `サポートしていないロケール: ${a}`), t(o === "constrain" || o === "reject", `サポートしていないオーバーフローの挙動: ${o}`), t(i.calendarId === void 0 || i.calendarId === "iso8601", `対応していないカレンダーです: ${i.calendarId}`);
	let c = d(n);
	f(c, i, n, "parse");
	let l = P(c, e, a, i.year);
	if (!l) return;
	let u = i;
	l.offset !== void 0 && (u = u.withTimeZone(l.offset));
	try {
		u = u.with(l.result, { overflow: o });
	} catch (e) {
		console.log(e);
		return;
	}
	return l.offset !== void 0 && (u = u.withTimeZone(i)), u;
}
export { b as format, F as parse };
