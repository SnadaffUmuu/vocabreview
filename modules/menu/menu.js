import { View } from "../view.js";
import { Application } from "../app.js"
import { DataFactory } from "../data.js"

export const MenuView = function () {
  this.nightModeEl = null;
  this.sourcesSelect = null;

  this.events = {
    'click #menuTrigger': 'toggleMenu',
    'change #vocabSources': 'changeSource',
    'click #clearLocalStorage' : 'clearData',
    'click #reloadCurrentSource' : 'reloadCurrentSource',
  };


  this.toggleMenu = function (e) {
    e && e.preventDefault();
    var menu = this.find('#menu');
    if (menu.classList.contains("isOpened")) {
      menu.classList.remove("isOpened")
      this.menuTrigger.innerText = ">>"
    } else {
      menu.classList.add("isOpened")
      this.menuTrigger.innerText = "<<"
    }
  };

  this.clearData = function() {
    delete Application.state.source;
  }

  this.reloadCurrentSource = function() {
    Application.changeSource(Application.state.source)
  }

  this.renderSelectOptions = function () {
    const options = DataFactory.vocabFilesIndex.map(s => `
      <option ${Application.state.source && Application.state.source == s ? 'selected' : ''} value="${s}">${s}</option>`).join('');
    this.sourcesSelect.insertAdjacentHTML('beforeend', options);
  }

  this.setSelectedOption = (value) => {
    const options = Array.from(this.sourcesSelect.querySelectorAll('options'));
    const matched = options.find(o => o.value == value);
    if (matched) {
      options.forEach(o => o.removeAttribute('selected'));
      matched.setAttribute('selected', true);
    }
  }

  this.changeSource = function (e) {
    if (e.target.value == '') return;
    Application.changeSource(e.target.value);
  }

  this.show = function () {
    View.prototype.show.call(this);
    this.sourcesSelect = this.element.querySelector('#vocabSources');
    this.menuTrigger = this.element.querySelector('#menuTrigger')
    this.renderSelectOptions();
    if (Application.state.source) {
      this.setSelectedOption(Application.state.source)
    }
  }
};
MenuView.prototype = Object.assign(Object.create(View.prototype), {
  templateSelector : '#menuContainer',
  templatePath : 'modules/menu/menu.html',
})
MenuView.prototype.constructor = MenuView;