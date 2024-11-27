import { Facet } from "../facet/facet.js"

export const SlideSide = function () {
  this.templateSelector = '.js-slide-side';
  this.templatePath = 'modules/slide/slide-side.html';
  this.containerSelector = '.js-slide';
}
SlideSide.prototype = Object.create(Facet.prototype);
SlideSide.prototype.constructor = SlideSide;
SlideSide.create = Facet.create;