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


    var t = async_test(),
      record = { key: 1, property: "data" };

    var open_rq = createdb(t);
    open_rq.onupgradeneeded = function(e) {
        var rq,
          db = e.target.result,
          objStore = db.createObjectStore("store", { keyPath: "key" });

        assert_throws("DataError",
            function() { rq = objStore.add(record, 1); });

        assert_equals(rq, undefined);
        t.done();
    };