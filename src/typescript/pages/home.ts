import {Exception} from "sass";

window.bootstrap = require('bootstrap/dist/js/bootstrap.bundle');
import '../../scss/pages/home.scss';
//import "../components/preloader";
import {hideCheck, showCheck} from "../components/check";
import {PeraWalletConnect} from "@perawallet/connect";
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
    //let address_string = address.value;
    let captcha_string = captcha.value;
    if (email_string == "") {
        emailError();
        return;
    }
    if (captcha_string == "") {
        captchaError();
        return;
    }
    //console.log("address string: " + address.value);
    //console.log("email string: " + email_string);
    //console.log("captcha string: " + captcha_string)
    let data;
    if (typeof address.value === "undefined" || address.value === "undefined" || address.value === undefined) {
        console.log("algo address blank");
        data = {
            "email": email_string,
            "captchaResponse": captcha_string,
        }
    } else {
        try {
            decodeAddress(address.value);
        } catch (e: any) {
            console.log("address failed validation: " + (e as Error).message);
        }
        data = {
            "email": email_string,
            "algoAddress": address.value,
            "captchaResponse": captcha_string,
        }
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
    console.log(response);
    if (response.status === 200) {
        window.location.assign("/success");
    } else if (response.status === 409) {
        window.location.assign("/duplicate");
    } else {
        window.location.assign("/failure");
        //console.log("failure");
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