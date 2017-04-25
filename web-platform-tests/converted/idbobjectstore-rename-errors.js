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


'use strict';

promise_test(testCase => {
    return createDatabase(testCase, (database, transaction) => {
        createBooksStore(testCase, database);
    }).then(database => {
        database.close();
    }).then(() => migrateDatabase(testCase, 2, (database, transaction) => {
        const store = transaction.objectStore('books');
        database.deleteObjectStore('books');
        assert_throws('InvalidStateError', () => store.name = 'renamed_books');
    })).then(database => {
        database.close();
    });
}, 'IndexedDB deleted object store rename throws');

promise_test(testCase => {
    return createDatabase(testCase, (database, transaction) => {
        createBooksStore(testCase, database);
    }).then(database => {
        const transaction = database.transaction('books', 'readonly');
        const store = transaction.objectStore('books');
        assert_throws('InvalidStateError', () => store.name = 'renamed_books');
        database.close();
    });
}, 'IndexedDB object store rename throws in a readonly transaction');

promise_test(testCase => {
    return createDatabase(testCase, (database, transaction) => {
        createBooksStore(testCase, database);
    }).then(database => {
        const transaction = database.transaction('books', 'readwrite');
        const store = transaction.objectStore('books');

        assert_throws('InvalidStateError', () => store.name = 'renamed_books');
        database.close();
    });
}, 'IndexedDB object store rename throws in a readwrite transaction');

promise_test(testCase => {
    let bookStore = null;
    return createDatabase(testCase, (database, transaction) => {
        bookStore = createBooksStore(testCase, database);
    }).then(database => {
        assert_throws('TransactionInactiveError',
            () => { bookStore.name = 'renamed_books'; });
        database.close();
    });
}, 'IndexedDB object store rename throws in an inactive transaction');

promise_test(testCase => {
    return createDatabase(testCase, (database, transaction) => {
        createBooksStore(testCase, database);
        createNotBooksStore(testCase, database);
    }).then(database => {
        database.close();
    }).then(() => migrateDatabase(testCase, 2, (database, transaction) => {
        const store = transaction.objectStore('books');
        assert_throws('ConstraintError', () => store.name = 'not_books');
        assert_array_equals(
            database.objectStoreNames, ['books', 'not_books'],
            'A store rename that throws an exception should not change the ' +
            "store's IDBDatabase.objectStoreNames");
    })).then(database => {
        assert_array_equals(
            database.objectStoreNames, ['books', 'not_books'],
            'Committing a transaction with a failed store rename attempt ' +
            "should not change the store's IDBDatabase.objectStoreNames");
        const transaction = database.transaction('books', 'readonly');
        const store = transaction.objectStore('books');
        return checkStoreContents(
            testCase, store,
            'Committing a transaction with a failed rename attempt should ' +
            "not change the store's contents").then(() => database.close());
    });
}, 'IndexedDB object store rename to the name of another store throws');

promise_test(testCase => {
    return createDatabase(testCase, (database, transaction) => {
        createBooksStore(testCase, database);
    }).then(database => {
        database.close();
    }).then(() => migrateDatabase(testCase, 2, (database, transaction) => {
        const store = transaction.objectStore('books');
        assert_throws(
            { name: 'Custom stringifying error' },
            () => {
              store.name = {
                toString: () => { throw { name: 'Custom stringifying error'}; }
              };
            }, 'IDBObjectStore rename should re-raise toString() exception');
        assert_array_equals(
            database.objectStoreNames, ['books'],
            'A store rename that throws an exception should not change the ' +
            "store's IDBDatabase.objectStoreNames");
    })).then(database => {
        assert_array_equals(
            database.objectStoreNames, ['books'],
            'Committing a transaction with a failed store rename attempt ' +
            "should not change the store's IDBDatabase.objectStoreNames");
        const transaction = database.transaction('books', 'readonly');
        const store = transaction.objectStore('books');
        return checkStoreContents(
            testCase, store,
            'Committing a transaction with a failed rename attempt should ' +
            "not change the store's contents").then(() => database.close());
    });
}, 'IndexedDB object store rename handles exceptions when stringifying names');

