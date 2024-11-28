import { Facet } from "../facet/facet.js"
import { View } from "../view.js";

export const SlideSide = function () {
  this.templateSelector = '.js-slide-side';
  this.templatePath = 'modules/slide/slide-side.html';
  this.containerSelector = '.js-slide';

  this.show = function () {
    View.prototype.show.call(this);
    this.element.innerHTML = this.text;
  };
}
SlideSide.prototype = Object.create(Facet.prototype);
SlideSide.prototype.constructor = SlideSide;
SlideSide.create = async function (text) {
  const instance = await Facet.create.call(this, text);
  return instance;
}