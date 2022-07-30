window.bootstrap = require('bootstrap/dist/js/bootstrap.bundle');
import '../../scss/pages/home.scss';
import {hideCheck, showCheck} from "../components/check";
import {PeraWalletConnect} from "@perawallet/connect";
import MyAlgoConnect from "@randlabs/myalgo-connect";
import {decodeAddress} from "algosdk";

/* ----- Wallet Initialization ----- */
const peraWallet = new PeraWalletConnect();
peraWallet.reconnectSession().then((accounts) => {
    peraWallet.connector?.on("disconnect", walletDisconnected);
    if (accounts.length) {
        walletConnected(accounts[0]);
    }
});
const myAlgoWallet = new MyAlgoConnect();

/* ----- Functions ----- */
function walletConnected(algoAddress: string) {
    let address = <HTMLInputElement>document.getElementById("address")!;
    address.value = algoAddress;
    showCheck("walletConnectCheck");
}
function walletDisconnected() {
    let address = <HTMLInputElement>document.getElementById("address")!;
    address.value = "";
    peraWallet.disconnect();
    window.localStorage.removeItem("walletconnect");
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
    responseElement.value = response;
    button.disabled = false;
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
            let addr = decodeAddress(address_string);
        } catch (e) {
            console.log("address failed validation");
            walletDisconnected();
            return;
        }
        walletDisconnected();
        return;
    }
    const data = {
        "email": email_string,
        "algoAddress": address_string,
        "captchaResponse": captcha_string,
    }
    console.log(data);
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
    }
}
function formatPhone(number: string) {
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
    peraWallet.connect().then((newAccounts) => {
        peraWallet.connector?.on("disconnect", walletDisconnected);
        walletConnected(newAccounts[0]);
    });
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
    let phone = <HTMLElement>document.getElementById("phone")!;
    formatPhone(phone.innerText);
}