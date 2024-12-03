import { View } from "../view.js";
import { Application } from "../app.js"
import { DataFactory } from "../data.js"

export const MenuView = function () {
  this.nightModeEl = null;
  this.sourcesSelect = null;

  this.events = {
    'click #menuTrigger': 'toggleMenu',
    'click #nightMode': 'toggleNightMode',
    'change #vocabSources': 'changeSource'
  };

  this.toggleNightMode = function () {
    document.body.classList.toggle('night');
    console.log(Application.state);
    Application.state.nightMode = document.body.classList.contains('night');
    console.log(localStorage.getItem('review-state'));
  }

  this.toggleMenu = function (e) {
    e && e.preventDefault();
    var menu = this.find('#menu');
    var trigger = e.target;
    if (menu.classList.contains("isOpened")) {
      menu.classList.remove("isOpened")
      trigger.innerText = ">>"
    } else {
      menu.classList.add("isOpened")
      trigger.innerText = "<<"
    }
  };

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
    const request = new XMLHttpRequest();
    request.open('GET', './vocab/' + e.target.value + '.txt', true);
    request.onload = function () {
      if (request.responseText) {
        Application.state.source = e.target.value;
        Application.rawData = request.responseText;
        Application.data.collection = DataFactory.parse(request.responseText);
      }
    }.bind(this);
    request.send();
  }

  this.show = function () {
    View.prototype.show.call(this);
    this.nightModeEl = document.getElementById('nightMode');
    this.sourcesSelect = this.element.querySelector('#vocabSources');
    this.renderSelectOptions();
    if (Application.state.source) {
      this.setSelectedOption(Application.state.source)
    }
    if (Application.state.nightMode) {
      document.body.classList.add('night');
    }
  }
};
MenuView.prototype = Object.assign(Object.create(View.prototype), {
  templateSelector : '#menuContainer',
  templatePath : 'modules/menu/menu.html',
})
MenuView.prototype.constructor = MenuView;