import { View } from "../view.js";
export const Facet = function () { };

Facet.prototype = {

}

Facet.prototype = Object.create(View.prototype);
Facet.prototype.constructor = Facet;
Facet.create = View.create;