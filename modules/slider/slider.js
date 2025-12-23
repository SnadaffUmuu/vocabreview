import {View} from "../view.js";
import {speak, shuffleArraySaveOrder} from "../utils.js";
import {Application} from "../app.js";
import {Prompt} from "../components/prompt/prompt.js"
import {DataFactory} from "../data.js"

export const Slider = function () {
  this.slider = null;
  this.slideViews = [];
  this.keensliderContainer = null;
  this.currentSlideIndexEl = null;
  this.events = {
    'change #cardMode': 'setCardMode',
    'change #randomSlidesOrder': 'setSlidesOrder',
    'click #resetSlider': 'resetSlider',
    'click #batsu': 'toggleLapse',
    'click #maru': 'toggleHit',
    'click #removeSlide': 'removeSlide',
    'change #onlyMatchingMode' : 'toggleFilterByMode',
  },

  this.modeMatchingFilteringCompatiableModes = [
    DataFactory.LINE_ROLE.meaning, 
    DataFactory.LINE_ROLE.example, 
    DataFactory.LINE_ROLE.example_translation
  ]

  this.renderedEvents = {
    click: {
      '.slide-inner': 'rotateSlide',
      '.slideReading': 'read',
      '.js-slide-side': 'speakLine',
    },
  };

  this.resetSlider = function () {
    new Prompt({
      text: 'Really reset the Slider?',
      onConfirm: () => {
        this.render(true);
      }
    });
  }

  this.removeSlide = function () {
    new Prompt({
      text: 'Remove the slide?',
      onConfirm: () => {
        if(this.slider.slides.length == 1) {
          console.log('Cannot remove the only slide!');
          return;
        }
        const slide = this.slider.track.details ? this.slider.slides[this.slider.track.details.rel] : this.slider.slides[0];
        const index = parseInt(slide.dataset.originalIndex);
        this.state.removed.push(index);
        this.state.removed = this.state.removed;
        this.data.entries = this.data.entries.filter(en => en.originalIndex !== index)
        if(this.state.order && this.state.order.includes(index)) {
          this.state.order = this.state.order.filter(it => it !== index)
        }
        if(this.state.lapses && this.state.lapses[index]) {
          delete this.state.lapses[index]
        }
        if(this.state.hits && this.state.hits[index]) {
          delete this.state.hits[index]
        }
        if(this.state.currentIndex >= this.slider.slides.length - 1) {
          this.state.currentIndex = 0
        }
        this.data.shuffledEntries = null;
        this.render()
      }
    });
  }

  this.toggleFilterByMode = function () {
    this.state.isOnlyMatchingMode = this.isOnlyMatchingModeEl.checked;
    if (this.modeMatchingFilteringCompatiableModes.includes(this.state.mode)) {
      this.render()
    }
  }

  this.filterByMode = function(entries) {
    if (!this.state.mode
      || !this.modeMatchingFilteringCompatiableModes.includes(this.state.mode)
    ) return entries;
    return entries.filter(en => en.lines.some(l => l.role == DataFactory.LINE_ROLE[this.state.mode]))
  }

  this.speakLine = function (e) {
    e.stopImmediatePropagation();
    e.preventDefault();
    speak(e.target.dataset.reading);
  }

  this.read = function (e) {
    const t = e.target;
    if(!t.classList.contains('listened') && !t.classList.contains('revealed')) {
      t.classList.add('listened');
      speak(t.innerText);
    } else if(t.classList.contains('listened') && !t.classList.contains('revealed')) {
      t.classList.add('revealed');
      t.classList.remove('listened');
    } else if(t.classList.contains('revealed') && !t.classList.contains('listened')) {
      t.classList.remove('revealed');
    }
  }

  this.rotateSlide = function (e, mode) {
    e.stopPropagation();
    e.preventDefault();
    if(e.target.classList.contains('js-slide-inner')) {
      const el = e.target;
      const slide = el.classList.contains('slide-inner') ? el : el.closest('.slide-inner');
      const slideOuter = e.target.closest('.js-slide');
      const currentSideIndexDisplayEl = slideOuter.querySelector('.current-side');
      if(slide.querySelectorAll('.js-slide-side').length == 1) {
        console.log('non-rotatiable, only 1 side');
        currentSideIndexDisplayEl.innerHTML = slide.querySelector('.js-slide-side').dataset.index;
        return;
      }
      const current = slide.querySelector('.current');
      let newCurrent = null;
      if(current && current.nextElementSibling) {
        newCurrent = current.nextElementSibling
      } else {
        newCurrent = slide.querySelector('.js-slide-side')
      }
      newCurrent.classList.add('current');
      if(current && current.classList) {
        current.classList.remove('current');
      }
      currentSideIndexDisplayEl.innerHTML = newCurrent.dataset.index;
      this.setCurrentSideIndex(slideOuter.dataset.originalIndex, newCurrent.dataset.index);
      this.updateSideLearnMarks()
    }
  }

  this.toggleSideLearnMark = function(el, stateObj) {
    const turnOn = !el.classList.contains('active');
    const slide = this.slider.track.details ? this.slider.slides[this.slider.track.details.rel] : this.slider.slides[0];
    const index = parseInt(slide.dataset.originalIndex);
    const currentSide = parseInt(slide.querySelector('.current').dataset.index);
    if(turnOn) {
      if(stateObj[index]) {
        if(!stateObj[index].includes(currentSide)) {
          stateObj[index].push(currentSide);
        }
      } else {
        stateObj[index] = [currentSide];
      }
    } else {
      stateObj[index] = stateObj[index].filter(it => it != currentSide)
      if(!stateObj[index].length) {
        delete stateObj[index]
      }
    }
    this.state.selfUpdate = !this.state.selfUpdate;
    el.classList.toggle('active');
    return turnOn
  }

  this.toggleLapse = function (e, skipToggleOther) {
    const turnOn = this.toggleSideLearnMark(this.batsu, this.state.lapses)
    if (skipToggleOther !== true && turnOn && this.maru.classList.contains('active')) {
      this.toggleHit(null, true)
    }
  }

  this.toggleHit = function (e, skipToggleOther) {
    const turnOn = this.toggleSideLearnMark(this.maru, this.state.hits)
    if (skipToggleOther !== true && turnOn && this.batsu.classList.contains('active')) {
      this.toggleLapse(e, true)
    }
  }

  this.setCurrentSideIndex = function (slideIndex, sideIndex) {
    if(this.state.sideIndexes[slideIndex]) {
      this.state.sideIndexes[slideIndex] = sideIndex;
      this.state.sideIndexes = this.state.sideIndexes;
    } else {
      this.state.sideIndexes = Object.assign({[slideIndex]: sideIndex}, this.state.sideIndexes)
    }
  }

  this.showCurrentIndex = function (index) {
    this.currentSlideIndexEl.innerHTML = index;
  }

  this.setCurrentDataCount = function () {
    this.currentDataCountEl.innerHTML = this.slider.slides.length
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
      if(e.target.checked) {
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
    });
    slides.forEach(el => {
      container.appendChild(el);
    });
  }

  this.initSlider = () => {
    const showIndex = (index) => {
      this.showCurrentIndex(index)
    }
    const updateLearnMarks = () => {
      this.updateSideLearnMarks()
    }
    const setSlider = (slider) => {
      this.slider = slider
    }
    const moveToIdx = (slider) => {
      if(this.state.currentIndex !== null && this.state.currentIndex !== undefined) {
        this.showCurrentIndex(this.state.currentIndex);
        slider.moveToIdx(this.state.currentIndex, false);
      }
    }
    const setCurrentTotal = () => {
      this.setCurrentDataCount()
    }
    const instance = this;
    const slider = new KeenSlider(
      "#my-keen-slider",
      {
        loop: true,
        created: (slider) => {
          setSlider(slider)
          setCurrentTotal()
          showIndex(slider.track.details ? slider.track.details.rel : 0);
          updateLearnMarks()
          moveToIdx(slider)
        },
        slideChanged: (slider) => {
          const rel = slider.track.details ? slider.track.details.rel : 0;
          showIndex(rel);
          instance.state.currentIndex = rel;
          updateLearnMarks()
          console.log('slide changed')
        }
      },
    );
    //this.slider = slider;
    // if(this.state.currentIndex !== null && this.state.currentIndex !== undefined) {
    //   this.showCurrentIndex(this.state.currentIndex);
    //   this.slider.moveToIdx(this.state.currentIndex, false);
    // }
  };

  this.handleStateChange = function (newState, prop, value) {
    if(prop == 'mode') {
      this.state.sideIndexes = {};
      this.updateModeElement(this.cardModeEl)
    }
  };

  this.updateSideLearnMarks = function () {
    this.updateSideLearnMark (this.state.lapses, this.batsu)
    this.updateSideLearnMark (this.state.hits, this.maru)
  }

  this.updateSideLearnMark = function (stateObj, el) {
    const slide = this.slider.track.details ? this.slider.slides[this.slider.track.details.rel] : this.slider.slides[0];
    const index = parseInt(slide.dataset.originalIndex);
    const currentSideIndex = parseInt(slide.querySelector('.current').dataset.index);
    const sidesInState = stateObj[index];
    if(!sidesInState || !sidesInState.length || !sidesInState.includes(currentSideIndex)) {
      el.classList.remove('active');
    } else {
      el.classList.add('active')
    }
  }

  this.handleFilter = function () {
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
      this.state.hits = {};
      this.state.removed = [];
      this.state.mode = 'original';
      this.isOnlyMatchingMode = false;
      this.isRandomEl.checked = false;
      this.isOnlyMatchingModeEl.checked = false;
    }
    if(this.slider) {
      this.slider.destroy();
    }
    document.getElementById('my-keen-slider')?.remove();
    this.sliderOuter.insertAdjacentHTML('beforeend', this.keensliderContainerTemplate)
    this.batsu.classList.remove('active');
    Application.views.StructureView.render();
  };

  this.render = async function (resetAll) {
    this.reset(resetAll);
    this.initState();
    if(!Application.getCurrentSourceData()?.currentEntries?.length) {
      if(Application.views.PreloaderView.isShown()) {
        Application.views.PreloaderView.hide();
      }
      return
    }
    this.data.entries = structuredClone(Application.getCurrentSourceData().currentEntries).filter(en => this.state.removed ?
      !this.state.removed.includes(en.originalIndex) : true);
    if(this.state.order?.length) {
      const map = Object.fromEntries(
        this.data.entries.map(e => [e.originalIndex, e])
      );
      this.data.shuffledEntries = this.state.order.map(id => map[id]);
      this.isRandomEl.checked = true;
    }
    if(this.state.mode) {
      Array.from(this.cardModeEl.querySelectorAll('option')).forEach(op => {
        op.selected = op.value == this.state.mode;
      })
      if (this.state.isOnlyMatchingMode) {
        this.isOnlyMatchingModeEl.checked = true;
        const data = this.data.shuffledEntries || this.data.entries;
        const filteredData = this.filterByMode(data)
        if (this.data.shuffledEntries) {
          this.data.shuffledEntries = filteredData
        } else {
          this.data.entries = filteredData
        }
      }
    }
    if(this.state.sideIndexes == null) this.state.sideIndexes = [];
    if(this.state.lapses == null) this.state.lapses = {};
    if(this.state.hits == null) this.state.hits = {};
    if(this.state.sideIndexes == null) this.state.sideIndexes = {};
    if(this.state.removed == null) this.state.removed = [];
    if(this.state.isOnlyMatchingMode == null) this.state.isOnlyMatchingMode = false;

    this.renderSlider();
    this.initSlider();
    this.setRenderedEvents(this.sliderOuter.querySelector('.js-slider'));
    Application.views.PreloaderView.hidePreloader();
  }

  this.show = async function () {
    View.prototype.show.call(this);
    this.currentSlideIndexEl = this.element.querySelector('#currentSlideIndex');
    this.currentDataCountEl = this.element.querySelector('#currentDataCount');
    this.sliderOuter = this.element.querySelector('#js-slider-outer');
    this.batsu = this.element.querySelector("#batsu");
    this.maru = this.element.querySelector("#maru");
    this.keensliderContainerTemplate = `<div id="my-keen-slider" class="keen-slider js-slider"></div>`;
    this.speakEl = this.element.querySelector('#speak');
    this.isRandomEl = this.element.querySelector('#randomSlidesOrder');
    this.isOnlyMatchingModeEl = this.element.querySelector("#onlyMatchingMode");
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
