import "../../scss/components/check.scss"

export function showCheck(elementID: string) {
    let check = document.getElementById(elementID)! as HTMLDivElement;
    check.style.display = "inline-block";
}

export function hideCheck(elementID: string) {
    let check = document.getElementById(elementID)! as HTMLDivElement;
    check.style.display = "none";
}