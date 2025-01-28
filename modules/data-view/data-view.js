import { View } from "../view.js";
import { Application } from "../app.js";
import { DataTests } from "./data-tests.js";

export const DataView = function () {

  this.events = {
    'click #run' : 'executeFromEditor'
  },

  this.executeFromEditor = function () {
    const action = new Function('entries', this.editor.getValue());
    this.outputEl.innerHTML = action(this.getData());
  },

  this.buildTestsMenu = function () {
    this.testsEl.querySelector('select').innerHTML 
      = '<option value="">none</option>' 
        + Object.keys(DataTests.tests).map(test => 
          `<option value="${test}">${test}</option>`
        ).join('');
    this.testsEl.querySelector('select').addEventListener('change', (e) => {
      if (e.target.value !== '') {
        this.outputEl.innerHTML = DataTests.tests[e.target.value](this.getData());
      }
    })
  }
  
  this.getData = function () {
    return structuredClone(
      this.element.querySelector('#filtered').checked 
        && Application.getCurrentSourceData()?.currentEntries?.length ? 
          Application.getCurrentSourceData().currentEntries 
            : Application.getCurrentSourceData().allEntries
    );
  },

  this.reset = function () {
    this.data = {};
    this.outputEl.innerHTML = '';
    this.inputEl.innerHTMl = '';
  };

  this.render = function () {
    this.reset();
    if (Application.views.PreloaderView.isShown()) {
        Application.views.PreloaderView.hide();
      }
    if (!Application.getCurrentSourceData()?.allEntries?.length) {
      return
    }
    this.editor = ace.edit("input");
    this.editor.setTheme("ace/theme/github_dark");
    this.editor.session.setMode("ace/mode/javascript");
    this.editor.commands.addCommand({
      name: 'myCommand',
      bindKey: { win: 'Ctrl-Enter' },
      exec: function () {
        this.executeFromEditor()
      }.bind(this),
      readOnly: true,
    });
    this.editor.focus();
    this.editor.navigateFileEnd();
    this.buildTestsMenu();
  }

  this.show = function () {
    View.prototype.show.call(this);
    this.inputEl = this.element.querySelector('#input');
    this.outputEl = this.element.querySelector('#output');
    this.testsEl = this.element.querySelector('#tests');
    this.runEl = this.element.querySelector('#run');
    this.render();
  }
}

DataView.prototype = Object.assign(Object.create(View.prototype), {
  containerSelector: '#appBody',
  templatePath: 'modules/data-view/data-view.html',
  templateSelector: '#dataView',
});

DataView.prototype.constructor = DataView;
