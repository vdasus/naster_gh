// --------------------------------------------------------------------------------------------------------------------
// <copyright file="browser_action.js" company="vdasus">
//   Copyright � vdasus AKA nastolkus 2012-2013
// </copyright>
// <summary>
//   Main browser action script
// </summary>
// --------------------------------------------------------------------------------------------------------------------

function cleansub(nod) {
    "use strict";
    var row;
    row = nod.parentNode;
    row.parentNode.removeChild(row);

    //row.parentNode.className = "deletedlink";
    chrome.extension.sendMessage({ "name": "cleanlink", "delurl": nod.id, "actualid": nod.attributes["data-internalid"].nodeValue });
}

function init() {
    "use strict";

    document.querySelector('#openall').addEventListener('click', openall);
    document.querySelector('#mailPM').addEventListener('click', clearPM);

    showPM();

    var subsdiv = document.getElementById("subslist");

    var div = {};
    
    chrome.extension.sendMessage({ name: "getUpdatedSubs" }, function (response) {

        var lopenall = document.getElementById("openall");
        lopenall.className = (response.topics.length > 0) ? "sublink openall rightAligned" : "sublink openall_h rightAligned";
        if (response.topics.length > 0) subsdiv.innerHTML = "";
        
        for (var i = 0; i < response.topics.length; i++) {
            var lurl = response.links[i][0];
            var lname = response.topics[i][0];
            // var lnum = response.lnum[i][0];
            var ldesc = response.sdesc[i][0];
            var sauth = response.sauth[i][0];
            var lastnum = (response.snum[i][0]) ? '#post' + String(response.snum[i][0]) : "";
            var actnum = response.snum[i][0];
            
            div = {
                par: subsdiv,
                el: "div",
                childs: [{
                    el: "div",
                    childs: [{
                        el: "a",
                        id: lurl,
                        ddata: actnum,
                        cclass: "cleanlink",
                        ev: ["click", function () { cleansub(this); }, false]
                    }, {
                            el: "a",
                            cclass: "sublink",
                            href: lurl + lastnum,
                            target: "_blank",
                            innerText: lname
                        },
                    {
                        el: "span",
                        cclass: "sublinkgr",
                        innerText: sauth + ": " + isFromEntity(ldesc, true).substring(0, 50-lname.length) + "..."
                    }]
                    }]
            };
            buildNode(div);
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    init();
});

function showPM() {
    chrome.extension.sendMessage({ name: "getPM", clear: "false" }, function(rez) {
        var mlid = document.getElementById("mailPM");
        if (rez.value == "true") mlid.className = "mailPMupd";
        else mlid.className = "mailPM";
    });
}

function clearPM() {
    chrome.extension.sendMessage({ name: "getPM", clear: "true" });
}

function openall() {
    chrome.extension.sendMessage({ name: "getUpdatedSubs" }, function(response) {
        for (var i = 0; ((i < response.topics.length)&&(i<10)); i++) {
            var llink = response.links[i][0];
            llink += (response.snum[i][0]) ? '#post' + String(response.snum[i][0]) : "";
            chrome.tabs.create({ url: llink });
        }
    });
}