// --------------------------------------------------------------------------------------------------------------------
// <copyright file="utils.js" company="vdasus">
//   Copyright © vdasus AKA nastolkus 2012-2013
// </copyright>
// <summary>
//   Main utils script
// </summary>
// --------------------------------------------------------------------------------------------------------------------

function wrapToDom(source) {
    var doc, html;
    doc = document.createElement('div');
    html = document.createElement('html');
    html.innerHTML = source;
    doc.appendChild(html);
    return doc;
}

function getFromUrl(url, args, wrap, ref, errRef) {
    // ReSharper disable InconsistentNaming
    var xhReq = new XMLHttpRequest();
    // ReSharper restore InconsistentNaming
    xhReq.open("GET", url, true);
    // console.log("Asking " + url);
    xhReq.onreadystatechange = function () {
        if (xhReq.readyState == 4) { // complete
            if (xhReq.status == 200) {
                ref.apply(null, [!wrap ? wrapToDom(xhReq.responseText) : xhReq.responseText].concat(args));
            } else {
                console.log("Can't load subscription:" + xhReq.status);
                if (!errRef) {
                    return undefined;
                }
                errRef.apply(null, [].concat(args));
            }
        }
        return true;
    };
    xhReq.send(null);
}

Array.prototype.max = function () {
    return Math.max.apply(null, this);
};

String.prototype.stripX = function (boo) {
    var str = this;
    if (boo) {
        str = str.replace(/&amp;quot;/ig, '"');
        str = str.replace("/&quot;/ig", "\"");
        str = str.replace(/&amp;/ig, "&");
        str = str.replace(/&lt;/ig, "<");
        str = str.replace(/&gt;/ig, ">");
    }
    else {
        str = str.replace(/"/g, "&quot;");
        str = str.replace(/&/g, "&amp;");
        str = str.replace(/\</g, "&lt;");
        str = str.replace(/\>/g, "&gt;");

    }
    return str;
};

function buildNode(obj) {
    "use strict";
    // обязательный параметр el -- создаваемый элемент
    // дополнительный параметр par точка присоединения
    // дети задаются параметром childs в виде []
    // события задаются параметром ev и связанным []
    // класс задается через cclass
    var element, // основной элемент
        pr, // properties json объекта
        c; // итератор цикла для childs
    if (obj.el) {

        element = document.createElement(obj.el);
    } else {
        return undefined;
    }

    if (obj.par) {
        obj.par.appendChild(element);
    }

    for (pr in obj) {
        switch (pr) {
            case "el":
                break;
            case "par":
                break;
            case "childs":
                for (c = 0; c < obj.childs.length; c++) {
                    element.appendChild(buildNode(obj.childs[c]));
                }
                break;
            case "cclass":
                element.setAttribute("class", obj[pr]);
                break;
            case "ddata":
                element.setAttribute("data-internalid", obj[pr]);
                break;
            case "ev":
                element.addEventListener(obj[pr][0], obj[pr][1], obj[pr][2]);
                break;
            case "evs":
                for (c = 0; c < obj.evs.length; c++) {
                    element.addEventListener(obj[pr][c][0], obj[pr][c][1],
                        obj[pr][c][2]);
                }
                break;
            case "innerText":
                element.innerText = obj[pr];
                break;
            case "innerHTML":
                element.innerHTML = obj[pr];
                break;
            default:
                element.setAttribute(pr, obj[pr]);
                break;
        }
    }
    return element;
}