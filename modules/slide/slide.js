import { Entry } from "../entry/entry.js";
import { View } from "../view.js";

export const Slide = function () {
  this.templateSelector = '.js-slide';

  this.templatePath = 'modules/slide/slide.html';

  this.containerSelector = '.js-slider';

  this.rotate = (el) => {
    const slide = el.classList.contains('slide-inner') ? el : el.closest('.slide-inner');
    const current = slide.querySelector('.current');
    if (current && current.nextElementSibling) {
      current.nextElementSibling.classList.add('current');
      speak(current.nextElementSibling);
    } else {
      const speakableEl = slide.querySelector('.card-inner');
      speakableEl.classList.add('current');
      speak(speakableEl);
    }
    if (current && current.classList) {
      current.classList.remove('current');
    }
  }  
};
Slide.prototype = Object.create(Entry.prototype);
Slide.prototype.constructor = Slide;
Slide.create = function (entry, i) {
  View.create.call(this);
}