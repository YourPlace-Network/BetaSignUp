window.bootstrap = require('bootstrap/dist/js/bootstrap.bundle');
import '../../scss/pages/success.scss';

function openStore(name: string) {
    let url;
    if (name == "appstore") {
        url = "https://apps.apple.com/us/app/algorand-wallet/id1459898525";
    } else if (name == "playstore") {
        url = "https://play.google.com/store/apps/details?id=com.algorand.android";
    } else {
        return;
    }
    if (self != top) {
        window.parent.postMessage(name, "*");
    } else {
        window.open(url, "_blank");
    }
}

document.getElementById("imgAppstore")!.addEventListener("click", function() {
    openStore("appstore");
});
document.getElementById("imgPlaystore")!.addEventListener("click", function() {
    openStore("playstore");
});