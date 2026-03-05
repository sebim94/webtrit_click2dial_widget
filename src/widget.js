import {createApp} from 'vue';
import App from './App.vue';
import './styles/widget.css?inline';
import Signaling from './signaling';

createApp(App).mount('#app');

if (document.getElementById("CallButtonWidget")) {
    console.warn("CallButton widget already injected");
} else {
    let numberToCall = import.meta.env.VITE_NUMBER;
    let sipLogin = import.meta.env.VITE_SIP_LOGIN;
    let sipPassword = import.meta.env.VITE_SIP_PASSWORD;
    let funcStatusCallBack = function (status) {
        let element = document.getElementById('widget_iframe_element');
        if (element) {
            element.contentWindow.postMessage({
                type: "status_update",
                data: status
            }, "*");
        }
    };
    window.webTritSignaling = new Signaling(numberToCall, sipLogin, sipPassword, funcStatusCallBack);

    const divElement = document.createElement("div");
    divElement.id = "CallbuttonWidget";
    divElement.className = "callbutton-widget";

    const audioElement = document.createElement("audio");
    audioElement.autoplay = true;
    audioElement.id = "remoteStream";
    audioElement.style.display = "none";
    divElement.appendChild(audioElement)

    const buttonElement = document.createElement("button");
    buttonElement.className = "callbutton";
    buttonElement.addEventListener("click", function () {
        const elem = document.getElementById('widget_iframe_element');
        if (!elem) {
            const iframeElement = document.createElement("iframe");
            iframeElement.src = import.meta.env.VITE_WIDGET_URL + "/widgetcontent.html"
                + ('?number=' + numberToCall)
                + ('&sipLogin=' + sipLogin)
                + ('&sipPassword=' + sipPassword);
            iframeElement.id = 'widget_iframe_element';
            iframeElement.allow = 'microphone';
            iframeElement.style.display = 'block';

            divElement.appendChild(iframeElement);
            divElement.classList.add('expanded');
        } else {
            divElement.removeChild(elem);
            divElement.classList.remove('expanded');
        }
    });
    buttonElement.innerHTML = `<svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.85196 2.88751C5.93507 4.12041 6.14286 5.3256 6.47533 6.47539L4.81299 8.13772C4.24503 6.47539 3.88486 4.71608 3.76018 2.88751H5.85196ZM19.5108 19.5386C20.6883 19.8711 21.8935 20.0788 23.1126 20.162V22.226C21.284 22.1014 19.5247 21.7412 17.8485 21.1871L19.5108 19.5386ZM7.18183 0.116943H2.33334C1.57144 0.116943 0.948059 0.74032 0.948059 1.50222C0.948059 14.51 11.4901 25.052 24.4978 25.052C25.2597 25.052 25.8831 24.4286 25.8831 23.6667V18.8321C25.8831 18.0702 25.2597 17.4468 24.4978 17.4468C22.7801 17.4468 21.1039 17.1698 19.5524 16.6572C19.4139 16.6018 19.2615 16.5879 19.123 16.5879C18.7628 16.5879 18.4165 16.7265 18.1394 16.9897L15.0918 20.0373C11.1714 18.0286 7.95758 14.8286 5.96278 10.9083L9.0104 7.86067C9.39828 7.47279 9.5091 6.93253 9.35672 6.44768C8.84416 4.89616 8.56711 3.23383 8.56711 1.50222C8.56711 0.74032 7.94373 0.116943 7.18183 0.116943Z" fill="white"/>
    </svg>`;

    divElement.appendChild(buttonElement);
    document.body.appendChild(divElement);

    const connectionError = document.createElement("div");
    connectionError.id = "connectionerror";
    connectionError.className = "connection-error";
    connectionError.style.display = 'none';

    const iconContainer = document.createElement("div");
    iconContainer.className = "icon-container";
    const errorIcon = document.createElement("img");
    errorIcon.src = import.meta.env.VITE_WIDGET_URL + "/src/assets/webtrit.png";
    iconContainer.appendChild(errorIcon);

    const closeButton = document.createElement("div");
    closeButton.className = "close-button";

    const closeIcon = document.createElement("img");
    closeIcon.src = import.meta.env.VITE_WIDGET_URL + "/src/assets/close.svg";
    closeButton.appendChild(closeIcon);

    closeButton.onclick = function () {
        connectionError.style.display = 'none';
    }

    const errorTextContainer = document.createElement("div");
    errorTextContainer.className = "error-text-container";
    errorTextContainer.innerText = "Sorry, but we can't connect you right now. Please try again later";

    connectionError.appendChild(iconContainer);
    connectionError.appendChild(errorTextContainer);
    connectionError.appendChild(closeButton);
    document.body.appendChild(connectionError);

    const receiveMessage = function (event) {
        const element = document.getElementById('widget_iframe_element');
        if (event.data === "removetheiframe_success") {
            element?.parentNode?.removeChild(element);
        } else if (event.data === "removetheiframe_failure") {
            element?.parentNode?.removeChild(element);
            const connectionError = document.getElementById('connectionerror');
            connectionError.style.display = 'block';
        } else if (event.data === "start_call") {
            window.webTritSignaling.connect();
        } else if (event.data === "end_call") {
            window.webTritSignaling.hangup();
        } else if (event.data === 'mute_audio') {
            window.webTritSignaling.muteAudio(true);
        } else if (event.data === 'unmute_audio') {
            window.webTritSignaling.muteAudio(false);
        } else {
            window.webTritSignaling.sendDtmf(event.data);
        }
    }
    window.addEventListener("message", receiveMessage, false);

    console.log("CallButton widget injected successfully");
}
