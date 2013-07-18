// Save this script as `options.js`

// Saves options to localStorage.
function save_options() {
    var minComment = document.getElementById("tx_nt_comments3");
    localStorage["tx_nt_comments3"] = minComment.value;
    var minBlock = document.getElementById("tx_nt_block3");
    localStorage["tx_nt_block3"] = minBlock.value;

    var txsmallcube = document.getElementById("tx_smallcube");
    localStorage["tx_smallcube"] = txsmallcube.checked;

    var txIspm = document.getElementById("tx_ispm");
    localStorage["tx_ispm"] = txIspm.checked;

    var txdebug = document.getElementById("tx_debug");
    localStorage["tx_debug"] = txdebug.checked;

    localStorage["tx_blist"] = getblist();

    // Update status to let user know options were saved.
    var status = document.getElementById("status");
    status.innerHTML = "Сохранено.";
    setTimeout(function () {
        status.innerHTML = "";
    }, 1000);
}

// Restores select box state to saved value from localStorage.
function restore_options() {
    var minComment = localStorage["tx_nt_comments3"];
    if (minComment) {
        var minC = document.getElementById("tx_nt_comments3");
        minC.value = minComment;
    }

    var minBlock = localStorage["tx_nt_block3"];
    if (minBlock) {
        var minB = document.getElementById("tx_nt_block3");
        minB.value = minBlock;
    }

    var txsmallcube = localStorage["tx_smallcube"];
    if (txsmallcube !== null) {
        var smcdiv = document.getElementById("tx_smallcube");
        smcdiv.checked = (txsmallcube == "true") ? true : false;
    }
    
    var txIspm = localStorage["tx_ispm"];
    if (txIspm !== null) {
        var smcpmdiv = document.getElementById("tx_ispm");
        smcpmdiv.checked = (txIspm == "true") ? true : false;
    }

    var txdebug = localStorage["tx_debug"];
    if (txdebug !== null) {
        var debugdiv = document.getElementById("tx_debug");
        debugdiv.checked = (txdebug == "true") ? true : false;
    }

    setblist(localStorage["tx_blist"]);

    init();
}

function unsub(nod) {
    "use strict";
    var row;
    row = nod.parentNode;
    //row.parentNode.removeChild(row);

    row.parentNode.className = "deletedlink";
    chrome.extension.sendMessage({ "name": "unsublink", "delurl": nod.id });
}

function init() {
    "use strict";

    var subsdiv = document.getElementById("setlist");

    var div = {};
    subsdiv.innerHTML = "";
    chrome.extension.sendMessage({ name: "getAllSubs" }, function (response) {
        for (var i = 0; i < response.topics.length; i++) {
            var lurl = response.links[i][0];
            var lname = response.topics[i][0];
            var lnum = response.lnum[i][0];
            var sauth = (response.sauth[i][0]) ? response.sauth[i][0] + ": " : "";
            var ldesc = (response.sdesc[i][0]) ? response.sdesc[i][0] : "";
            div = {
                par: subsdiv,
                el: "div",
                cclass: "dellinkho",
                childs: [{
                    el: "div",
                    childs: [{
                        el: "a",
                        cclass: "dellink",
                        innerText: "",
                        id: lurl,
                        ev: ["click", function () { unsub(this, lurl); }, false]
                    },
                        {
                            el: "a",
                            cclass: "sublink",
                            href: lurl + '#post' + lnum,
                            target: "_blank",
                            innerText: lname
                        },
                    {
                        el: "span",
                        cclass: "sublinkgr",
                        innerText: sauth + isFromEntity(ldesc, true)
                    }]
                }]
            };
            buildNode(div);
        }
        var icntdiv = document.getElementById("icnt");
        icntdiv.innerHTML = '<b>(' + response.topics.length + ')</b>';
        console.log("Subscriptions count: " + response.topics.length);
    });
}

function exportSubs() {
    chrome.extension.sendMessage({ "name": "getalljson" }, function (response) {
        var impexdiv = document.getElementById("impexdivid");
        impexdiv.value = response.value;
        impexdiv.select();
    });
}

function importSubs() {
    var impexdiv = document.getElementById("impexdivid");
    chrome.extension.sendMessage({ "name": "insertalljson", "value": impexdiv.value });
    document.location.reload();
}

function clearall() {
    if (confirm('Вы уверены что хотите всё удалить?')) {
        chrome.extension.sendMessage({ "name": "delallsubs" }, function () {
            alert('Удалено.');
        });
        document.location.reload();
    } else {
        // Do nothing!
    }
}

function flipimpex() {
    var impexdiv = document.getElementById("impexdiv");
    /*if (impexdiv.className == "hasimpexdiv") impexdiv.className = "hasimpexdiv_shown";
    else impexdiv.className = "hasimpexdiv";*/
    if (impexdiv.className == "impexdiv")
        impexdiv.className = "impexdiv_shown";
    else impexdiv.className = "impexdiv";
}

function getblist() {
    var bl = new Array();
    var containertext = document.getElementById("blist").value.split(",");
    for (var i = 0; i < containertext.length; i++) {
        bl.push(containertext[i].trim());
    }
    return JSON.stringify(bl);
}

function setblist(larr) {
    if (localStorage["tx_blist"]!="") document.getElementById("blist").value = JSON.parse(localStorage["tx_blist"]);
}

$(document).ready(function ($) {
    $('#clrbox').colorPicker({
        pickerDefault: localStorage["tx_clrbox"],
        onColorChange: function (id, newValue) { localStorage["tx_clrbox"] = newValue; }});
});

document.addEventListener('DOMContentLoaded', restore_options);
document.querySelector('#save').addEventListener('click', save_options);
document.querySelector('#export').addEventListener('click', exportSubs);
document.querySelector('#import').addEventListener('click', importSubs);
document.querySelector('#clearall').addEventListener('click', clearall);
document.querySelector('.hasimpexdiv').addEventListener('click', flipimpex);