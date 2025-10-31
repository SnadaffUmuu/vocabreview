import { Element } from "../element.js";

export const SlideSide = function () {
}
SlideSide.prototype = Object.assign(Object.create(Element.prototype), {
  templateSelector : '.js-slide-side',
  templatePath : 'modules/slide/slide-side.html',
  
  setClasses : function(line, element) {
    if (line.isCompact || line.role == 'example') {
      element.classList.add('compact')
    }
  },

  render : function (line) {
    const element = this.getElement();
    element.innerHTML = `<span>${line.text}</span>`;
    element.dataset.index = line.originalIndex;
    if (line.speakable) {
      element.dataset.reading = line.text;
    }
    if (line.translationLineIndex) {
      element.dataset.translationLineIndex = line.translationLineIndex;
    }
    /*
    if (line.reading) {
      element.dataset.reading = line.reading;
    }
    */
    if (line.role) {
      element.dataset.role = line.role;
    }
    this.setClasses(line, element);
    return element;
  }
});
SlideSide.prototype.constructor = SlideSide;
