import { View } from "../view.js";
import { speak, shuffleArraySaveOrder } from "../utils.js";
import { Application } from "../app.js";

export const Slider = function () {
  this.slider = null;
  this.slideViews = [];
  this.keensliderContainer = null;
  this.currentSlideIndexEl = null;
  this.events = {
    'change #cardMode' : 'setCardMode',
    'change #randomSlidesOrder' : 'setSlidesOrder'
  },
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
    Application.views.PreloaderView.showPreloaderAndRun(() => {
      this.state.mode = e.target.value;
    });
  }

  this.setSlidesOrder = function (e) {
    Application.views.PreloaderView.showPreloaderAndRun(() => {
      if (e.target.checked) {
        this.shuffleSlides();
      } else {
        this.data.shuffledEntries = null;
        delete this.state.order;
        this.render();
      }
    });
  }

  this.shuffleSlides = function () {
    const shuffled = shuffleArraySaveOrder(this.data.entries);
    this.data.shuffledEntries = shuffled.array;
    this.state.order = shuffled.order;
  }

  this.renderSlider = () => {
    const mode = this.state.mode ? this.state.mode : 'random';
    const container = this.element.querySelector('.js-slider');
    const entries = this.data.shuffledEntries || this.data.entries;
    const slides = entries.map((e, i) => 
      Application.protoElements.ProtoSlideElement.render(e, mode, i)
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

  this.reset = function (resetAll) {
    this.data = {};
    if (this.slider) {
      this.slider.destroy();
    }
    this.sliderOuter.innerHTML = this.keensliderContainerTemplate.outerHTML;
    if (resetAll) {
      delete this.state.order;
    }
  };

  this.handleStateChange = function (newState) {
    if ('mode' in newState) {
      console.log('Slider mode changed: re-render')
      this.render();
    } else if ('order' in newState) {
      console.log('Slides order set to random');
      this.render();
    }
  };

  this.render = async function (resetAll) {
    this.reset(resetAll);
    if (!Application.data.currentEntries?.length) {
      if (Application.views.PreloaderView.isShown()) {
        Application.views.PreloaderView.hide();
      }
      return
    }
    this.data.entries = structuredClone(Application.data.currentEntries);
    if (this.state.order) {
      this.data.shuffledEntries = this.state.order.map(i => this.data.entries[i]);
      this.isRandomEl.checked = true;
    }
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
    this.isRandomEl = this.element.querySelector('#randomSlidesOrder');
    this.cardModeEl = this.element.querySelector('#cardMode');
    this.render();
  }
};

Slider.prototype = Object.assign(Object.create(View.prototype), {
  containerSelector: '#appBody',
  templateSelector: '#sliderView',
  templatePath: 'modules/slider/slider.html',
});

Slider.prototype.constructor = Slider;
