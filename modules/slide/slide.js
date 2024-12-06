import { Application } from "../app.js";
import { shuffleArray } from "../utils.js";
import { View } from "../view.js";
import { SlideSide } from "./slide-side.js";

export const Slide = function (entry) {
  this.entry = entry;
};

Slide.prototype = Object.assign(Object.create(View.prototype), {
  templateSelector: '.js-slide',
  templatePath: 'modules/slide/slide.html',
  containerSelector: '.js-slider',

  sidesToSidesViews: async function () {
    const results = await Promise.all(
      this.entry.lines.map(async (line) => {
        return View.create(SlideSide, line, this)
      })
    );
    return results;
  },

  setSlideProps : function() {
    this.element.dataset.section = this.entry.section
    if (this.entry.type) {
      this.element.classList.add(this.entry.type)
    }
    this.element.querySelector('.slide-inner').addEventListener('click', function (e) {
      e.stopPropagation();
      e.preventDefault();
      if (e.target.classList.contains('js-slide-inner')) {
        this.rotate(e.target);
      }
    }.bind(this))
  },

  renderSides: async function () {
    this.sideViews = await this.sidesToSidesViews();
    this.sideViews[0].element.classList.add('current');
    shuffleArray(this.sideViews).forEach(o => o.show())
  },

  rotate: function (el) {
    const slide = el.classList.contains('slide-inner') ? el : el.closest('.slide-inner');
    const current = slide.querySelector('.current');
    let newCurrent = null;
    if (current && current.nextElementSibling) {
      newCurrent = current.nextElementSibling
    } else {
      newCurrent = slide.querySelector('.slide-side')
    }
    newCurrent.classList.add('current');
    if (current && current.classList) {
      current.classList.remove('current');
    }
  },

  show: async function (el) {
    View.prototype.show.call(this);
    this.setSlideProps();
    await this.renderSides();
  }
});
Slide.prototype.constructor = Slide;