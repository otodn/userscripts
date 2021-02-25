// ==UserScript==
// @name         manaba plus
// @namespace    https://github.com/otodn/userscripts
// @version      0.2.1
// @description  コース一覧で現在時刻の授業を強調して、今年度のポートフォリオだけを開く
// @author       otodn
// @match       http*://*.manaba.jp/ct/*
// @match       http*://*.manaba.jp/s/*
// @updateURL    https://raw.githubusercontent.com/otodn/userscripts/main/manaba_plus.user.js
// @downloadURL  https://raw.githubusercontent.com/otodn/userscripts/main/manaba_plus.user.js
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    /** config **/
    const config = {
        // 講義開始時刻を1コマずつ、時,分で入力。24時間表記
        period_list: [[9, 0], [10, 40], [13, 0], [14, 40], [16, 20]],
        // 講義時間を分単位で入力
        classtime: 90,
        // 講義間の休憩時間を分単位で入力
        breaktime: 10
    }
    /**	config END **/


    // CSSは適宜修正してください
    const css = `
	.nowtime, .nowtime a{background-color: #C1FABE !important;}
	.beforetime, .beforetime a{background-color: #FAF7BE !important;}
    `;

    if (!typeCheck(config, "number")) {
        alert("Configに数値以外が入っています");
        return false;
    }
    GM_addStyle(css);

    // Fire!
    execUrl(nowColor, "course");
    execUrl(portfolioStyle, "coursetable");


    // 実行するページを指定
    function execUrl(func, path) {
        let urlpath = location.pathname;
        const s = smartPage(urlpath);
        urlpath = urlpath.split("/").slice(-1) == "home" ? "course" : urlpath;
        const reg = new RegExp(path + "$", "i");
        if (reg.test(urlpath)) return func(s);
        else return 0;
    }

    function smartPage(url) {
        return url.split("/").slice(1).slice(0, 1) == "s"
    }

    // 現在時刻と時間割の対応表
    function nowTime() {
        const co = config;
        const now = new Date();
        const day_n = now.getDay();
        const day = ["日", "月", "火", "水", "木", "金", "土"][day_n];
        const period_n = co.period_list.length;
        const last_period = new Date();
        last_period.setHours(co.period_list[period_n - 1][0], co.period_list[period_n - 1][1]);
        last_period.setMinutes(last_period.getMinutes() + co.classtime);
        // 遅いのと日曜日は切り捨て(表示されないから)
        if (now.getTime() > last_period.getTime() || day_n === 0) { return { "day_n": day_n, "day": day, "period": period_n, "before": -1 }; }
        let period, before = -1;
        let pst = new Date();
        let pet = new Date();
        for (let i = 0; i < period_n; i++) {
            pst.setHours(co.period_list[i][0], co.period_list[i][1]);
            // Timeで判定
            pet.setTime(pst.getTime() + co.classtime * 1000 * 60);
            if (now.getTime() >= pst.getTime() && now.getTime() <= pet.getTime()) {
                period = i;
                before = 0;
            } else if (now.getTime() <= pst.getTime() && now.getTime() + (co.breaktime * 1000 * 60) >= pst.getTime()) {
                period = i;
                before = 1;
            }
        }
        return { "day_n": day_n, "day": day, "period": period, "before": before };
    }

    // 表示形式に合わせてクラス追加
    function nowColor(smart) {
        const home_list = [
            { name: "thumbnail", value: "サムネイル" },
            { name: "list", value: "リスト" },
            { name: "timetable", value: "曜日" }
        ];
        const beforeclass = "beforetime";
        const nowclass = "nowtime";
        let home_defult;
        if (!smart) {
            home_defult = document.getElementsByClassName("infolist-tab")[0].getElementsByClassName("current")[0].getElementsByTagName("a")[0].innerText;
        } else {
            home_defult = document.getElementsByClassName("tab-menu")[0].getElementsByClassName("tab-menu-on")[0].getElementsByTagName("a")[0].innerText;
        }

        if (home_list.some((x) => x.value === home_defult)) {
            const now_home = home_list.find((x) => x.value === home_defult);
            const timedata = nowTime();
            timedata.str = timedata.day + (timedata.period + 1);
            if (timedata.before === -1) { return 0; }
            switch (now_home.name) {
                case "thumbnail": {
                    const cards = document.getElementsByClassName("coursecard");
                    for (const d of cards) {
                        const s = d.getElementsByClassName("courseitemdetail-date")[0].innerText
                        if (s.indexOf(timedata.str) !== -1) {
                            d.classList.add(timedata.before ? beforeclass : nowclass);
                        }
                    }
                }
                    break;

                case "list": {
                    const table = document.getElementsByClassName("stdlist")[0];
                    for (const r of table.rows) {
                        const s = r.cells[2].innerText;
                        if (s.indexOf(timedata.str) !== -1) {
                            r.classList.add(timedata.before ? beforeclass : nowclass);
                        }
                    }
                }
                    break;

                case "timetable": {
                    const table = document.getElementsByClassName("stdlist")[0];
                    const e = table.rows[timedata.period + 1].cells[timedata.day_n].classList;
                    e.add(timedata.before ? beforeclass : nowclass);
                }
                    break;
            }
        }
    }

    /*
        ポートフォリオのページで今年度以外を非表示にする
        年度取得アルゴリズムは「年月-3ヶ月=年度」
    */
    function portfolioStyle(smart) {
        const now = new Date();
        const month = now.getMonth();
        now.setMonth(month - 3);
        const nendo = "year-" + now.getFullYear();
        const clicki = el => {
            // もともとのトグル関数を発火
            FlipDisplayById(el.id);
            // 一つ前の要素の最後の子要素にクラス追加(span想定)
            const d = el.previousElementSibling.lastElementChild;
            d.classList.toggle('collyear-close');
        }

        document.querySelectorAll(".collist > [id^='year-']").forEach(e => {
            if (!smart) {
                if (e.id != nendo) { clicki(e) }
            } else {
                if (e.id == nendo) { // スマホ版はデフォルトが閉
                    clicki(e)
                }
            }

        });
    }

    // GM_addStyleの代替用
    function addStyle(css) {
        let head, style;
        head = document.getElementsByTagName('head')[0];
        if (!head) { return; }
        style = document.createElement('style');
        style.innerHTML = css;
        head.appendChild(style);
    }

    function typeCheck(e, t) {
        const type = Object.prototype.toString.call(e).slice(8, -1);
        if (type === "Object") {
            for (const i of Object.keys(e)) {
                const v = e[i];
                const it = Object.prototype.toString.call(v).slice(8, -1)
                if (it === "Array") {
                    const f = v.flat(Infinity).every(x => typeof x === t);
                    if (!f) return f;
                } else {
                    const f = typeof v === t;
                    if (!f) return f;
                }

            }
            return 1;
        } else if (type === "Array") {
            const f = e.flat(Infinity).every(x => typeof x === t);
            if (!f) return f;
        } else {
            return typeof e == t;
        }
    }

})();