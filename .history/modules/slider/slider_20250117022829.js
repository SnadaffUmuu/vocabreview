import { View } from "../view.js";
import { speak } from "../utils.js";
import { Application } from "../app.js";

export const Slider = function () {
  this.slider = null;
  this.slideViews = [];
  this.keensliderContainer = null;
  this.currentSlideIndexEl = null;
  this.renderedEvents = {
    click : {
      '.slide-inner' : 'rotateSlide',
      '.slideReading' : 'read',
      '.js-slide-side' : 'speakLine',
    },
  };

  this.speakLine = function (e) {
    e.stopImmediatePropagation();
    e.preventDefault();
    speak(e.target.dataset.reading)
  }

  this.read = function (e) {
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
    console.log('rotate slide', e.target);
    e.stopPropagation();
    e.preventDefault();
    if (e.target.classList.contains('js-slide-inner')) {
      const el = e.target;
      const slide = el.classList.contains('slide-inner') ? el : el.closest('.slide-inner');
      const currentSideIndexDisplayEl = slide.closest('.js-slide').querySelector('#current-side');
      if (slide.querySelectorAll('.js-slide-side').length == 1) { 
        console.log('non-rotatiable, only 1 side');
        currentSideIndexDisplayEl.innerHTML = slide.querySelector('.js-slide-side').dataset.index;
        return;
      }
      const current = slide.querySelector('.current');
      let newCurrent = null;
      if (current && current.nextElementSibling) {
        newCurrent = current.nextElementSibling
      } else {
        newCurrent = slide.querySelector('.js-slide-side')
      }
      newCurrent.classList.add('current');
      if (current && current.classList) {
        current.classList.remove('current');
      }
      currentSideIndexDisplayEl.innerHTML = newCurrent.dataset.index;
    }    
  }

  this.showCurrentIndex = function (index) {
    this.currentSlideIndexEl.innerHTML = index;
  }
  
  this.setCardMode = function (e) {
    this.state.mode = e.target.value;
  }

  this.renderSlider = () => {
    const mode = this.state.mode ? this.state.mode : 'random';
    const container = this.element.querySelector('.js-slider');
    const slides = this.data.entries.map(e => 
      Application.protoElements.ProtoSlideElement.render(e, mode)
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
    this.sliderOuter.innerHTML = this.keensliderContainerTemplate.outerHTML;
  };

  this.render = async function () {
    this.reset();
    if (!Application.data.currentEntries?.length) {
      if (Application.views.PreloaderView.isShown()) {
        Application.views.PreloaderView.hide();
      }
      return
    }
    this.data.entries = Application.data.currentEntries;
    if (this.state.mode) {
      Array.from(this.cardModeEl.querySelectorAll('option')).forEach(op => {
        op.selected = op.value == this.state.mode;
      })
    }
    this.renderSlider();
    this.initSlider();
    this.setRenderedEvents(this.sliderOuter.querySelector('.js-slider'));
    Application.views.PreloaderView.hidePreloader();
  }

  this.show = async function () {
    View.prototype.show.call(this);
    this.currentSlideIndexEl = this.element.querySelector('#currentSlideIndex');
    this.sliderOuter = this.element.querySelector('#js-slider-outer');
    this.keensliderContainerTemplate = this.sliderOuter.removeChild(this.element.querySelector('#my-keen-slider'));
    this.speakEl = this.element.querySelector('#speak');
    this.cardModeEl = this.element.querySelector('#cardMode');
    this.cardModeEl.addEventListener('change', (e) => {
      this.setCardMode(e)
    });
    this.render();
  }
};

Slider.prototype = Object.assign(Object.create(View.prototype), {
  containerSelector: '#appBody',
  templateSelector: '#sliderView',
  templatePath: 'modules/slider/slider.html',
});

Slider.prototype.constructor = Slider;
