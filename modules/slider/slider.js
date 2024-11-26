import { View } from "../view.js";
import { shuffleArray, regex } from "../utils.js";
import { Application } from "../app.js";
import { DataFactory } from "../data.js";

export const Slider = function () {
  this.templateSelector = '#my-keen-slider';
  this.templatePath = 'modules/slider/slider.html';
  this.slider = null;

  this.events = {
  };

  this.renderSlider = () => {
    this.element.innerHTML = '';
    shuffleArray(Application.data.entries).forEach((entry, i) => {
      const lines = shuffleArray(entry.lines).map(s => {
        let classes = [];
        if (regex.nonJapaneseRegex.test(s)) {
          classes.push('transcription')
        }
        return `<div class="card-inner ${classes.join(' ')}"${DataFactory.isForReading(s) ? ' data-reading="' + s + '"' : ''}>${s}</div>`
      }).join(``);
      this.element.insertAdjacentHTML('beforeend', `
          <div class="keen-slider__slide ${entry.type ? entry.type : ''}">
            <div class="slide-inner" data-entry="${i}">
              ${lines}
            </div>
          </div>
          `);
      const entryEl = this.element.querySelector(`[data-entry="${i}"] .card-inner`);
      if (entryEl) {
        entryEl.classList.add('current');
      }
    })

    Array.from(this.element.querySelectorAll('.slide-inner')).forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        //rotate(e.target);
      })
    })

    this.slider = new KeenSlider(
      "#my-keen-slider",
      {
        loop: true,
        created: (slider) => {
          console.log('slider created')
          /*
          console.log(slider.slides)
          console.log('rel', slider.track.details.rel)
          console.log('current slide element', slider.slides[0])
          console.log('current slide text', slider.slides[0].innerText)
          */
          const current = slider.slides[0].querySelector('.current[data-reading]')
          if (current) {
            //speak(current)
          }
        },
        slideChanged: (slider) => {
          console.log('slider changed')
          /*
          console.log(slider.slides)
          console.log('rel', slider.track.details.rel)
          console.log('current slide element', slider.slides[slider.track.details.rel])
          console.log('current slide text', slider.slides[slider.track.details.rel].innerText)
          */
          const current = slider.slides[slider.track.details.rel].querySelector('.current[data-reading]');
          if (current) {
            //speak(current)
          }
        }
      },
    );
  }

  this.show = function () {
    View.prototype.show.call(this);
    this.renderSlider();
  }
};
Slider.prototype = Object.create(View.prototype);
Slider.prototype.constructor = Slider;
Slider.create = View.create;