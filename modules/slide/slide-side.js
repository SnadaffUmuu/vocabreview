import { speak } from "../utils.js";
import { View } from "../view.js";

export const SlideSide = function (line, parent) {
  this.parent = parent;
  this.line = line;
  this.containerElement = this.parent.element.querySelector('.js-slide-inner');
}
SlideSide.prototype = Object.assign(Object.create(View.prototype), {
  templateSelector : '.js-slide-side',
  templatePath : 'modules/slide/slide-side.html',
  setClasses : function() {
    if (this.line.isTranslation) {
      this.element.classList.add('translation')
    }
  },

  show : function () {
    View.prototype.show.call(this);
    this.element.innerHTML = this.line.text;
    if (this.line.speakable) {
      this.element.setAttribute('data-reading', this.line.text);
      //this.element.setAttribute('data-reading', this.line.pronounce ? this.line.pronounce : this.line.text);
      this.element.addEventListener('click', (e) => {
        e.stopImmediatePropagation();
        e.preventDefault();
        speak(e.target.dataset.reading)
      })
    }
    if (this.line.pronounce) {
      this.element.dataset.pronounce = this.line.pronounce;
    }
   if (this.line.isPronounce) {
      this.element.dataset.isPronounce = true;
    }
    this.setClasses();
  }
});
SlideSide.prototype.constructor = SlideSide;
