// --------------------------------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------------------------------
// <copyright file="background.js" company="vdasus">
//   Copyright © vdasus AKA nastolkus 2012-2013
// </copyright>
// <summary>
//   Main bacgroung script
// </summary>
// --------------------------------------------------------------------------------------------------------------------

var txGlob = {
};

if (!localStorage["tx_nt_comments3"]) localStorage["tx_nt_comments3"] = 5;
if (!localStorage["tx_nt_block3"]) localStorage["tx_nt_block3"] = 15;
if (!localStorage["tx_smallcube"]) localStorage["tx_smallcube"] = "false";

if (!localStorage["tx_ispm"]) localStorage["tx_ispm"] = "true";

if (!localStorage["tx_clrbox"]) localStorage["tx_clrbox"] = "#ffff99";
if (!localStorage["tx_blist"]) localStorage["tx_blist"] = new Array();

if (!localStorage["tx_PM"]) localStorage["tx_PM"] = 0;
//localStorage["tx_PM"] = 263775;

if (!localStorage["tx_PMupd"]) localStorage["tx_PMupd"] = "false";

if (!localStorage["tx_debug"]) localStorage["tx_debug"] = "false";

var db = window.openDatabase("NasTer", "", "NasTer extension database", 1024 * 1024 * 10);

function migration1(tx) {
    tx.executeSql('CREATE TABLE IF NOT EXISTS ' +
                       'watchlist(id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, url TEXT UNIQUE, ' +
                       'topic TEXT, lastseen TEXT, lastnum TEXT, type TEXT, updated INTEGER)', []);
    console.log("DB created: " + db.version);
}

function migration2(tx) {
    tx.executeSql("ALTER TABLE watchlist ADD shortdesc TEXT");
    tx.executeSql("ALTER TABLE watchlist ADD author TEXT");
    tx.executeSql("ALTER TABLE watchlist ADD actualnum TEXT");
    tx.executeSql('CREATE INDEX IF NOT EXISTS url_idx ON watchlist (url)');
    console.log("DB upgraded to " + db.version);
}

if (db.version == "") {
    db.changeVersion("", "0.0.10", migration1, null, function () {
        db.changeVersion("0.0.10", "2", migration2, null, function () {
            console.log("DB upgraded to " + db.version);
        });
    });
}

if (db.version == "0.0.10") {
    db.changeVersion("0.0.10", "2", migration2, null, function () {
        console.log("DB upgraded to " + db.version);
    });
}

function getLinkType(alink) {
    if (alink.indexOf("/game/") != -1) return "Игра";
    else if (alink.indexOf("/person/") != -1) return "Персона";
    else if (alink.indexOf("/company/") != -1) return "Компания";
    else if (alink.indexOf("/club/") != -1) return "Клуб";
    else if (alink.indexOf("/project/") != -1) return "Проект";
    else if (alink.indexOf("/event/") != -1) return "Событие";
    else if (alink.indexOf("/award/") != -1) return "Награда";
    else if (alink.indexOf("/article/") != -1) return "Статья";
    else if (alink.indexOf("/new/") != -1) return "Новости";
    else if (alink.indexOf("/list/") != -1) return "Список";
    else if (alink.indexOf("/journal/") != -1) return "Журнал";
    else if (alink.indexOf("/thought/") != -1) return "Мысли";
    else return "Иное";
}

//(interval*60*1000)/(cnt/10)
var intervalVariable = null;
var intervalVariable2 = null;

function updateCheckInterval() {
    db.transaction(function (tx) {
        tx.executeSql('SELECT count(id) as chkCnt FROM watchlist WHERE (updated=0)', [],
            function (tx, rez) {
                var lcnt;
                if (rez.rows.length > 0) {
                    lcnt = rez.rows.item(0).chkCnt;
                } else {
                    lcnt = 1;
                }
                var interval = Math.round((localStorage["tx_nt_comments3"] * 60000) / (lcnt / localStorage["tx_nt_block3"]));
                interval = (interval > (localStorage["tx_nt_comments3"] * 60000))
                    ? localStorage["tx_nt_comments3"] * 60000
                    : interval;

                if (intervalVariable != null) clearInterval(intervalVariable);
                intervalVariable = setInterval(checkAll, interval);

                if (intervalVariable2 != null) clearInterval(intervalVariable2);
                if (localStorage["tx_ispm"] == "true") {
                    intervalVariable2 = setInterval(checkPM, localStorage["tx_nt_comments3"] * 60000);
                }

                tx.executeSql('update watchlist set lastseen=null', []);

                if (localStorage["tx_debug"] == "true") console.log("set new interval: " + interval);
            });
    });
}

updateCheckInterval();

chrome.browserAction.setBadgeText({ text: "" });
chrome.extension.sendMessage({ name: "updbadge" });

DbOnSuccess = function () {
};

DbOnError = function (tx, e) {
    alert("Попытка не удалась: " + e.message);
};

chrome.extension.onMessage.addListener(
    function (request, sender, sendResponse) {
        var lurl = "";
        try {
            lurl = sender.tab.url.split("#")[0];    
        } catch  (lex)
        {
            if (localStorage["tx_debug"] == "true") console.log("bad url in: " + request.name + " : " + lex.message);
        }
        
        switch (request.name) {
            case "chksubs":
                db.transaction(function (tx) {
                    tx.executeSql('SELECT url, lastnum FROM watchlist WHERE url=?', [lurl],
                        function (tx, rez) {
                            if (rez.rows.length > 0) {
                                sendResponse({ value: true });
                            } else {
                                sendResponse({ value: false });
                            }
                        },
                        function () {
                            sendResponse({ value: false });
                        });
                });
                break;
            case "updbadge":
                db.transaction(function (tx) {
                    tx.executeSql('SELECT count(*) as cntnum FROM watchlist WHERE updated=1', [], function (tx, rez) {
                        var ml = (localStorage["tx_PMupd"] == "true") ? "|#" : "";
                        chrome.browserAction.setBadgeText(
                            { text: (rez.rows.item(0).cntnum > 0) ? String(rez.rows.item(0).cntnum) + ml : "" + ml });
                    });
                });
                break;
            case "getmaxcomm":
                db.transaction(function (tx) {
                    tx.executeSql('SELECT url, lastnum FROM watchlist WHERE url=?', [lurl],
                        function (tx, rez) {
                            if (rez.rows.length > 0) {
                                sendResponse({ value: String(rez.rows.item(0).lastnum), clrbox: localStorage["tx_clrbox"] });
                            } else {
                                sendResponse({ value: 0, clrbox: localStorage["tx_clrbox"] });
                            }
                        },
                        function () {
                            sendResponse({ value: 0, clrbox: localStorage["tx_clrbox"] });
                        });
                });

                break;
            case "setmaxcomm":
                var lSmxNum = String(request.lastnum);
                db.transaction(function (tx) {
                    if (localStorage["tx_debug"] == "true") console.log("trying to write:" + String(request.lastnum) + " for url: " + lurl);
                    tx.executeSql('UPDATE watchlist SET lastnum = ?, updated = 0, lastseen = ? WHERE url=?',
                        //[lSmxNum, Date.now(), lurl], function() {
                        [lSmxNum, null, lurl], function () {
                            chrome.extension.sendMessage({ name: "updbadge" });
                        }, DbOnError);
                });
                break;
            case "flipsubs":
                db.transaction(function (tx) {
                    tx.executeSql('SELECT url, null FROM watchlist WHERE url=?', [lurl], function (tx, rez) {
                        if (rez.rows.length > 0) {
                            tx.executeSql('delete from watchlist where url = ?', [lurl], DbOnSuccess, DbOnError);
                            sendResponse({ value: false });
                        } else {
                            tx.executeSql('insert into watchlist (url, topic, lastseen, lastnum, type, updated, shortdesc)'
                                + 'values (?, ?, ?, ?, ?, ?, ?)',
                                [lurl, cleanTopicTitle(request.title), Date.now(), request.lastid, getLinkType(lurl), 0, null],
                                DbOnSuccess, DbOnError);
                            sendResponse({ value: true });
                        }

                        updateCheckInterval();
                    });
                });
                break;
            case "getUpdatedSubs":
                db.transaction(function (tx) {
                    tx.executeSql('SELECT topic, url, lastnum, shortdesc, author, actualnum FROM watchlist ' +
                        'WHERE updated=1 limit 20', [], function (tx, rez) {
                            var i, asub = [], alink = [], alastnum = [], ashorts = [], aauths = [], aanum = [];
                            for (i = 0; i < rez.rows.length; i++) {
                                asub.push([rez.rows.item(i).topic]);
                                alink.push([rez.rows.item(i).url]);
                                alastnum.push([rez.rows.item(i).lastnum]);
                                ashorts.push([rez.rows.item(i).shortdesc]);
                                aauths.push([rez.rows.item(i).author]);
                                aanum.push([rez.rows.item(i).actualnum]);
                            }
                            sendResponse({
                                value: true,
                                topics: asub,
                                links: alink,
                                lnum: alastnum,
                                sdesc: ashorts,
                                sauth: aauths,
                                snum: aanum
                            });
                        });
                });
                break;
            case "getAllSubs":
                db.transaction(function (tx) {
                    tx.executeSql('SELECT topic, url, lastnum, shortdesc, author FROM watchlist', [], function (tx, rez) {
                        var i, asub = [], alink = [], alastnum = [], ashorts = [], aauths = [];
                        for (i = 0; i < rez.rows.length; i++) {
                            asub.push([rez.rows.item(i).topic]);
                            alink.push([rez.rows.item(i).url]);
                            alastnum.push([rez.rows.item(i).lastnum]);
                            ashorts.push([rez.rows.item(i).shortdesc]);
                            aauths.push([rez.rows.item(i).author]);
                        }
                        sendResponse({
                            value: true,
                            topics: asub,
                            links: alink,
                            lnum: alastnum,
                            sdesc: ashorts,
                            sauth: aauths
                        });
                    });
                });
                break;
            case "getsbstyle":
                sendResponse({ "value": localStorage["tx_smallcube"] });
                break;
            case "unsublink":
                db.transaction(function (tx) {
                    if (localStorage["tx_debug"] == "true") console.log("to delete: " + request.delurl);
                    tx.executeSql('delete FROM watchlist where url = ?', [request.delurl]);
                });
                break;
            case "getalljson":
                db.transaction(function (tx) {
                    tx.executeSql('SELECT id, url, topic, lastseen, lastnum, type, updated, shortdesc,' +
                        ' author, actualnum FROM watchlist', [], function (tx, rez) {
                            var i, ajson = [];
                            for (i = 0; i < rez.rows.length; i++) {
                                var obj = {
                                    id: rez.rows.item(i).id,
                                    url: rez.rows.item(i).url,
                                    topic: rez.rows.item(i).topic,
                                    lastseen: rez.rows.item(i).lastseen,
                                    lastnum: rez.rows.item(i).lastnum,
                                    type: rez.rows.item(i).type,
                                    updated: rez.rows.item(i).updated,
                                    shortdesc: rez.rows.item(i).shortdesc,
                                    author: rez.rows.item(i).author,
                                    actualnum: rez.rows.item(i).actualnum
                                };
                                ajson.push(obj);
                            }

                            sendResponse({ value: JSON.stringify(ajson) });
                        });
                });
                break;
            case "delallsubs":
                db.transaction(function (tx) {
                    if (localStorage["tx_debug"] == "true") console.log("DELETE ALL");
                    tx.executeSql('delete FROM watchlist', []);
                });
                break;
            case "insertalljson":
                db.transaction(function (tx) {
                    if (localStorage["tx_debug"] == "true") console.log("json_str: " + request.value);
                    try {
                        var obj = JSON.parse(request.value);

                        for (var i = 0; i < obj.length; i++) {
                            try {
                                tx.executeSql('insert into watchlist (url, topic, lastseen, lastnum, type, updated, ' +
                                    'shortdesc, author, actualnum) values (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                                    [obj[i].url, obj[i].topic, obj[i].lastseen, obj[i].lastnum, obj[i].type,
                                        obj[i].updated, obj[i].shortdesc, obj[i].author, obj[i].actualnum]);
                            } catch (lex) {
                                console.log("ERR: " + lex.message);
                            }
                        }
                    } catch (ex) {
                        console.log("ERR: " + ex.message);
                    }
                });
                break;
            case "cleanlink":
                db.transaction(function (tx) {
                    if (localStorage["tx_debug"] == "true") console.log("to clean: " + request.delurl);
                    tx.executeSql('UPDATE watchlist SET updated=0, lastnum = ? where url = ?'
                        , [String(request.actualid), request.delurl],
                        function () {
                            checkUrl(request.delurl);
                            chrome.extension.sendMessage({ name: "updbadge" });
                        });
                });
                break;
            case "getPM":
                if (request.clear == "true") localStorage["tx_PMupd"] = "false";
                chrome.extension.sendMessage({ name: "updbadge" });
                if (localStorage["tx_PMupd"] == "true") sendResponse({ value: "true" });
                else sendResponse({ value: "false" });
                break;
        }
        return true;
    }
);

function cleanTopicTitle(atitle) {
    var ltitle = atitle;
    ltitle = ltitle.replace(" | все о настольных играх - tesera.ru", "");
    ltitle = ltitle.replace("Мысли на тему", "");
    ltitle = ltitle.replace(" - tesera.ru", "");
    return ltitle;
}

function checkblist(aname) {
    var lbl = JSON.parse(localStorage["tx_blist"]);
    for (var i = 0; i < lbl.length; i++) {
        if (aname == lbl[i])
            return true;
    }
    return false;
}

// {"id": 216724, "anons": "Увы, такова наша почта. Первый заказ шел 2,5-3 месяца (как раз перед новым годом сдуру заказали)....", "creator_id": 91970, "creator": "GansFaust"}
function NSparseJSON(astr, aurl) {
    var safestr = astr.replace(/(\r\n|\n|\r|\\)/gm, "");
    if (localStorage["tx_debug"] == "true") console.log(safestr);
    var obj = { "id": "0", "anons": "", "creator_id": 0, "creator": "" };

    try {
        if (safestr.length > 10) obj = JSON.parse(safestr);
    } catch (ex) {
        console.log("ERR: " + ex.message + " (" + aurl + ")");
        obj = { "id": "0", "anons": "", "creator_id": 0, "creator": "" };
    }

    return obj;
}

function makeCheckUrl(aurl) {
    return "http://tesera.ru/api1/" + aurl.substring(17) + "comments";
}

function checkUrl(aurl) {
    var shortUrl = makeCheckUrl(aurl);
    if (localStorage["tx_debug"] == "true") console.log("url: " + shortUrl);
    getFromUrl(shortUrl, [], true, function (reas) {
        db.transaction(function (tx) {
            tx.executeSql('SELECT url, lastnum FROM watchlist WHERE (updated = 0) and (url = ? )', [aurl],
                function (tx, rez) {
                    if (rez.rows.length > 0) {
                        // var lmaxnum = lastSeenCommentOnPage(reas);
                        var obj = NSparseJSON(reas, shortUrl);
                        var lmaxnum = obj.id;
                        var ldbnum = rez.rows.item(0).lastnum;

                        if (ldbnum < lmaxnum) {
                            db.transaction(function (tx) {
                                if (!checkblist(obj.creator))
                                    tx.executeSql('UPDATE watchlist SET updated=1, shortdesc = ?, author= ?, actualnum = ? ' +
                                        'WHERE url=?', [obj.anons, obj.creator, String(obj.id), aurl],
                                        function () {
                                            chrome.extension.sendMessage({ name: "updbadge" });
                                        });
                            });
                        }

                        tx.executeSql('UPDATE watchlist SET lastseen="1" WHERE url=?', [aurl],
                        function () {
                            if (localStorage["tx_debug"] == "true") console.log("lastseen " + aurl);
                        });

                        if (localStorage["tx_debug"] == "true") console.log(ldbnum + ":" + lmaxnum);
                    }
                }, DbOnError);
        });
    });
}

function checkAll() {
    db.transaction(function (tx) {
        var select = 'SELECT url, null FROM watchlist WHERE (updated = 0) AND (lastseen is null) limit ' +
            localStorage["tx_nt_block3"];

        tx.executeSql(select, [], function (tx, rez) {
            if (rez.rows.length > 0) {
                for (var i = 0; i < rez.rows.length; i++) {
                    checkUrl(rez.rows.item(i).url);
                }
            } else {
                tx.executeSql('update watchlist set lastseen=null', [], function () {
                });
            }
        });
    });
}

function getLastForid(adom) {
    var rez = [];
    var elements = adom.getElementsByClassName("item");

    var len = elements.length;
    for (var i = 0; i < len; i++) {
        rez.push(elements[i].getElementsByClassName("user")[0].getAttribute("forid"));
    }

    return (rez.length > 0) ? rez.max() : Number.MAX_VALUE;
}

function checkPM() {
    getFromUrl("http://tesera.ru/user/messages/", [], false, function (reas) {
        try {
            var lastid = getLastForid(reas);
            if ((lastid > localStorage["tx_PM"]) && (lastid < localStorage["tx_PM"]+200)) {
                localStorage["tx_PM"] = lastid;
                localStorage["tx_PMupd"] = "true";
                chrome.extension.sendMessage({ name: "updbadge" });
            } else if(localStorage["tx_PM"] == 0) {
                localStorage["tx_PM"] = lastid;
                localStorage["tx_PMupd"] = "true";
                chrome.extension.sendMessage({ name: "updbadge" });
              }
        } catch (lex) {
            console.log("ERR: " + lex.message);
        }
    });
}