///^[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}\p{P}\s]+$/u.test('サイクリングロード');


var collection = {
  originalEntries : [
    { name : 'a'},
    { name : 'b'},
    { name : 'c'},
  ],
  currentEntries : [
    { name : 'a'},
  ]
};

var inform = function() {
  console.log('data updated', data);
}

var data = new Proxy(collection, {
  set(obj, prop, value) {
    debugger;
    return true;
  },
  get(obj, prop) {
    if (prop == 'entries'){
      return collection.currentEntries && collection.currentEntries.length ? collection.currentEntries : collection.originalEntries
    } else {
      return object[prop];
    }
  }
});

var getData = function () {
  return data.entries;
}