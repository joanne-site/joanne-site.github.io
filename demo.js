function showCommands() {
    document.querySelector('#add').addEventListener('click', function () {
        sendMessage({
            command: 'add',
            url: document.querySelector('#url').value
        }).then(function () {
            // If the promise resolves, just display a success message.
            ChromeSamples.setStatus('Added to cache.');
        }).catch(ChromeSamples.setStatus); // If the promise rejects, show the error.
    });

    document.querySelector('#delete').addEventListener('click', function () {
        sendMessage({
            command: 'delete',
            url: document.querySelector('#url').value
        }).then(function () {
            // If the promise resolves, just display a success message.
            ChromeSamples.setStatus('Deleted from cache.');
        }).catch(ChromeSamples.setStatus); // If the promise rejects, show the error.
    });

    document.querySelector('#listcontents').addEventListener('click', function () {
        sendMessage({ command: 'keys' })
            .then(function (data) {
                var contentsElement = document.querySelector('#contents');
                // Clear out the existing items from the list.
                while (contentsElement.firstChild) {
                    contentsElement.removeChild(contentsElement.firstChild);
                }

                // Add each cached URL to the list, one by one.
                data.urls.forEach(function (url) {
                    var liElement = document.createElement('li');
                    liElement.textContent = url;
                    contentsElement.appendChild(liElement);
                });
            }).catch(ChromeSamples.setStatus); // If the promise rejects, show the error.
    });

    document.querySelector('#commands').style.display = 'block';
}

function sendMessage(message) {
    // This wraps the message posting/response in a promise, which will resolve if the response doesn't
    // contain an error, and reject with the error if it does. If you'd prefer, it's possible to call
    // controller.postMessage() and set up the onmessage handler independently of a promise, but this is
    // a convenient wrapper.
    return new Promise(function (resolve, reject) {
        var messageChannel = new MessageChannel();
        console.log('帶去訊息事件');
        messageChannel.port1.onmessage = function (event) {
            if (event.data.error) {
                reject(event.data.error);
            } else {
                resolve(event.data);
            }
        };

        // This sends the message data as well as transferring messageChannel.port2 to the service worker.
        // The service worker can then use the transferred port to reply via postMessage(), which
        // will in turn trigger the onmessage handler on messageChannel.port1.
        // See https://html.spec.whatwg.org/multipage/workers.html#dom-worker-postmessage
        navigator.serviceWorker.controller.postMessage(message,
            [messageChannel.port2]);
    });
}

if ('serviceWorker' in navigator) {
    // Set up a listener for messages posted from the service worker.
    // The service worker is set to post a message to all its clients once it's run its activation
    // handler and taken control of the page, so you should see this message event fire once.
    // You can force it to fire again by visiting this page in an Incognito window.
    navigator.serviceWorker.addEventListener('message', function (event) {
        ChromeSamples.setStatus(event.data);
    });

    navigator.serviceWorker.register('service-worker.js')
        // Wait until the service worker is active.
        .then(function (reg) {


            //要求訂閱
            if ('Notification' in window) {
                console.log('Notification permission default status:', Notification.permission);
                Notification.requestPermission(function (status) {
                    console.log('Notification permission status:', status);
                });
            }
            //測試用 顯示訂閱訊息
            // displayNotification(Notification.permission)

            //訂閱使用者
            subscribeUser(reg);

            return navigator.serviceWorker.ready;
        })
        // ...and then show the interface for the commands once it's ready.
        .then(showCommands)
        .catch(function (error) {
            // Something went wrong during registration. The service-worker.js file
            // might be unavailable or contain a syntax error.
            ChromeSamples.setStatus(error);
        });
} else {
    ChromeSamples.setStatus('This browser does not support service workers.');
}

function urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function subscribeUser(swRegistration) {
    //公鑰
    const PublicKey = "BPqjdN9wiXlyvlKgrDN0f1K0LtR-f3NX4f6b2qE1itrBeDiGzrzvWnuR0WQHsmySw5jTypBIRU8ad-8GW9PmnlQ";
    const applicationServerKey = urlB64ToUint8Array(PublicKey);
    swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
    })
        .then(subscription => {
            //訂閱發生後
            console.log('訂閱發生')
        })
        .catch(err => {
            console.log('Failed to subscribe the user: ', err);
        });
}

function displayNotification(permission) {
    if (permission == 'granted') {
        navigator.serviceWorker.getRegistration().then(reg => {
            var options = {
                icon: 'https://interactive-examples.mdn.mozilla.net/media/cc0-images/grapefruit-slice-332-332.jpg',
                body: '這是測試==顯示==訊息',
                image: 'https://augt-forum-upload.s3-ap-southeast-1.amazonaws.com/original/1X/6b3cd55281b7bedea101dc36a6ef24034806390b.png'
            };
            reg.showNotification('Angular User Group Taiwan', options);
            console.log('displayNotification');
        });
    }
}