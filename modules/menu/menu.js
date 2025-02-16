import { View } from "../view.js";
import { Application } from "../app.js"
import { DataFactory } from "../data.js"
import { setSelectOption } from "../utils.js"

export const MenuView = function () {
  this.nightModeEl = null;
  this.sourcesSelect = null;
  this.viewSelect = null;

  this.events = {
    'click #menuTrigger': 'toggleMenu',
    'change #vocabSources': 'changeSource',
    'click #clearLocalStorage' : 'resetApp',
    'click #reloadCurrentSource' : 'reloadCurrentSource',
    'click #loadAllSources' : 'loadAllSources',
    'change #viewSelect' : 'switchView',
    'click #cancelSpeaking' : 'resetSpeech',
  };

  this.toggleMenu = function (e) {
    e && e.preventDefault();
    if (this.menu.classList.contains("isOpened")) {
      this.menu.classList.remove("isOpened")
      this.menuTrigger.innerText = ">>"
    } else {
      this.menu.classList.add("isOpened")
      this.menuTrigger.innerText = "<<"
    }
  };

  this.switchView = function (e) {
    Application.views.PreloaderView.showPreloaderAndRun(() => {
      Application.switchView(e.target.value);
    });
  },

  this.resetSpeech = function () {
    if(window.speechSynthesis.pending) {
      console.log('speech pending')
    } else if (window.speechSynthesis.speaking) {
      console.log('speech speaking')
    }
    window.speechSynthesis.cancel();
  };

  this.resetApp = function() {
    Application.reset();
    this.toggleMenu();
  }

  this.reloadCurrentSource = function() {
    Application.views.PreloaderView.showPreloaderAndRun(() => {
      Application.loadAndSetCurrentSource(Application.state.currentSource)
    });
  }
  
  this.loadAllSources = function() {
    Application.views.PreloaderView.showPreloaderAndRun(() => {
      Application.loadAllSources()
    });
  }

  this.renderSelectOptions = function () {
    const options = DataFactory.vocabFilesIndex.map(s => `
      <option ${Application.state.currentSource && Application.state.currentSource == s ? 'selected' : ''} value="${s}">${s}</option>`).join('');
    this.sourcesSelect.insertAdjacentHTML('beforeend', options);
  }

  this.changeSource = function (e) {
    if (!Application.views.PreloaderView.isShown()) {
      Application.views.PreloaderView.show();
    }
    setTimeout(() => {
      Application.changeSource(e.target.value);
    }, 0)
  }

  this.reset = function() {
    setSelectOption(this.sourcesSelect, '');
    setSelectOption(this.viewSelect, '');
  },

  this.render = function() {
    this.reset();
    if (Application.state.currentSource) {
      setSelectOption(this.sourcesSelect, Application.state.currentSource);
    }
    if(Application.state.appType) {
      const current = this.viewSelect.querySelector(`option[value=${Application.state.appType}]`);
      if (current) {
        current.setAttribute('selected', true);
      }
    } else {
      this.toggleMenu()
    }
    this.element.addEventListener('click', (e) => {
      if (e.target.id && e.target.id == 'menuContainer'
        && this.menu.classList.contains("isOpened")) {
        this.toggleMenu();
      }
    })
  }
  
  this.show = function () {
    View.prototype.show.call(this);
    this.sourcesSelect = this.element.querySelector('#vocabSources');
    this.menuTrigger = this.element.querySelector('#menuTrigger');
    this.viewSelect = this.element.querySelector('#viewSelect');
    this.menu = this.element.querySelector('#menu');
    this.renderSelectOptions();
    this.render();
  }
};

MenuView.prototype = Object.assign(Object.create(View.prototype), {
  containerSelector : '#appBody',
  templateSelector : '#menuContainer',
  templatePath : 'modules/menu/menu.html',
});

MenuView.prototype.constructor = MenuView;