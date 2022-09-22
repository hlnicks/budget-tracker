let db;
const request = indexedDB.open('budget', 1);

request.onupgradeneeded = function(event) {
  const db = event.target.result;
  db.createObjectStore('new_transaction', { autoIncrement: true });
};

// if successful
request.onsuccess = function(event) {
  db = event.target.result;
  if (navigator.onLine) {
    uploadTransaction();
  }
};

// function will run if no internet available
function saveRecord(record) {
  const transaction = db.transaction(['new_transaction'], 'readwrite');
  const transactionObjectStore = transaction.objectStore('new_transaction');
  transactionObjectStore.add(record);
}

// uploads transactions
function uploadTransaction() {
  const transaction = db.transaction(['new_transaction'], 'readwrite');
  const transactionObjectStore = transaction.objectStore('new_transaction');
  const getAll = transactionObjectStore.getAll();
  getAll.onsuccess = function() {

  // if there was data in store, send to api server
  if (getAll.result.length > 0) {
    fetch('/api/transaction/bulk', {
      method: 'POST',
      body: JSON.stringify(getAll.result),
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(serverResponse => {
      if (serverResponse.message) {
        throw new Error(serverResponse);
      }

      const transaction = db.transaction(['new_transaction'], 'readwrite');
      const transactionObjectStore = transaction.objectStore('new_transaction');

      // clears
      transactionObjectStore.clear();
    })
  }
  };
};

// event listener
window.addEventListener('online', uploadTransaction);