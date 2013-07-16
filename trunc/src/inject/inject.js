// --------------------------------------------------------------------------------------------------------------------
// <copyright file="inject.js" company="vdasus">
//   Copyright © vdasus AKA nastolkus 2012-2013
// </copyright>
// <summary>
//   Main inject script
// </summary>
// --------------------------------------------------------------------------------------------------------------------

// if (document.getElementById("thoughts_thoughts")) document.getElementById("thoughts_thoughts").innerHTML = "";

function flipSubscription() {
    chrome.extension.sendMessage({ name: "flipsubs", title: document.title, lastid: getLastID() }, function (response) {
        if (document.readyState == "complete" || document.readyState == "interactive") {
            if (response.value) {
                subsButton(true);
                lastseen();
            }
            else subsButton(false);
        }
    });
}

function highlight(amax) {
    chrome.extension.sendMessage({ name: "getmaxcomm" }, function (response) {
        if (document.readyState == "complete" || document.readyState == "interactive") {
            var dblastnum = response.value;

            var comms = document.getElementsByClassName('user');
            for (var j = 0; j < comms.length; j++) {
                var forid = Number(comms[j].getAttribute('forid'));
                if (forid > dblastnum) {
                    var attr = comms[j].parentNode.
                        getElementsByClassName('body')[0].
                        getAttribute('style');
                    if (attr) {
                        attr += 'background: ' + response.clrbox + ';';
                    } else {
                        attr = 'background: ' + response.clrbox + ';';
                    }
                    comms[j].parentNode.getElementsByClassName('body')[0].
                        setAttribute('style', attr);
                }
            }

            if (amax != dblastnum) {
                chrome.extension.sendMessage({ name: "setmaxcomm", lastnum: amax });
            }
        }
    });
}

function getLastID() {
    var rez = [];
    var elements = document.getElementsByClassName("item");

    var len = elements.length;
    for (var i = 0; i < len; i++) {
        if (elements[i].getElementsByClassName("user")[0])
            rez.push(elements[i].getElementsByClassName("user")[0].getAttribute("forid"));
    }

    return (rez.length > 0) ? String(rez.max()) : "0";
}

function lastseen() {

    highlight(getLastID());
}

function subsButton(lissubs) {
    "use strict";
    var div;

    chrome.extension.sendMessage({ name: "getsbstyle" }, function(response) {
        var ltitle = lissubs ? "Отписаться" : "Подписаться";
        
        var lstyle = (response.value == "false")
            ? "position: fixed; top: 250px; right: 2px; height: 60px;"
            : "position: fixed; top: 250px; right: 2px; height: 30px;";
        div = {
            par: document.body,
            el: "div",
            childs: [{
                el: "a",
                href: "#",
                id: "subscr",
                title: ltitle,
                ev: ["click", function () { flipSubscription(this); }, false],
                childs: [{
                    el: "img",
                    src: chrome.extension.getURL('icons/tes_on.png'),
                    /*style: "position:fixed; top:250px; right:2px; height:60px;"*/
                    style: lstyle,
                }]
            }]
        };

        if (lissubs) div.childs[0].childs[0].src = chrome.extension.getURL('icons/tes_on.png');
        else div.childs[0].childs[0].src = chrome.extension.getURL('icons/tes_off.png');

        buildNode(div);
    });
}

function init() {
    chrome.extension.sendMessage({ name: "chksubs" }, function (response) {
        if (document.readyState == "complete" || document.readyState == "interactive") {
            if (response.value) {
                subsButton(true);
                lastseen();
            }
            else subsButton(false);
        }
    });
}

init();