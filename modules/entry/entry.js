import { View } from "../view.js";

export const Entry = function () {
};

//Entry.prototype = Object.create(View.prototype);
//Entry.prototype.constructor = Entry;
Entry.prototype = new View();
/*
Entry.create = async function (entry) {
  const instanse = await View.create.call(this);
  instanse.lines = [...entry.lines];
  return instanse
}
*/