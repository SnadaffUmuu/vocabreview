import { View } from "../view.js";
import { shuffleArray, speak } from "../utils.js";
import { Application } from "../app.js";
import { Slide } from "../slide/slide.js";

export const Slider = function () {
  this.slider = null;
  this.slideViews = [];
  this.keensliderContainer = null;
  this.currentSlideIndexEl = null;
  this.renderedEvents = {
    click : {
      '.slide-inner' : 'rotateSlide',
      '.slidePronounce' : 'readPronounce',
      '.js-slide-side' : 'speakLine',
    },
  };

  this.speakLine = function (e) {
    e.stopImmediatePropagation();
    e.preventDefault();
    speak(e.target.dataset.reading)
  }

  this.readPronounce = function (e) {
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
  }

  this.rotateSlide = function (e, mode) {
    e.stopPropagation();
    e.preventDefault();
    if (e.target.classList.contains('js-slide-inner')) {
      const el = e.target;
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
    }    
  }

  this.showCurrentIndex = function (index) {
    this.currentSlideIndexEl.innerHTML = index;
  }

  this.renderSlider =  () => {
    const container = this.element.querySelector('.js-slider');
    const slides = this.data.entries.map(e => 
      Application.protoElements.ProtoSlideElement.render(e)
    );
    slides.forEach(el => {
      container.appendChild(el);
    });
  }

  this.initSlider = () => {
    const showIndex = (index) => {
      this.showCurrentIndex(index)
    }
    const slider = new KeenSlider(
      "#my-keen-slider",
      {
        loop: true,
        created: (slider) => {
          showIndex(slider.track.details.rel)
        },
        slideChanged: (slider) => {
          showIndex(slider.track.details.rel)
        }
      },
    );
    this.slider = slider;
  };

  this.reset = function () {
    this.data = {};
    if (this.slider) {
      this.slider.destroy();
    }
    this.keensliderContainer.innerHTML = '';
  };

  this.render = async function () {
    this.reset();
    if (!Application.data.currentEntries?.length) {
      if (Application.views.PreloaderView.isShown()) {
        Application.views.PreloaderView.hide();
      }
      return
    }
    this.data.entries = Application.data.currentEntries
    this.renderSlider();
    this.initSlider();
    this.setRenderedEvents();
    Application.views.PreloaderView.hidePreloader();
  }

  this.show = async function () {
    View.prototype.show.call(this);
    this.currentSlideIndexEl = this.element.querySelector('#currentSlideIndex');
    this.keensliderContainer = this.element.querySelector('#my-keen-slider');
    this.speakEl = this.element.querySelector('#speak');
    this.render();
  }
};

Slider.prototype = Object.assign(Object.create(View.prototype), {
  containerSelector: '#appBody',
  templateSelector: '#sliderView',
  templatePath: 'modules/slider/slider.html',
});

Slider.prototype.constructor = Slider;
