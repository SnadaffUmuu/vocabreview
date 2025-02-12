import { View } from "../view.js";
import { Application } from "../app.js";
import { DataTests } from "./data-tests.js";

export const DataView = function () {

  this.events = {
    'click #run': 'executeFromEditor',
    'keyup #search': 'doSearch',
    'change #filtered': 'trigerDataTest',
  }

  this.getBreadcrumbs = function(entry, source) {
    const theStructure = Application.data[source].structure;
    let structureNode = theStructure.find(o => o.id == entry.section);
    if (structureNode) {
      return structureNode.name
    } else {
      let res = '';
      for (let node of theStructure) {
        const childNode = node.children?.find(n => n.id == entry.section);
        if (childNode) {
          res = theStructure.find(n => n.id == childNode.parentId).name + ' / ' + childNode.name;
          break
        }
        //生身
      }
      return res;
    }
  }

  this.doSearch = function (e) {
    if (e.keyCode === 13) {
      this.outputEl.innerHTML = '';
      if (e.target.value == '') {
        this.trigerDataTest()
      } else {
        e.preventDefault();
        let res = [];
        for (let source in Application.data) {
          const matchingEntries = Application.data[source]?.allEntries?.filter(en =>
            en.lines.some(l => l.text.indexOf(e.target.value) != -1));
          matchingEntries.forEach(entry => {
            entry.source = source;
            entry.breadcrumbs = this.getBreadcrumbs(entry, source);
          });
  
          if (matchingEntries.length) {
            res = [...res, ...matchingEntries]
          }
        }
        res.forEach(entry => {
          this.outputEl.insertAdjacentHTML(
            'beforeend',
            DataTests.entryFormatters.getEntryShortInfoString2(entry, e.target.value))
        })
      }
    }
  }

  this.trigerDataTest = function () {
    this.testsSelect.dispatchEvent(new Event('change'));
  }

  this.executeFromEditor = function () {
    const action = new Function('entries', this.editor.getValue());
    this.outputEl.innerHTML = action(this.getData());
  }

  this.buildTestsMenu = function () {
    this.testsSelect.innerHTML
      = '<option value="">none</option>'
      + Object.keys(DataTests.tests).map(test =>
        `<option value="${test}">${test}</option>`
      ).join('');
    this.testsSelect.addEventListener('change', (e) => {
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
  }

  this.reset = function () {
    this.data = {};
    this.outputEl.innerHTML = '';
    //this.inputEl.innerHTMl = '';
  }

  this.render = function () {
    this.reset();
    if (Application.views.PreloaderView.isShown()) {
      Application.views.PreloaderView.hide();
    }
    if (!Application.getCurrentSourceData()?.allEntries?.length) {
      return
    }
    /*
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
    */
    this.buildTestsMenu();
    this.testsSelect.value = 'all';
    this.trigerDataTest();
  }

  this.show = function () {
    View.prototype.show.call(this);
    //this.inputEl = this.element.querySelector('#input');
    this.outputEl = this.element.querySelector('#output');
    this.testsSelect = this.element.querySelector('#theTests');
    //this.runEl = this.element.querySelector('#run');
    this.render();
  }
}

DataView.prototype = Object.assign(Object.create(View.prototype), {
  containerSelector: '#appBody',
  templatePath: 'modules/data-view/data-view.html',
  templateSelector: '#dataView',
});

DataView.prototype.constructor = DataView;
