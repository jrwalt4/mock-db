# fake-indexeddb [![Build Status](https://travis-ci.org/dumbmatter/fakeIndexedDB.svg?branch=master)](https://travis-ci.org/dumbmatter/fakeIndexedDB)

This is a pure JS in-memory implementation of [the IndexedDB API](https://w3c.github.io/IndexedDB/). Its main utility is for testing IndexedDB-dependent code in Node.js.

## Installation

```sh
npm install --save-dev fake-indexeddb
```

or

```sh
yarn add --dev fake-indexeddb
```

## Use

Functionally, it works exactly like IndexedDB except data is not persisted to disk.

The easiest way to use it is to use `auto()`, which will put all the IndexedDB objects in the global scope:

```js
require("fake-indexeddb").auto();

var request = indexedDB.open("test", 3);
request.onupgradeneeded = function () {
    var db = request.result;
    var store = db.createObjectStore("books", {keyPath: "isbn"});
    store.createIndex("by_title", "title", {unique: true});

    store.put({title: "Quarry Memories", author: "Fred", isbn: 123456});
    store.put({title: "Water Buffaloes", author: "Fred", isbn: 234567});
    store.put({title: "Bedrock Nights", author: "Barney", isbn: 345678});
}
request.onsuccess = function (event) {
    var db = event.target.result;

    var tx = db.transaction("books");

    tx.objectStore("books").index("by_title").get("Quarry Memories").addEventListener("success", function (event) {
        console.log("From index:", event.target.result);
    });
    tx.objectStore("books").openCursor(IDBKeyRange.lowerBound(200000)).onsuccess = function (event) {
        var cursor = event.target.result;
        if (cursor) {
            console.log("From cursor:", cursor.value);
            cursor.continue();
        }
    };
    tx.oncomplete = function () {
        console.log("All done!");
    };
};
```

Alternatively, you can import individual objects:

```js
var indexedDB = require("fake-indexeddb");
var IDBKeyRange = require("fake-indexeddb/FDBKeyRange");

// or...

import {default as indexedDB, FDBKeyRange as IDBKeyRange} from "fake-indexeddb";

// The rest is the same as above.
```

When importing individual classes directly (like `var IDBKeyRange = require("fake-indexeddb/FDBKeyRange");` above), file names of all the objects are like the normal IndexedDB ones except with F replacing I, e.g. `FDBIndex` instead of `IDBIndex`.

## Quality

Here's a comparison of fake-indexeddb and real browser IndexedDB implementations on [the W3C IndexedDB test suite](https://github.com/w3c/web-platform-tests/tree/master/IndexedDB) as of March 18, 2019:

Implementation | Percentage of files that pass completely
--- | ---
Chrome 73 | 99%
Firefox 65 | 97%
Safari 12 | 92%
fake-indexeddb 2.1.0 | 87%
Edge 18 | 61%

For browsers, I ran http://w3c-test.org/tools/runner/index.html and counted the passes. For fake-indexeddb, I ran `npm run test-w3c`.

87% is pretty good, right? Especially considering that fake-indexeddb runs in Node.js where failure is guaranteed for tests involving browser APIs like Web Workers. There are definitley still some weak points of fake-indexeddb, most of which are described in `src/test/web-platform-tests/run-all.js`. Your app will probably run fine, though.

## Potential applications:

1. Use as a mock database in unit tests.

2. Use the same API in Node.js and in the browser.

3. Support IndexedDB in old or crappy browsers.

4. Somehow use it within a caching layer on top of IndexedDB in the browser, since IndexedDB can be kind of slow.

5. Abstract the core database functions out, so what is left is a shell that allows the IndexedDB API to easily sit on top of many different backends.

6. Serve as a playground for experimenting with IndexedDB.

## License

Apache 2.0
