window.bootstrap = require('bootstrap/dist/js/bootstrap.bundle');
import '../../scss/pages/duplicate.scss';

function decrementCount(seconds: number) {
    let number = <HTMLDivElement>document.getElementById("timeout")!;
    number.innerHTML = seconds.toString();
}

let seconds = 10;
/*let downloadTimer = setInterval(function() {
    if (seconds <= 0) {
        clearInterval(downloadTimer);
        window.location.href = "/";
    }
    decrementCount(seconds);
    seconds -= 1;
}, 1000);*/