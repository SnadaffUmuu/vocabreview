import { Facet } from "../facet/facet.js"
import { View } from "../view.js";

export const SlideSide = function (text) {
  this.templateSelector = '.js-slide-side';
  this.templatePath = 'modules/slide/slide-side.html';
  this.containerSelector = '.js-slide';
  this.text = text;

  this.show = function () {
    View.prototype.show.call(this);
    this.element.innerHTML = this.text;
  };
}
SlideSide.prototype = new View();