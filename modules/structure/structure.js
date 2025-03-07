
import { View } from "../view.js";
import { Application } from "../app.js"

export const StructureView = function () {
  this.toggleEl = null;
  this.treeEl = null;
  this.resetTreeEl = null;
  this.events = {
    'click #toggleAll': 'toggleAll',
    'click #filterCollection': 'filterCollection',
    'click #flushGlobal' : 'flushGlobal',
  };

  this.flushGlobal = function() {
    Application.flushGlobal();
  };

  this.trueCheckboxesSelector = '.treeCheckbox';

  this.toggleTreeCheckboxes = function (e) {
    let check = e.target;
    const children = Array.from(check.parentNode.querySelectorAll(this.trueCheckboxesSelector))
    children.forEach(child => child.checked = check.checked);
    while (check) {
      const parent = (check.closest(['ul']).parentNode).querySelector(this.trueCheckboxesSelector);
      const childList = parent.closest('li').querySelector(['ul']);
      if (childList) {
        const siblings = Array.from(childList.querySelectorAll(this.trueCheckboxesSelector));
        const checkStatus = siblings.map(check => check.checked);
        const every = checkStatus.every(Boolean);
        const some = checkStatus.some(Boolean);
        parent.checked = every;
        parent.indeterminate = !every && every !== some;
      }
      check = check != parent ? parent : 0;
    }
  };

  this.checkFilteredCheckboxes = function (els) {
    els.forEach(checkbox => {
      if (checkbox.matches('ul ul input') && checkbox.checked) {
        const parent = checkbox.closest('ul').closest('li').querySelector('input' + this.trueCheckboxesSelector);
        const siblings = checkbox.closest('ul').querySelectorAll('input' + this.trueCheckboxesSelector);
        const checkStatus = Array.from(siblings).map(check => check.checked);
        const every = checkStatus.every(Boolean);
        const some = checkStatus.some(Boolean);
        parent.checked = every;
        parent.indeterminate = !every && every !== some;
      }
    });
    Array.from(this.element.querySelectorAll('#structureTree > ul > li > .treeCheckbox')).forEach(el => {
      if (el.indeterminate || el.checked) {
        el.closest('li').querySelector('.collapsibleListCheckbox').setAttribute('checked', true)
      }
    })
  }

  this.toggleAll = function (e) {
    Array.from(
      this.treeEl.querySelectorAll('.treeCheckbox[type=checkbox]')
    ).forEach(ch => ch.checked = e.target.checked)
  }

  this.filterCollection = function () {
    Application.views.PreloaderView.showPreloaderAndRun(() => {
      const checkedSections = Array.from(
        this.treeEl.querySelectorAll('.treeCheckbox[type=checkbox]:checked')
      ).map(ch => parseInt(ch.value))
      Application.filter(checkedSections);
    });
  }

  this.getInProgressMarks = function(sectionEntries) {
    let ids = sectionEntries.map(entry => entry.originalIndex)
    let letters = new Set();
    const stateViews = Application.state.views[Application.state.currentSource];
    for (let stateViewName in stateViews) {
      const viewParams = stateViews[stateViewName];
      for (let viewParam in viewParams) {
        if(['removedItems','itemsInBoxes','itemsInCols','lapses'].includes(viewParam)
          && Object.keys(viewParams[viewParam]).some(k => ids.includes(parseInt(k)))) {
            letters.add(stateViewName.slice(0,1));
        }
      }
    }
    return letters.size ? `<span class="inProgress">${Array.from(letters).join('&nbsp;')}</span>` : '';
  }

  this.getCheckboxHtml = function (value) {
    const isChecked = !this.nonChecked && this.data.filteredEntries.filter(e => e.section == value).length;
    const sectionEntries = Application.getCurrentSourceData().allEntries.filter(e => e.section == value);
    return `${this.getInProgressMarks(sectionEntries)}<input class="treeCheckbox" ${isChecked ? 'checked' : ''} type="checkbox" value="${value}">`
  }

  this.getListNameHtml = function (name, value) {
    return `
    <input class="collapsibleListCheckbox" id="${value}" type="checkbox">
    <label for="${value}">${name}</label>
    `
  }

  this.reset = function () {
    if (this.treeEl) {
      this.treeEl.querySelector('ul').innerHTML = '';
      this.data = {};
    }
  }

  this.render = function () {

    this.reset();
    if (!Application.getCurrentSourceData()?.currentEntries?.length) {
      return;
    }
    this.data.filteredEntries = structuredClone(Application.getCurrentSourceData().currentEntries);
    this.nonChecked = this.data.filteredEntries.length 
      == Application.getCurrentSourceData().allEntries.length;
    const resItems = Application.getCurrentSourceData().structure.reduce((resItems, entry) => {
      const children = entry.children ? entry.children.map(ch => `<li data-tree-id="${ch.id}">${this.getCheckboxHtml(ch.id)}&nbsp;${ch.name}</li>`) : [];
      resItems.push(`<li data-tree-id="${entry.id}">
        ${this.getCheckboxHtml(entry.id)}&nbsp;
        ${this.getListNameHtml(entry.name, entry.id)}
        ${children.length ? '<ul>' + children.join('') + '</ul>' : ''}
      </li>`)
      return resItems;
    }, []);
    this.treeEl.querySelector('ul').insertAdjacentHTML('afterbegin',
      resItems.join('')
    )
    const treeCheckboxes = Array.from(this.element.querySelectorAll('.treeCheckbox[type=checkbox]'));
    this.checkFilteredCheckboxes(treeCheckboxes);
    treeCheckboxes.forEach(el => {
      el.addEventListener('change', (e) => {
        this.toggleTreeCheckboxes(e)
      })
    });
  }

  this.show = function () {
    View.prototype.show.call(this);
    this.treeEl = document.getElementById('structureTree');
    this.toggleAll = document.getElementById('toggleAll');
    this.flashGlobal = document.getElementById('flushGlobal');
    this.render();
  }
};

StructureView.prototype = Object.assign(Object.create(View.prototype), {
  containerSelector: '#menu',
  templatePath: 'modules/structure/structure.html',
  templateSelector: '#structure'
});

StructureView.prototype.constructor = StructureView;