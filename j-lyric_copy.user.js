// ==UserScript==
// @name        Copy for J-lyric
// @namespace    https://github.com/otodn/userscripts
// @description    J-lyricをコピペ可能にしてコピーボタンを表示するだけ
// @version    20210225
// @namespace    https://github.com/otodn/userscripts
// @author    otodn
// @match     http*://j-lyric.net/artist/*
// @updateURL    https://raw.githubusercontent.com/otodn/userscripts/main/j-lyric_copy.user.js
// @downloadURL  https://raw.githubusercontent.com/otodn/userscripts/main/j-lyric_copy.user.js
// ==/UserScript==

(function () {
	'use strict';
	//	右クリックと選択を可能に
	document.body.onContextmenu = "return true";
	document.body.onselectstart = "return true";

	const lyric = document.getElementById("Lyric");
	//	ボタン作って配置
	const lcb = document.createElement("button");
	lcb.textContent = "Copy!";
	lcb.setAttribute("id", "copybtn");
	lyric.parentNode.insertBefore(lcb, lyric);
	//	押すとコピー
	lcb.addEventListener('click', function () {
		// ルビは削除
		const ruby = document.getElementsByTagName("rt")
		// HTMLCollectionはforEachを使えない
		Array.prototype.forEach.call(ruby, rt => {rt.style.display = "none";})
		const range = document.createRange();
		range.selectNode(lyric);
		window.getSelection().addRange(range);
		document.execCommand("copy");
		window.getSelection().removeAllRanges();
		Array.prototype.forEach.call(ruby, rt => {rt.style.display = "";})
		alert("Copied now!");
	}, false);
})()