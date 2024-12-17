import { shuffleArray, speak } from "../utils.js";
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
    
    this.element.querySelector('.slide-info').innerHTML = JSON.stringify(this.entry);
    
    const pronounceLine = this.entry.lines.find(l => l.isPronounce);
    if (pronounceLine) {
      this.pronounceLine = pronounceLine;
      this.entry.lines = this.entry.lines.filter(l => l != pronounceLine);
    }
    
    this.element.querySelector('.slide-inner').addEventListener('click', function (e) {
      e.stopPropagation();
      e.preventDefault();
      if (e.target.classList.contains('js-slide-inner')) {
        this.rotate(e.target);
      }
    }.bind(this));
  },

  renderSides: async function () {
    this.sideViews = await this.sidesToSidesViews();
    shuffleArray(this.sideViews)[0].element.classList.add('current');
    shuffleArray(this.sideViews).forEach(o => o.show());
    if (this.pronounceLine) {
      this.element.insertAdjacentHTML('afterBegin', `<div class="slidePronounce">
          ${this.pronounceLine.text}
        </div>`);
      this.element.querySelector('.slidePronounce').addEventListener('click', (e) => {
        const t = e.target;
        
        if (!t.classList.contains('listened') && !t.classList.contains('revealed')) {
          t.classList.add('listened');
speak(t.innerText);
        } else if (t.classList.contains('listened') && !t.classList.contains('revealed')) {
          t.classList.add('revealed');
          t.classList.remove('listened');
        } else if (t.classList.contains('revealed') && !t.classList.contains('listened')) {
          t.classList.remove('revealed');
        }
      });
    }
  },

  rotate: function (el) {
    const slide = el.classList.contains('slide-inner') ? el : el.closest('.slide-inner');
    if (slide.querySelectorAll('.slide-side').length == 1) return;
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

  show: async function () {
    View.prototype.show.call(this);
    this.setSlideProps();
    await this.renderSides();
  }
});
Slide.prototype.constructor = Slide;
