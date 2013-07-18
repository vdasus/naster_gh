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

function getArrayMax(arr) {
    return Math.max.apply(null, arr);
}

function replaceHTMLEntities(str, isFromEntity) {
    return (isFromEntity)
        ? str.replace(/&amp;quot;/ig, '"')
        .replace("/&quot;/ig", "\"")
        .replace(/&amp;/ig, "&")
        .replace(/&lt;/ig, "<")
        .replace(/&gt;/ig, ">")
        : str.replace(/"/g, "&quot;")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

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