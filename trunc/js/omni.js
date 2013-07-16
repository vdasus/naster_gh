var currReq = null;
var DigLink = "http://nastolkus.com/search/?q=";
var NuiLink = "http://nuigde.com/api/search/";
var CstLink = "http://ipadstory.ru/poisk-po-nastolnym-blogam/?q=";
var searchregion = "Россия";

function resetDefaultSuggestion() {
    chrome.omnibox.setDefaultSuggestion([
        { description: "<url><match>src:</match></url> поиск в настольном мире" }
    ]);
}

function updateDefaultSuggestion(text) {
    var isNuigde = /^n:/.test(text);
    var isDigest = /^d:/.test(text);
    var isCustom = text.length && !isNuigde;

    var desc = '<match><url>src</url></match><dim> [</dim>';
    desc += isCustom ? ('<match>' + text + '</match>') : 'поиск в настольном мире';
    desc += '<dim> | </dim>';
    desc += isNuigde ? ('<match>' + text + '</match>') : 'n: Искать в онлайн магазинах';
    desc += '<dim> | </dim>';
    desc += isDigest ? ('<match>' + text + '</match>') : 'd: Искать по дайджесту';
    desc += '<dim> | </dim>';
    desc += '<dim> ]</dim>';

    chrome.omnibox.setDefaultSuggestion({
        description: desc
    });
}

chrome.omnibox.onInputStarted.addListener(function () {
    updateDefaultSuggestion('');
});

chrome.omnibox.onInputCancelled.addListener(function () {
    resetDefaultSuggestion();
});

function navigate(url) {
    chrome.tabs.getSelected(null, function (tab) {
        chrome.tabs.update(tab.id, { url: url });
    });
}

chrome.omnibox.onInputEntered.addListener(function (text) {
    var isNuigde = /^n:/.test(text);
    var isDigest = /^d:/.test(text);

    if (isNuigde) {
        var ltext = text.substring('n:'.length).trim();
        navigate(NuiLink + searchregion + "/" + ltext);
    } else if (isDigest) {
        var ltext = text.substring('n:'.length).trim();
        navigate(DigLink + ltext);
    } else {
        navigate(CstLink + text);
    }
});
