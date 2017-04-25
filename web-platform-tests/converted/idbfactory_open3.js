require("../../build/global.js");
const {
    add_completion_callback,
    assert_array_equals,
    assert_equals,
    assert_false,
    assert_not_equals,
    assert_throws,
    assert_true,
    async_test,
    createdb,
    createdb_for_multiple_tests,
    fail,
    indexeddb_test,
    setup,
    test,
} = require("../support-node.js");

const document = {};
const window = global;


    var open_rq = createdb(async_test(), undefined, 13);
    var did_upgrade = false;

    open_rq.onupgradeneeded = function() {};
    open_rq.onsuccess = function(e) {
        var db = e.target.result;
        db.close();

        var open_rq2 = window.indexedDB.open(db.name);
        open_rq2.onsuccess = this.step_func(function(e) {
            assert_equals(e.target.result.version, 13, "db.version")
            this.done();
        });
        open_rq2.onupgradeneeded = fail(this, 'Unexpected upgradeneeded')
        open_rq2.onerror = fail(this, 'Unexpected error')
    }