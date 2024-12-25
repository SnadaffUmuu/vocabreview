import { Element } from "../element.js";

export const SlideSide = function () {
}
SlideSide.prototype = Object.assign(Object.create(Element.prototype), {
  templateSelector : '.js-slide-side',
  templatePath : 'modules/slide/slide-side.html',
  
  setClasses : function(line, element) {
    if (line.isCompact) {
      element.classList.add('compact')
    }
  },

  render : function (line) {
    const element = this.getElement();
    element.innerHTML = line.text;
    if (line.speakable) {
      element.setAttribute('data-reading', line.text);
    }
    if (line.pronounce) {
      element.dataset.pronounce = line.pronounce;
    }
    /*
    if (line.isPronounce) {
      element.dataset.isPronounce = true;
    }
    */
    this.setClasses(line, element);
    return element;
  }
});
SlideSide.prototype.constructor = SlideSide;
