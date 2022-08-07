//import "../../scss/components/preloader.scss"

export function stopLoader() {
    let preloader = <HTMLDivElement>document.getElementById("main-loader")!;
    preloader.style.display = "none";
}

window.onload = function() {
    stopLoader();
}