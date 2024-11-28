import { View } from "../view.js";

export const Facet = function () { };

Facet.prototype = Object.create(View.prototype);
Facet.prototype.constructor = Facet;
Facet.create = async function (text) {
  const instanse = await View.create.call(this);
  instanse.text = text;
  return instanse
}