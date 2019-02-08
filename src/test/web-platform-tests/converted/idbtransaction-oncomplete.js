require("../support-node");

var db,
    store,
    t = async_test(document.title, { timeout: 10000 }),
    open_rq = createdb(t),
    stages = [];

open_rq.onupgradeneeded = function(e) {
    stages.push("upgradeneeded");

    db = e.target.result;
    store = db.createObjectStore("store");

    e.target.transaction.oncomplete = function() {
        stages.push("complete");
    };
};

open_rq.onsuccess = function(e) {
    stages.push("success");

    // Making a totally new transaction to check
    db
        .transaction("store")
        .objectStore("store")
        .count().onsuccess = t.step_func(function(e) {
        assert_array_equals(stages, ["upgradeneeded", "complete", "success"]);
        t.done();
    });
    // XXX: Make one with real transactions, not only open() versionchange one

    /*db.transaction.objectStore('store').openCursor().onsuccess = function(e) {
            stages.push("opencursor1");
        }

        store.openCursor().onsuccess = function(e) {
            stages.push("opencursor2");
        }

        e.target.transaction.objectStore('store').openCursor().onsuccess = function(e) {
            stages.push("opencursor3");
        }
        */
};