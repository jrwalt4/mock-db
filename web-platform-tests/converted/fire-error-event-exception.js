require("../../build/global");
const Event = require("../../build/lib/FakeEvent").default;
const {
    add_completion_callback,
    assert_array_equals,
    assert_equals,
    assert_false,
    assert_key_equals,
    assert_not_equals,
    assert_throws,
    assert_true,
    async_test,
    createdb,
    createdb_for_multiple_tests,
    fail,
    format_value,
    indexeddb_test,
    setup,
    test,
} = require("../support-node");

const document = {};
const window = global;


setup({allow_uncaught_exception:true});

function fire_error_event_test(func, description) {
  indexeddb_test(
    (t, db) => {
      db.createObjectStore('s');
    },
    (t, db) => {
      const tx = db.transaction('s', 'readwrite');
      tx.oncomplete = t.unreached_func('transaction should abort');
      const store = tx.objectStore('s');
      store.put(0, 0);
      const request = store.add(0, 0);
      request.onsuccess = t.unreached_func('request should fail');
      func(t, db, tx, request);
    },
    description);
}

// Listeners on the request.

fire_error_event_test((t, db, tx, request) => {
  request.onerror = () => {
    throw Error();
  };
  tx.onabort = t.step_func_done(() => {
    assert_equals(tx.error.name, 'AbortError');
  });
}, 'Exception in error event handler on request');

fire_error_event_test((t, db, tx, request) => {
  request.onerror = e => {
    e.preventDefault();
    throw Error();
  };
  tx.onabort = t.step_func_done(() => {
    assert_equals(tx.error.name, 'AbortError');
  });
}, 'Exception in error event handler on request, with preventDefault');

fire_error_event_test((t, db, tx, request) => {
  request.addEventListener('error', () => {
    throw Error();
  });
  tx.onabort = t.step_func_done(() => {
    assert_equals(tx.error.name, 'AbortError');
  });
}, 'Exception in error event listener on request');

fire_error_event_test((t, db, tx, request) => {
  request.addEventListener('error', () => {
    // no-op
  });
  request.addEventListener('error', () => {
    throw Error();
  });
  tx.onabort = t.step_func_done(() => {
    assert_equals(tx.error.name, 'AbortError');
  });
}, 'Exception in second error event listener on request');

fire_error_event_test((t, db, tx, request) => {
  let second_listener_called = false;
  request.addEventListener('error', () => {
    throw Error();
  });
  request.addEventListener('error', t.step_func(() => {
    second_listener_called = true;
    assert_true(is_transaction_active(tx, 's'),
                'Transaction should be active until dispatch completes');
  }));
  tx.onabort = t.step_func_done(() => {
    assert_true(second_listener_called);
    assert_equals(tx.error.name, 'AbortError');
  });
}, 'Exception in first error event listener on request, ' +
   'transaction active in second');

// Listeners on the transaction.

fire_error_event_test((t, db, tx, request) => {
  tx.onerror = () => {
    throw Error();
  };
  tx.onabort = t.step_func_done(() => {
    assert_equals(tx.error.name, 'AbortError');
  });
}, 'Exception in error event handler on transaction');

fire_error_event_test((t, db, tx, request) => {
  tx.onerror = e => {
    e.preventDefault();
    throw Error();
  };
  tx.onabort = t.step_func_done(() => {
    assert_equals(tx.error.name, 'AbortError');
  });
}, 'Exception in error event handler on transaction, with preventDefault');

fire_error_event_test((t, db, tx, request) => {
  tx.addEventListener('error', () => {
    throw Error();
  });
  tx.onabort = t.step_func_done(() => {
    assert_equals(tx.error.name, 'AbortError');
  });
}, 'Exception in error event listener on transaction');

fire_error_event_test((t, db, tx, request) => {
  tx.addEventListener('error', () => {
    // no-op
  });
  tx.addEventListener('error', () => {
    throw Error();
  });
  tx.onabort = t.step_func_done(() => {
    assert_equals(tx.error.name, 'AbortError');
  });
}, 'Exception in second error event listener on transaction');

fire_error_event_test((t, db, tx, request) => {
  let second_listener_called = false;
  tx.addEventListener('error', () => {
    throw Error();
  });
  tx.addEventListener('error', t.step_func(() => {
    second_listener_called = true;
    assert_true(is_transaction_active(tx, 's'),
                'Transaction should be active until dispatch completes');
  }));
  tx.onabort = t.step_func_done(() => {
    assert_true(second_listener_called);
    assert_equals(tx.error.name, 'AbortError');
  });
}, 'Exception in first error event listener on transaction, ' +
   'transaction active in second');

// Listeners on the connection.

fire_error_event_test((t, db, tx, request) => {
  db.onerror = () => {
    throw Error();
  };
  tx.onabort = t.step_func_done(() => {
    assert_equals(tx.error.name, 'AbortError');
  });
}, 'Exception in error event handler on connection');

fire_error_event_test((t, db, tx, request) => {
  db.onerror = e => {
    e.preventDefault()
    throw Error();
  };
  tx.onabort = t.step_func_done(() => {
    assert_equals(tx.error.name, 'AbortError');
  });
}, 'Exception in error event handler on connection, with preventDefault');

fire_error_event_test((t, db, tx, request) => {
  db.addEventListener('error', () => {
    throw Error();
  });
  tx.onabort = t.step_func_done(() => {
    assert_equals(tx.error.name, 'AbortError');
  });
}, 'Exception in error event listener on connection');

fire_error_event_test((t, db, tx, request) => {
  db.addEventListener('error', () => {
    // no-op
  });
  db.addEventListener('error', () => {
    throw Error();
  });
  tx.onabort = t.step_func_done(() => {
    assert_equals(tx.error.name, 'AbortError');
  });
}, 'Exception in second error event listener on connection');

fire_error_event_test((t, db, tx, request) => {
  let second_listener_called = false;
  db.addEventListener('error', () => {
    throw Error();
  });
  db.addEventListener('error', t.step_func(() => {
    second_listener_called = true;
    assert_true(is_transaction_active(tx, 's'),
                'Transaction should be active until dispatch completes');
  }));
  tx.onabort = t.step_func_done(() => {
    assert_true(second_listener_called);
    assert_equals(tx.error.name, 'AbortError');
  });
}, 'Exception in first error event listener on connection, ' +
   'transaction active in second');

