chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'executeresetAndStartCapture') {
    resetAndStartCapture();
	console.log('ok')
  }
});

async function resetLastProcessedIndex(db) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['content'], 'readwrite');
        const store = transaction.objectStore('content');

        const deleteRequest = store.delete('lastProcessedIndex');

        deleteRequest.onsuccess = function (event) {
            resolve();
        };

        deleteRequest.onerror = function (event) {
            reject(event.error);
        };
    });
}

async function resetAllContent(db) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['content'], 'readwrite');
        const store = transaction.objectStore('content');
        const request = store.clear();

        request.onsuccess = function(event) {
            resolve();
        };

        request.onerror = function(event) {
            reject(event.error);
        };
    });
}

async function resetAndStartCapture() {
    const db = await openIndexedDB(); 
    await resetAllContent(db); 
    await resetLastProcessedIndex(db); 
	alert('Cache cleaned successfully!');
}

resetAndStartCapture();
