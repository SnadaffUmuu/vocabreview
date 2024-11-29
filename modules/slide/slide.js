import { Entry } from "../entry/entry.js";
import { View } from "../view.js";
import { SlideSide } from "./slide-side.js";

export const Slide = function (entry) {
  //TODO: перенести в прототип слайда, чтобы не копировались
  this.templateSelector = '.js-slide';

  this.templatePath = 'modules/slide/slide.html';

  this.containerSelector = '.js-slider';

  this.lines = entry.lines;

  this.sidesToSidesViews = async () => {
    const results = await Promise.all(
      this.lines.map(async (line) => {
        return View.create(SlideSide, line)
      })
    );
    return results;
  };  

  this.renderSides = async () => {
    this.sideViews = await this.sidesToSidesViews();
    this.sideViews.forEach(o => o.show())
  };

  this.rotate = function(el) {
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
  };

  this.show = async function (el) {
    View.prototype.show.call(this);
    await this.renderSides()
  };
};
Slide.prototype = new View();
//Slide.prototype = new Entry();
/*
Slide.prototype = Object.create(Entry.prototype);
Slide.prototype.constructor = Slide;
Slide.create = async function (entry) {
  const instance = await Entry.create.call(this, entry);
  return instance;
}
*/