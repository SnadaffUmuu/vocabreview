import { regex } from "../utils.js";
import { View } from "../view.js";
import { DataFactory } from "../data.js";

export const SlideSide = function (text, parent) {
  this.text = text;
  this.containerElement = parent.element.querySelector('.js-slide-inner');
}
SlideSide.prototype = Object.assign(Object.create(View.prototype), {
  templateSelector : '.js-slide-side',
  templatePath : 'modules/slide/slide-side.html',
  setClasses : function() {
    if (regex.nonJapaneseRegex.test(this.text)) {
      this.element.classList.add('transcription')
    }
  },

  isForReading : function(){
    return DataFactory.isForReading(this.text);
  },

  show : function () {
    View.prototype.show.call(this);
    this.element.innerHTML = this.text;
    if (this.isForReading()) {
      this.element.setAttribute('data-reading', this.text);
    }
    this.setClasses();
  }
});
SlideSide.prototype.constructor = SlideSide;

