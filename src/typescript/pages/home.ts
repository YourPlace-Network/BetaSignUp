window.bootstrap = require('bootstrap/dist/js/bootstrap.bundle');
import '../../scss/pages/home.scss';
//import "../components/preloader";
import {hideCheck, showCheck} from "../components/check";
import {PeraWalletConnect} from "@perawallet/connect";
import MyAlgoConnect from "@randlabs/myalgo-connect";
import {decodeAddress} from "algosdk";

/* ----- Wallet Initialization ----- */
const peraWallet = new PeraWalletConnect();
try {
    peraWallet.reconnectSession().then((accounts) => {
        peraWallet.connector?.on("disconnect", walletDisconnected);
        walletConnected(accounts[0]);
    });
} catch (e) {
    // No-Op if wallet can't find existing session
}
const myAlgoWallet = new MyAlgoConnect();

/* ----- Functions ----- */
function walletConnected(algoAddress: string) {
    let address = <HTMLInputElement>document.getElementById("address")!;
    address.value = algoAddress;
    showCheck("walletConnectCheck");
}
function walletDisconnected() {
    window.localStorage.removeItem("walletconnect");
    let address = <HTMLInputElement>document.getElementById("address")!;
    address.value = "";
    peraWallet.disconnect();
    hideCheck("walletConnectCheck");
}
function emailError() {
    let emailDiv = <HTMLInputElement>document.getElementById("email")!;
    emailDiv.style.borderStyle = "solid";
    emailDiv.style.borderColor = "red";
    emailDiv.style.borderWidth = "4px";
}
function emailClearError() {
    let emailDiv = <HTMLInputElement>document.getElementById("email")!;
    emailDiv.style.borderStyle = "none";
}
function captchaCallback(response: string) {
    let responseElement = <HTMLInputElement>document.getElementById("hcaptcha-response")!;
    let button = <HTMLButtonElement>document.getElementById("submitBtn")!;
    button.disabled = false;
    responseElement.value = response;
}
function captchaError() {
    let captchaElement = <HTMLDivElement>document.getElementById("h-captcha")!;
    let submitBtn = <HTMLButtonElement>document.getElementById("submitBtn")!;
    submitBtn.disabled = true;
    captchaElement.classList.add("error-border");
}
async function submitButton() {
    let email = <HTMLInputElement>document.getElementById("email")!;
    let address = <HTMLInputElement>document.getElementById("address")!;
    let captcha = <HTMLInputElement>document.getElementById("hcaptcha-response")!;
    let email_string = email.value;
    let address_string = address.value;
    let captcha_string = captcha.value;
    if (email_string == "") {
        emailError();
        return;
    }
    if (captcha_string == "") {
        captchaError();
        return;
    }
    if (address_string) {
        try {
            decodeAddress(address_string);
        } catch (e) {
            console.log("address failed validation");
            return;
        }
    }
    const data = {
        "email": email_string,
        "algoAddress": address_string,
        "captchaResponse": captcha_string,
    }
    const response = await fetch("/signup", {
        method: "POST",
        redirect: "follow",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });
    if (response.redirected) {
        window.location.assign("/success");
    } else {
        window.location.assign("/failure");
    }
}
function formatPhone() {
    let phone = <HTMLElement>document.getElementById("phone")!;
    let phoneStr = phone.innerText;
    let area = phoneStr.slice(0, 3);
    let city = phoneStr.slice(3, 6);
    let num = phoneStr.slice(6, 10);
    phone.innerText = "(" + area + ") " + city + "-" + num;
}

/* ----- Event Handlers ----- */
document.getElementById("submitBtn")!.addEventListener("click", submitButton);
document.getElementById("peraBtn")!.addEventListener("click", function() {
    try {
        peraWallet.connect().then((accounts) => {
            peraWallet.connector?.on("disconnect", walletDisconnected);
            walletConnected(accounts[0]);
        });
    } catch (e) {
        console.log("wallet already connected: " + e);
    }
});
document.getElementById("myalgoBtn")!.addEventListener("click", async function() {
    const accounts = await myAlgoWallet.connect();
    const addresses = accounts.map(account => account.address);
    walletConnected(addresses[0]);
});
document.getElementById("email")!.addEventListener("keyup", function() {
    let emailDiv = <HTMLInputElement>document.getElementById("email")!;
    if (emailDiv.size && emailDiv.style.borderStyle != "none") {
        emailClearError();
    }
});

// Extending global window object to include hcaptcha callback function
// https://stackoverflow.com/questions/56457935/typescript-error-property-x-does-not-exist-on-type-window
declare global {
    interface Window {
        captchaSubmit: any;
    }
}
window.captchaSubmit = captchaCallback;

window.onload = function() {
    formatPhone();
}