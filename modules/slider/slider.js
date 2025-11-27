import { View } from "../view.js";
import { speak, shuffleArraySaveOrder } from "../utils.js";
import { Application } from "../app.js";
import {Prompt} from "../components/prompt/prompt.js"

export const Slider = function () {
  this.slider = null;
  this.slideViews = [];
  this.keensliderContainer = null;
  this.currentSlideIndexEl = null;
  this.events = {
    'change #cardMode' : 'setCardMode',
    'change #randomSlidesOrder' : 'setSlidesOrder',
    'click #resetSlider' : 'resetSlider',
    'click #batsu' : 'toggleLapse',
  },
  
  this.renderedEvents = {
    click : {
      '.slide-inner' : 'rotateSlide',
      '.slideReading' : 'read',
      '.js-slide-side' : 'speakLine',
    },
  };

  this.resetSlider = function () {
    new Prompt({
      text: 'Really reset the App?',
      onConfirm: () => {
        this.render(true);
      }
    });
  }

  this.speakLine = function (e) {
    e.stopImmediatePropagation();
    e.preventDefault();
    speak(e.target.dataset.reading);
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
    e.stopPropagation();
    e.preventDefault();
    if (e.target.classList.contains('js-slide-inner')) {
      const el = e.target;
      const slide = el.classList.contains('slide-inner') ? el : el.closest('.slide-inner');
      const slideOuter = e.target.closest('.js-slide');
      const currentSideIndexDisplayEl = slideOuter.querySelector('.current-side');
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
      this.setCurrentSideIndex(slideOuter.dataset.originalIndex, newCurrent.dataset.index);
      this.updateBatsu()
    }    
  }

  this.toggleLapse = function(e) {
    const turnOn = !e.target.classList.contains('active');
    const slide = this.slider.slides[this.slider.track.details.rel];
    const index = parseInt(slide.dataset.originalIndex);
    const lapsedSide = parseInt(slide.querySelector('.current').dataset.index);
    if (turnOn) {
      if(this.state.lapses[index]) {
        if(!this.state.lapses[index].includes(lapsedSide)) {
          this.state.lapses[index].push(lapsedSide);
        }
      } else {
        this.state.lapses[index] = [lapsedSide];
      }
    } else {
      this.state.lapses[index] = this.state.lapses[index].filter(it => it != lapsedSide)
    }
    this.state.selfUpdate = !this.state.selfUpdate;
    e.target.classList.toggle('active');
  }

  this.setCurrentSideIndex = function (slideIndex, sideIndex) {
    if (this.state.sideIndexes[slideIndex]) {
      this.state.sideIndexes[slideIndex] = sideIndex;
      this.state.sideIndexes = this.state.sideIndexes;
    } else {
      this.state.sideIndexes = Object.assign({[slideIndex] : sideIndex}, this.state.sideIndexes)
    }
  }

  this.showCurrentIndex = function (index) {
    this.currentSlideIndexEl.innerHTML = index;
  }
  
  this.setCardMode = function (e) {
    Application.views.PreloaderView.showPreloaderAndRun(() => {
      this.state.mode = e.target.value;
      this.state.sideIndexes && delete this.state.sideIndexes;
      this.render();
    });
  }

  this.setSlidesOrder = function (e) {
    Application.views.PreloaderView.showPreloaderAndRun(() => {
      if (e.target.checked) {
        this.shuffleSlides();
      } else {
        this.data.shuffledEntries = null;
        this.state.order && delete this.state.order;
        this.state.currentIndex && delete this.state.currentIndex;
        this.render();
      }
    });
  }

  this.shuffleSlides = function () {
    const shuffled = shuffleArraySaveOrder(this.data.entries);
    this.data.shuffledEntries = shuffled.array;
    this.state.currentIndex && delete this.state.currentIndex;
    this.state.order = shuffled.order;
    this.render();
  }

  this.renderSlider = () => {
    const mode = this.state.mode ? this.state.mode : 'original';
    const container = this.element.querySelector('.js-slider');
    const entries = this.data.shuffledEntries || this.data.entries;
    const slides = entries.map((e, i) => {
        let currSideIndex = this.state.sideIndexes?.[e.originalIndex] ?? null;
        return Application.protoElements.ProtoSlideElement.render(e, mode, currSideIndex);
      }
    );
    slides.forEach(el => {
      container.appendChild(el);
    });
  }

  this.initSlider = () => {
    const showIndex = (index) => {
      this.showCurrentIndex(index)
    }
    const instance = this;
    const slider = new KeenSlider(
      "#my-keen-slider",
      {
        loop: true,
        created: (slider) => {
          showIndex(slider.track.details.rel);
        },
        slideChanged: (slider) => {
          showIndex(slider.track.details.rel);
          instance.state.currentIndex = slider.track.details.rel;
          this.updateBatsu()
        }
      },
    );
    this.slider = slider;
    if (this.state.currentIndex) {
      this.showCurrentIndex(this.state.currentIndex);
      this.slider.moveToIdx(this.state.currentIndex, false);
    }
    this.updateBatsu()
  };

  this.handleStateChange = function (newState, prop, value) {
    if (prop == 'mode') {
      this.state.sideIndexes = {};
      this.updateModeElement(this.cardModeEl)
    } 
  };

  this.updateBatsu = function() {
    const slide = this.slider.slides[this.slider.track.details.rel];
    const index = parseInt(slide.dataset.originalIndex);
    const currentSideIndex = parseInt(slide.querySelector('.current').dataset.index);
    const lapsedSidesInState = this.state.lapses[index];
    if (!lapsedSidesInState) {
      this.batsu.classList.remove('active');
      return;
    }
    if (lapsedSidesInState.includes(currentSideIndex)) {
      this.batsu.classList.add('active')
    }
  }

  this.handleFilter = function() {
    this.state.order && delete this.state.order;
    this.state.currentIndex && delete this.state.currentIndex;
    this.isRandomEl.checked = false;
    this.state.sideIndexes && delete this.state.sideIndexes;
  };

  this.reset = function (resetAll) {
    this.data = {};
    if(resetAll) {
      this.state.order = [];
      this.state.sideIndexes = {};
      this.state.currentIndex = 0;
      this.state.lapses = {};
      this.state.removed = [];
      this.state.mode = 'original';
      this.isRandomEl.checked = false;
    }
    if (this.slider) {
      this.slider.destroy();
    }
    //this.sliderOuter.innerHTML = this.keensliderContainerTemplate;
    //this.sliderOuter.innerHTML = this.keensliderContainerTemplate.outerHTML;
    document.getElementById('my-keen-slider')?.remove();
    this.sliderOuter.insertAdjacentElement('beforeend', this.keensliderContainerTemplate)
    // this.sliderOuter.innerHTML = `
    //   <div class="batsu"></div>
    //   <div id="my-keen-slider" class="keen-slider js-slider"></div>
    // `
    this.batsu.classList.remove('active');
  };  

  this.render = async function (resetAll) {
    this.reset(resetAll);
    this.initState();
    if (!Application.getCurrentSourceData()?.currentEntries?.length) {
      if (Application.views.PreloaderView.isShown()) {
        Application.views.PreloaderView.hide();
      }
      return
    }
    this.data.entries = structuredClone(Application.getCurrentSourceData().currentEntries);
    if (this.state.order?.length) {
      this.data.shuffledEntries = this.state.order.map(i => this.data.entries[i]);
      this.isRandomEl.checked = true;
    }
    if (this.state.mode) {
      Array.from(this.cardModeEl.querySelectorAll('option')).forEach(op => {
        op.selected = op.value == this.state.mode;
      })
    }
    if (this.state.sideIndexes == null) this.state.sideIndexes = [];
    if (this.state.lapses == null) this.state.lapses = {};
    if (this.state.sideIndexes == null) this.state.sideIndexes = {};
    if (this.state.removed == null) this.state.removed = [];

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
    this.batsu = this.element.querySelector("#batsu")
    // this.keensliderContainerTemplate = `
    // <div id="js-slider-outer">
    //   <div class="batsu"></div>
    // </div>`;
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
