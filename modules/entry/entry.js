import { View } from "../view.js";

export const Entry = function () { };

Entry.prototype = Object.create(View.prototype);
Entry.prototype.constructor = Entry;
Entry.create = View.create;