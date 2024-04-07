function sendProgress(progress){
    chrome.runtime.sendMessage({ type: 'progressUpdate', progress: progress });
}

function clickAndCaptureRawContent(index, pagefinal) {
    const time = 2000
    return new Promise((resolve, reject) => {
        var elementIndex = document.querySelector('[data-test-locator="Epub-ChapterRow-Index-'+index+'"] [tabindex="0"]');
        if (elementIndex) {
            elementIndex.click();
            setTimeout(() => {
                function verifyElement() {
                    var elementCaptured = document.evaluate("//div[@class='chapter-loaded highlighter-context' and @id='p"+index+"--0']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    if (elementCaptured) {
                        resolve(elementCaptured.outerHTML+'<br>\n\n');
                        } else {
                            setTimeout(verifyElement, 1000);
                        }
                    }
                    verifyElement(); 
            }, time);
        
        } else {
            try {
                const element = document.evaluate("//div[@data-test-locator='Pdf-SubChapterRow-Page-"+index+"']/div", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                const elementsub = document.evaluate("//div[@data-test-locator='Pdf-SubSubChapterRow-Page-"+index+"']/div", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                if (element || elementsub) {
                    if (element) {
                        element.click();
                    } else {
                        elementsub.click();
                    }
                    setTimeout(() => {
                            function verifyElement() {
                                var elementCaptured = document.evaluate("//div[@class='chapter-loaded highlighter-context' and @id='p"+index+"--0']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                                if (elementCaptured) {
                                    resolve(elementCaptured.outerHTML+'<br>\n\n');
                                } else {
                                    setTimeout(verifyElement, 1000);
                                }
                            }
                        verifyElement(); 
                    }, time);                     
                } else {
                    var elementCaptured = document.evaluate("//div[@class='chapter-loaded highlighter-context' and @id='p"+index+"--0']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    if (elementCaptured) {
                        resolve(elementCaptured.outerHTML+'<br>\n\n');
                    }
                    try {
                        const num = index+1
                        const element = document.evaluate("//div[@data-test-locator='Epub-ChapterRow-Page-"+num+"']/div", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                        if (element) {                                
                            let stopButton = document.createElement('button');
                            stopButton.textContent = 'PDF file, use manual mode to download';
                            stopButton.style.position = 'fixed';
                            stopButton.style.top = '54%';
                            stopButton.style.right = '46%';
                            stopButton.style.zIndex = '9999';
                            stopButton.style.backgroundColor = 'white'; 
                            stopButton.style.color = 'green'; 
                            stopButton.style.fontWeight = 'bold';
                            document.body.appendChild(stopButton);
                        } else{
                            reject('Element not found ' + index);
                        }
                    } catch(error){
                        reject(error);
                    }
                }
            
            } catch(error){
                reject('Element not found ' + index);
            }
        }
    });
}

async function OpenButton(){
    const buttonTOC = document.querySelector('button[data-test-locator="Icon-TOC"]');
    if (!buttonTOC) {
        console.log("Table of Contents button not found");
    } else {
        let contentTOC = document.querySelector('[data-test-locator="ToolbarPanel"]');

        if (!contentTOC) {
            console.log("Table of Contents content not found. Opening now...");
        
            buttonTOC.click();
        
            setTimeout(() => {
                contentTOC = document.querySelector('[data-test-locator="ToolbarPanel"]');
                if (contentTOC) {
                    createFileDownloadContent();
                    console.log("Table of Contents content was opened successfully.");
                } else {
                    console.log("Failed to open content from Table of Contents.");
                }
            }, 2000);
        } else {
            createFileDownloadContent();
        }
    }
}


async function createFileDownloadContent() {
    let allRawContent = '';
    const elements = document.querySelectorAll('[data-test-locator^="Epub-ChapterRow-"]');
    const db = await openIndexedDB(); 

    if (elements.length > 0) {
        let lastProcessedIndex = await getLastProcessedIndex(db) || 0;
        console.log(lastProcessedIndex)
        let allRawContent = await getAllContent(db) || ''; 
        //const lastElement = elements[elements.length - 1];
        //const lastindexcont = lastElement.getAttribute('data-test-locator').match(/\d+$/)[0];
        //const result = document.evaluate("/html/body/div[1]/main/div[1]/div[2]/div[3]/div/text()[3]",document,null,XPathResult.FIRST_ORDERED_NODE_TYPE,null).singleNodeValue;
        //const result2 = document.evaluate("/html/body/div[1]/main/div[1]/div[2]/div[4]/div/text()[3]",document,null,XPathResult.FIRST_ORDERED_NODE_TYPE,null).singleNodeValue;
        //let text = '';

        //let node = result || result2;
        //text = node.textContent.trim();
        var divs = document.querySelectorAll('div[data-test-locator]');
        var biggerNumber = -1;
        divs.forEach(function(element) {
            var value = element.getAttribute('data-test-locator');
            var match = value.match(/\d+/);
            if (match !== null) {
                var number = parseInt(match[0]);
                if (number > biggerNumber) {
                    biggerNumber = number;
                }
            }
        });
        const pagefinal = biggerNumber;
		lastindex = pagefinal
        console.log("Last page is: " + lastindex);
        for (let i = lastProcessedIndex; i <= lastindex; i++) {
            try {
                const rawContent = await clickAndCaptureRawContent(i, lastindex);
                allRawContent += rawContent; 
                const currentProgress = Math.floor((i / lastindex) * 100);
                sendProgress(currentProgress);
                lastProcessedIndex = i;
                await putLastProcessedIndex(db, lastProcessedIndex+1);
                await putAllContent(db, allRawContent);
            } catch (error) {
                console.log(error);
            }
        }
        let img_tags = allRawContent.split('</picture>');

        let modified_html = '';

        for (let index = 0; index < img_tags.length; index++) {
            let img = img_tags[index];

            if (img.includes('source data-srcset=')) {
                let srcset_start = img.indexOf('source data-srcset=') + 'source data-srcset="'.length;
                let srcset_end = img.indexOf('"', srcset_start);
                let srcset_value = img.substring(srcset_start, srcset_end);
                img = img.replace(srcset_value, '') + srcset_value + '"</picture>';
            }
            modified_html += img;

            if (index !== img_tags.length - 1) {
                modified_html += '</picture>';
            }
        }

        let modified = modified_html.replace(/">https/g, '" src="https').replace(/opacity: 0/g, 'opacity: 1').replace(/<.picture><.picture>/g, '</picture>');
        var blob = new Blob(['<head><meta charset="UTF-8"></head><div id="content" class="content highlighter-context" col-centered="true" style="max-width: 792.952px;">'+modified.replace(/Georgia; object-fit: contain; width: 100%; height: 100%;/g,'Georgia; object-fit: contain; width: 100%;')], { type: 'text/html' });

        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'perlego.html';

        link.click();
        resetAndStartCapture()
    }
}

async function getAllContent(db) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['content'], 'readonly');
        const store = transaction.objectStore('content');
        const request = store.get('allContent');

        request.onsuccess = function(event) {
            resolve(event.target.result);
        };

        request.onerror = function(event) {
            reject(event.error);
        };
    });
}

async function putAllContent(db, content) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['content'], 'readwrite');
        const store = transaction.objectStore('content');
        const request = store.put(content, 'allContent');

        request.onsuccess = function(event) {
            resolve();
        };

        request.onerror = function(event) {
            reject(event.error);
        };
    });
}

async function openIndexedDB() {
    return new Promise((resolve, reject) => {
        const dbOpenRequest = window.indexedDB.open('MyDatabase', 1);

        dbOpenRequest.onupgradeneeded = function(event) {
            const db = event.target.result;
            db.createObjectStore('content', { autoIncrement: true });
        };

        dbOpenRequest.onsuccess = function(event) {
            resolve(event.target.result);
        };

        dbOpenRequest.onerror = function(event) {
            reject(event.error);
        };
    });
}

async function getLastProcessedIndex(db) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['content'], 'readonly');
        const store = transaction.objectStore('content');
        const lastIndexRequest = store.get('lastProcessedIndex');

        lastIndexRequest.onsuccess = function(event) {
            resolve(event.target.result || 0);
        };

        lastIndexRequest.onerror = function(event) {
            reject(event.error);
        };
    });
}

async function putLastProcessedIndex(db, index) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['content'], 'readwrite');
        const store = transaction.objectStore('content');
        const putRequest = store.put(index, 'lastProcessedIndex');

        putRequest.onsuccess = function(event) {
            resolve();
        };

        putRequest.onerror = function(event) {
            reject(event.error);
        };
    });
}

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
}

OpenButton()
