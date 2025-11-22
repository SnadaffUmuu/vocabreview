import {View} from "../view.js";
import {Application} from "../app.js"
import {DataFactory} from "../data.js"
import {setSelectOption} from "../utils.js"
import {SessionsView} from "../sessions/sessions.js"
import {Prompt} from "../components/prompt/prompt.js"
import {BurgerButton} from "../components/burger-button/burger-button.js"
import {DropdownAction} from "../components/dropdown-action.js"

export const MenuView = function () {

  this.events = {
    'click #menuTrigger': 'toggleMenu',
    'change #vocabSources': 'changeSource',
    'change #globalActions': 'executeFunction',
    'click .switchView': 'switchView',
    'click #showCurrentSessions': 'showCurrentSessions',
    'click #reloadCurrentSource': 'reloadCurrentSource'
  }

  this.executeFunction = function (e) {
    if(e.target.value == '') return;
    this[e.target.value]();
  }

  this.executeFunction2 = function (e) {
    if(e.target.id == '') return;
    this[e.target.id]();
  }

  this.showCurrentSessions = async function (e) {
    Application.views.Dialog.show();
    Application.views.SessionsView = await View.create(SessionsView)
    Application.views.SessionsView.show();
  }

  this.toggleMenu = function (e) {
    e && e.preventDefault();
    if(this.menu.classList.contains("isOpened")) {
      this.menu.classList.remove("isOpened")
      this.menuTrigger.innerText = ">>"
    } else {
      this.menu.classList.add("isOpened")
      this.menuTrigger.innerText = "<<"
    }
  }

  this.switchView = function (e) {
    Application.views.PreloaderView.showPreloaderAndRun(() => {
      Application.switchView(e.target.dataset.appType);
      this.toggleViewHighlight(e.target, true);
      this.toggleMenu();
    });
  }

  this.resetSpeech = function () {
    if(window.speechSynthesis.pending) {
      console.log('speech pending')
    } else if(window.speechSynthesis.speaking) {
      console.log('speech speaking')
    }
    window.speechSynthesis.cancel();
  }

  this.resetApp = function () {
    new Prompt({
      text: 'Really reset the App?',
      onConfirm: () => {
        Application.reset();
        this.toggleMenu();
      }
    });

  }

  this.reloadCurrentSource = function () {
    new Prompt({
      text: 'Reload current source?',
      onConfirm: () => {
        Application.views.PreloaderView.showPreloaderAndRun(() => {
          Application.loadAndSetCurrentSource(Application.state.currentSource);
        });
      }
    });
  };

  this.loadAllSources = function () {
    new Prompt({
      text: 'Really load all sources?',
      onConfirm: () => {
        Application.views.PreloaderView.showPreloaderAndRun(() => {
          Application.loadAllSources()
        });
      }
    });
  }

  this.renderSelectOptions = function () {
    const options = DataFactory.vocabFilesIndex.map(s => `
      <option ${Application.state.currentSource && Application.state.currentSource == s ? 'selected' : ''} value="${s}">${s}</option>`).join('');
    this.sourcesSelect.insertAdjacentHTML('beforeend', options);
  }

  this.toggleViewHighlight = function (el, turnOn) {
    this.viewEls.forEach(button => {
      if(button.dataset.appType == el.dataset.appType && turnOn == true) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    })
  }

  this.changeSource = function (e) {
    if(!Application.views.PreloaderView.isShown()) {
      Application.views.PreloaderView.show();
    }
    setTimeout(() => {
      Application.changeSource(e.target.value);
    }, 0)
  }

  this.reset = function () {
    setSelectOption(this.sourcesSelect, '');
    this.viewEls.forEach(el => this.toggleViewHighlight(el, false));
  }

  this.render = function () {
    this.reset();
    if(Application.state.currentSource) {
      setSelectOption(this.sourcesSelect, Application.state.currentSource);
    }
    if(Application.state.appType) {
      const current = this.viewEls.find(el => el.dataset.appType == Application.state.appType);
      if(current) {
        current.classList.add('active');
      }
    } else {
      this.toggleMenu()
    }
    this.element.addEventListener('click', (e) => {
      if(e.target.id && e.target.id == 'menuContainer'
        && this.menu.classList.contains("isOpened")) {
        this.toggleMenu();
      }
    })
  }

  this.show = function () {
    View.prototype.show.call(this);
    this.sourcesSelect = this.element.querySelector('#vocabSources');
    this.menuTrigger = this.element.querySelector('#menuTrigger');
    // this.viewSelect = this.element.querySelector('#viewSelect');
    this.viewEls = [...this.element.querySelectorAll('.switchView')];
    this.menu = this.element.querySelector('#menu');
    this.actionsRow = this.element.querySelector("#sourcesRow");

    this.globalActions = new DropdownAction({
      trigger: new BurgerButton({
        cssClasses : ['v2']
      }),
      items: {
        loadAllSources: 'Load all',
        resetSpeech: 'reset speech',
        resetApp: 'reset App'
      },
      onSelect: (methodName) => this[methodName](),
      appendTo: this.actionsRow
    });

    this.renderSelectOptions();

    this.render();
  }
}

MenuView.prototype = Object.assign(Object.create(View.prototype), {
  containerSelector: '#appBody',
  templateSelector: '#menuContainer',
  templatePath: 'modules/menu/menu.html',
})

MenuView.prototype.constructor = MenuView;