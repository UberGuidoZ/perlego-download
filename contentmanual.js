(function() {
    let stopSearch = false;

function sendProgress(progress){
	chrome.runtime.sendMessage({ type: 'progressUpdate', progress: progress });
}

async function searchElement(page) {
    const element = document.evaluate(`//*[@id="p${page}--0"]/div/div[2]/object`,document,null,XPathResult.FIRST_ORDERED_NODE_TYPE,null).singleNodeValue;
    const elementx = document.evaluate(`//*[@id="p${page}--0"]`,document,null,XPathResult.FIRST_ORDERED_NODE_TYPE,null).singleNodeValue;

    if (element) {
        return elementx.innerHTML + '<br>' + '\n';
    }
    return null;
}

async function downloadResults(results, filename) {
    const blob = new Blob(results, { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    clearIndexedDB();
}

async function getAllContent(db) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['content'], 'readonly');
        const store = transaction.objectStore('content');
        const allContentRequest = store.getAll();

        allContentRequest.onsuccess = function (event) {
            resolve(event.target.result);
        };

        allContentRequest.onerror = function (event) {
            reject(event.error);
        };
    });
}

async function getAllKeys(db) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['content'], 'readonly');
        const store = transaction.objectStore('content');
        const getAllKeysRequest = store.getAllKeys();

        getAllKeysRequest.onsuccess = function (event) {
            resolve(event.target.result);
        };

        getAllKeysRequest.onerror = function (event) {
            reject(event.error);
        };
    });
}
async function displayHomeMessage(pagefinal) {
    const messageElement = document.createElement('div');
    messageElement.style.position = 'fixed';
    messageElement.style.top = '50%';
    messageElement.style.left = '50%';
    messageElement.style.transform = 'translate(-50%, -50%)';
    messageElement.style.padding = '20px';
    messageElement.style.background = '#ffffff';
    messageElement.style.border = '1px solid #ccc';
    messageElement.style.zIndex = '9999';
    messageElement.style.fontWeight = 'bold';
    messageElement.id = 'message';
    document.body.appendChild(messageElement);
    const db = await openIndexedDB();
    const lastpage = await getLastProcessedIndex(db);
    messageElement.textContent = `Page ${lastpage}/${pagefinal} found. Keep scrolling to the page ${pagefinal}`;
    return messageElement;
}

async function startSearchingAndSaving() {
    try {
        var element = document.querySelector('div[data-test-locator="pagetion-total-chapter-numbers"]');
        var pagefinal = null;
        if (element !== null) {
            var content = element.textContent.trim();
            var numbers = content.match(/\d+/g);
            if (numbers !== null && numbers.length > 0) {
                var number = parseInt(numbers[0]);
                pagefinal = Number(number);
            }
        }
		const initialMessage = await displayHomeMessage(pagefinal);

        let stopButton = document.createElement('button');
        stopButton.textContent = 'Quit and save';
        stopButton.style.position = 'fixed';
        stopButton.style.top = '54%';
        stopButton.style.right = '47%';
        stopButton.style.zIndex = '9999';
        stopButton.style.backgroundColor = 'white';
        stopButton.style.color = 'green';
        stopButton.style.fontWeight = 'bold';
        document.body.appendChild(stopButton);
        let timeoutID;

        let resultsArray = [];

        stopButton.addEventListener('click', async () => {
            stopSearch = true;
            stopButton.remove();
            const messages = document.querySelectorAll('div#message');
            messages.forEach(message => {
                message.remove();
            });
            window.clearTimeout(timeoutID);
            console.log("Search closed by user.");
            const db = await openIndexedDB();

            const allKeys = await getAllKeys(db);
            let combinedContent = [];

            for (const key of allKeys) {
                const content = await getAllContentByKey(db, key);
                if (Array.isArray(content)) {
                    combinedContent = combinedContent.concat(content);
                }
            }

            await downloadResults(combinedContent, 'perlego.html');
        });

        async function getAllContentByKey(db, key) {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(['content'], 'readonly');
                const store = transaction.objectStore('content');
                const request = store.get(key);

                request.onsuccess = function (event) {
                    resolve(event.target.result);
                };

                request.onerror = function (event) {
                    reject(event.error);
                };
            });
        }

        async function scrollToFindPage(page) {
            const db = await openIndexedDB();
            const lastProcessedIndex = await getLastProcessedIndex(db) || 0;
            const storedResult = await getAllContent(db);

            resultsArray = storedResult ? storedResult : [];

            if (page <= pagefinal && !stopSearch) {
                if (page > lastProcessedIndex) {
                    const contentelement = await searchElement(page);

                    let message = document.getElementById('message');

                    if (contentelement === null && !stopSearch) {
                        if (!message) {
                        message = document.createElement('div');
                        message.style.position = 'fixed';
                        message.style.top = '50%';
                        message.style.left = '50%';
                        message.style.transform = 'translate(-50%, -50%)';
                        message.style.padding = '20px';
                        message.style.background = '#ffffff';
                        message.style.border = '1px solid #ccc';
                        message.style.zIndex = '9999';
                        message.style.fontWeight = 'bold';
                        message.id = 'message';
                        document.body.appendChild(message);
                        }
                        message.textContent = `Page ${page-1}/${pagefinal} found. Keep scrolling to the page ${pagefinal}`;
                        scrollToFindPage(page);
                    } else if (!stopSearch) {
                        let messageElement = document.getElementById('message');
                        if (messageElement) {
                            messageElement.textContent = `Page ${page}/${pagefinal} found. Keep scrolling to the page ${pagefinal}`;
                        }
                        console.log(`Page element content ${page} found:`);
                        const currentProgress = Math.floor((page / pagefinal) * 100);
                        sendProgress(currentProgress);
                        try {
                            resultsArray.push(contentelement);
                            await putLastProcessedIndex(db, page);
                            const chunkSize = 50;
                            let index = 0;
                            while (index < resultsArray.length) {
                                const chunk = resultsArray.slice(index, index + chunkSize);
                                index += chunkSize;
                                const paddedPage = `p${page}`.padStart(Math.max(4, `${page}`.length + 1), '0');
                                await putAllContent(db, paddedPage, chunk);
                            }
                            scrollToFindPage(page + 1);
                        } catch(error) {
                            console.log(error)
                        }
                        if (page === pagefinal) {
                            stopButton.click();
                            stopSearch = true;
                            return; 
                        }
                    }                    
                } else {
                    scrollToFindPage(page + 1);
                }
            }
        }
        await scrollToFindPage(1);
    } catch (error) {
        if (error) {
            console.log(error)
            throw new Error();
        }
    }
}

async function openIndexedDB() {
    return new Promise((resolve, reject) => {
        const dbOpenRequest = window.indexedDB.open('MyDatabase', 1);

        dbOpenRequest.onupgradeneeded = function (event) {
            const db = event.target.result;
            db.createObjectStore('content', { autoIncrement: true });
        };

        dbOpenRequest.onsuccess = function (event) {
            resolve(event.target.result);
        };

        dbOpenRequest.onerror = function (event) {
            reject(event.error);
        };
    });
}

async function clearIndexedDB() {
    try {
        const db = await openIndexedDB();
        const transaction = db.transaction(['content'], 'readwrite');
        const store = transaction.objectStore('content');
        store.clear();
        console.log('Previous data was successfully deleted.');
    } catch (error) {
        console.error('Error deleting previous data:', error);
    }
}

async function getLastProcessedIndex(db) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['content'], 'readonly');
        const store = transaction.objectStore('content');
        const lastIndexRequest = store.get('lastProcessedIndex');

        lastIndexRequest.onsuccess = function (event) {
            resolve(event.target.result || 0);
        };

        lastIndexRequest.onerror = function (event) {
            reject(event.error);
        };
    });
}

async function putLastProcessedIndex(db, index) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['content'], 'readwrite');
        const store = transaction.objectStore('content');
        const putRequest = store.put(index, 'lastProcessedIndex');

        putRequest.onsuccess = function (event) {
            resolve();
        };

        putRequest.onerror = function (event) {
            reject(event.error);
        };
    });
}

async function getTodocontent(db) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['content'], 'readonly');
        const store = transaction.objectStore('content');
        const request = store.get('AllContent');

        request.onsuccess = function (event) {
            resolve(event.target.result);
        };

        request.onerror = function (event) {
            reject(event.error);
        };
    });
}

async function putAllContent(db, key, content) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['content'], 'readwrite');
        const store = transaction.objectStore('content');
        const getRequest = store.get(key);

        getRequest.onsuccess = function (event) {
            const existingData = event.target.result || [];
            const newData = existingData.concat(content);
            store.put(newData, key);
            resolve();
        };

        getRequest.onerror = function (event) {
            reject(event.error);
        };
    });
}

startSearchingAndSaving();
})();
